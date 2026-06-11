from __future__ import annotations

import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session, joinedload

from .exiftool_service import write_jpeg_preview_from_raw
from .gphoto2_service import capture_raw_to_file
from .sse_job_runner import JobCancelled, SseJobContext
from ..constants.leds import LEDS_COUNT
from ..models.acquisition import Acquisition
from ..models.acquisition_photo import AcquisitionPhoto
from ..models.scenario import Scenario, ScenarioLED, ScenarioRotation, ScenarioShutterSpeed
from ... import config, leds

STEP_DELAY_SECONDS = 1
POC_IMAGE_SIZE = '800/600'
SERVER_ROOT = Path(__file__).resolve().parents[2]


@dataclass
class _LedState:
    current_led_uuid: int | None = None
    all_leds: bool = False


def _led_index_to_uuid(led_index: int) -> int:
    if led_index < 1 or led_index > len(config.LEDS_UUIDS):
        raise ValueError(f'invalid-led-index:{led_index}')
    return int(config.LEDS_UUIDS[led_index - 1])


def _apply_led_value(gpio_leds: leds.Leds, led_value: str, state: _LedState) -> None:
    """
    Apply scenario LED value to hardware, with minimal switching.

    `led_value` is either:
    - 'NO_LED' (turn off all)
    - 'ALL_LEDS' (turn on all)
    - a numeric index '1'..'N' (index into config.LEDS_UUIDS)
    """
    if led_value == 'NO_LED':
        if state.all_leds or state.current_led_uuid is not None:
            gpio_leds.off()
            state.current_led_uuid = None
            state.all_leds = False
        return

    if led_value == 'ALL_LEDS':
        if not state.all_leds:
            gpio_leds.on()
            state.current_led_uuid = None
            state.all_leds = True
        return

    next_led_uuid = _led_index_to_uuid(int(led_value))

    if state.all_leds:
        gpio_leds.off()
        state.all_leds = False

    if next_led_uuid != state.current_led_uuid:
        if state.current_led_uuid is not None:
            gpio_leds.get_by_uuid(state.current_led_uuid).off()
        gpio_leds.get_by_uuid(next_led_uuid).on()
        state.current_led_uuid = next_led_uuid


@dataclass(frozen=True)
class ScenarioCaptureStep:
    step_index: int
    rotation: ScenarioRotation | None
    led: ScenarioLED
    shutter_speed: ScenarioShutterSpeed
    rotation_index: int
    rotation_total: int
    led_index: int
    led_total: int
    shutter_speed_index: int
    shutter_speed_total: int

    @property
    def has_rotations(self) -> bool:
        return self.rotation_total > 0


def build_scenario_capture_steps(scenario: Scenario) -> list[ScenarioCaptureStep]:
    """
    Order: for each rotation (or one fixed position if none), for each LED, for each shutter speed.

    LEDs are applied as NO_LED, then numeric values ascending, then ALL_LEDS.
    Shutter speeds are applied in ascending relative value order.
    """
    rotations = sorted(scenario.rotations, key=lambda row: row.radians_value)
    rotation_slots = rotations if rotations else [None]
    leds = sorted(
        scenario.leds,
        key=lambda led: (
            0 if led.led_value == 'NO_LED' else 2 if led.led_value == 'ALL_LEDS' else 1,
            0 if led.led_value in ('NO_LED', 'ALL_LEDS') else int(led.led_value),
        ),
    )
    shutter_speeds = sorted(scenario.shutter_speeds, key=lambda ss: ss.shutter_speed_value.value)
    if not leds or not shutter_speeds:
        raise ValueError('scenario-missing-leds-or-shutter-speeds')

    rotation_total = len(rotations)
    led_total = len(leds)
    shutter_total = len(shutter_speeds)

    steps: list[ScenarioCaptureStep] = []
    step_index = 0
    for rotation_index, rotation in enumerate(rotation_slots):
        for led_index, led in enumerate(leds):
            for shutter_speed_index, shutter_speed in enumerate(shutter_speeds):
                step_index += 1
                steps.append(
                    ScenarioCaptureStep(
                        step_index=step_index,
                        rotation=rotation,
                        led=led,
                        shutter_speed=shutter_speed,
                        rotation_index=rotation_index + 1 if rotation_total > 0 else 0,
                        rotation_total=rotation_total,
                        led_index=led_index + 1,
                        led_total=led_total,
                        shutter_speed_index=shutter_speed_index + 1,
                        shutter_speed_total=shutter_total,
                    )
                )
    return steps


def _scenario_progress_payload(step: ScenarioCaptureStep) -> dict:
    rotation = step.rotation
    return {
        'step': step.step_index,
        'rotationIndex': step.rotation_index,
        'rotationTotal': step.rotation_total,
        'hasRotations': step.has_rotations,
        'rotationRadians': rotation.radians_value if rotation is not None else None,
        'ledIndex': step.led_index,
        'ledTotal': step.led_total,
        'ledValue': step.led.led_value,
        'ledPower': step.led.led_power_value.value,
        'shutterSpeedIndex': step.shutter_speed_index,
        'shutterSpeedTotal': step.shutter_speed_total,
        'shutterSpeedRelative': step.shutter_speed.shutter_speed_value.value,
    }


def execute_scenario(
    context: SseJobContext,
    session: Session,
    acquisition: Acquisition,
    *,
    photo_relative_path,
    photo_path_to_url,
) -> list[str]:
    """Run all scenario steps; persist photos and emit SSE events. Returns image URLs."""
    scenario = (
        session.query(Scenario)
        .options(
            joinedload(Scenario.leds).joinedload(ScenarioLED.led_power_value),
            joinedload(Scenario.shutter_speeds).joinedload(ScenarioShutterSpeed.shutter_speed_value),
            joinedload(Scenario.rotations),
        )
        .filter(Scenario.id == acquisition.scenario_id)
        .one()
    )

    steps = build_scenario_capture_steps(scenario)
    total = len(steps)
    acquisition_id = acquisition.id

    output_dir = SERVER_ROOT / 'data' / 'acquisitions' / str(acquisition_id)
    output_dir.mkdir(parents=True, exist_ok=True)

    context.emit(
        'started',
        {
            'total': total,
            **(_scenario_progress_payload(steps[0]) if steps else {}),
        },
    )

    gpio_leds = leds.get()
    led_state = _LedState()
    gpio_leds.off()

    # TODO : temporary trigger autofocus on start acquisition
    # gpio_leds.on()
    # trigger_autofocus()
    # gpio_leds.off()

    for step in steps:
        if context.is_cancelled():
            raise JobCancelled()

        _apply_led_value(gpio_leds, step.led.led_value, led_state)

        base = (
            f'photo-r{step.rotation.id if step.rotation else 0}'
            f'-l{step.led.id}-s{step.shutter_speed.id}-{step.step_index:04d}'
        )
        preview_relative_path = photo_relative_path(acquisition_id, f'{base}.jpg')
        raw_ext = getattr(config, 'CAMERA_RAW_EXTENSION', 'nef')  # fallback on Nikon RAW extension
        raw_relative_path = photo_relative_path(acquisition_id, f'{base}.{raw_ext}')

        if config.CAMERA == 'real':
            cam = acquisition.camera_settings
            target_shutter_speed = float(cam.absolute_shutter_speed_value) * float(
                step.shutter_speed.shutter_speed_value.value
            )
            # TODO : temporary fix for ALL_LEDS
            if step.led.led_value == 'ALL_LEDS':
                target_shutter_speed /= LEDS_COUNT
            raw_file_path = str(SERVER_ROOT / raw_relative_path)
            preview_file_path = str(SERVER_ROOT / preview_relative_path)
            capture_raw_to_file(
                raw_file_path,
                shutterspeed_value=target_shutter_speed,
                iso_value=float(cam.iso_value),
                aperture_value=float(cam.aperture_value),
            )
            write_jpeg_preview_from_raw(raw_file_path, preview_file_path)
        else:
            seed = (
                f'nenuscanner-{acquisition_id}-r{step.rotation.id if step.rotation else 0}'
                f'-l{step.led.id}-s{step.shutter_speed.id}'
            )
            source_url = f'https://picsum.photos/seed/{seed}/{POC_IMAGE_SIZE}'
            urllib.request.urlretrieve(source_url, SERVER_ROOT / preview_relative_path)
            raw_relative_path = preview_relative_path

        photo = AcquisitionPhoto(
            preview_path=preview_relative_path,
            raw_path=raw_relative_path,
            acquisition_id=acquisition_id,
            scenario_rotation_id=step.rotation.id if step.rotation is not None else None,
            scenario_shutter_speed_id=step.shutter_speed.id,
            scenario_led_id=step.led.id,
        )
        session.add(photo)
        session.flush()

        context.emit(
            'photo_ready',
            {
                'total': total,
                'imageUrl': photo_path_to_url(preview_relative_path),
                **_scenario_progress_payload(step),
            },
        )
        session.commit()

        if step.step_index < total and config.CAMERA != 'real':
            time.sleep(STEP_DELAY_SECONDS)

    gpio_leds.off()
