from __future__ import annotations

import time
import urllib.request
from collections.abc import Callable
from dataclasses import dataclass

from sqlalchemy.orm import Session, joinedload

from .exiftool_service import write_jpeg_preview_from_raw
from .gphoto2_service import capture_raw_to_file
from .sse_job_runner import JobCancelled, SseJobContext
from ..constants.leds import LEDS_COUNT
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.acquisition_image import AcquisitionImage
from ..models.scenario import Scenario, ScenarioLED, ScenarioShutterSpeed
from ..paths import SERVER_ROOT
from ... import config, leds, turntable

STEP_DELAY_SECONDS = 1
POC_IMAGE_SIZE = '800/600'


class AcquisitionPaused(Exception):
    """Levée lorsqu'une acquisition avec poses manuelles est mise en pause."""


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
    Applique la valeur LED du scénario au matériel, avec un minimum de commutations.

    `led_value` est soit :
    - 'NO_LED' (tout éteindre)
    - 'ALL_LEDS' (tout allumer)
    - un index numérique '1'..'N' (index dans config.LEDS_UUIDS)
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
    pose_index: int
    pose_total: int
    led: ScenarioLED
    shutter_speed: ScenarioShutterSpeed
    led_index: int
    led_total: int
    shutter_speed_index: int
    shutter_speed_total: int

    @property
    def has_multiple_poses(self) -> bool:
        return self.pose_total > 1


def build_scenario_capture_steps(scenario: Scenario) -> list[ScenarioCaptureStep]:
    """
    Ordre : pour chaque pose, pour chaque LED, pour chaque temps de pose.

    Les LEDs sont appliquées dans l'ordre NO_LED, puis les valeurs numériques croissantes, puis ALL_LEDS.
    Les temps de pose sont appliqués par valeur relative croissante.
    """
    pose_total = scenario.poses_count
    pose_slots = list(range(1, pose_total + 1))
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

    led_total = len(leds)
    shutter_total = len(shutter_speeds)

    steps: list[ScenarioCaptureStep] = []
    step_index = 0
    for pose_index in pose_slots:
        for led_index, led in enumerate(leds):
            for shutter_speed_index, shutter_speed in enumerate(shutter_speeds):
                step_index += 1
                steps.append(
                    ScenarioCaptureStep(
                        step_index=step_index,
                        pose_index=pose_index,
                        pose_total=pose_total,
                        led=led,
                        shutter_speed=shutter_speed,
                        led_index=led_index + 1,
                        led_total=led_total,
                        shutter_speed_index=shutter_speed_index + 1,
                        shutter_speed_total=shutter_total,
                    )
                )
    return steps


def _scenario_progress_payload(step: ScenarioCaptureStep) -> dict:
    return {
        'step': step.step_index,
        'poseIndex': step.pose_index,
        'poseTotal': step.pose_total,
        'hasMultiplePoses': step.has_multiple_poses,
        'ledIndex': step.led_index,
        'ledTotal': step.led_total,
        'ledValue': step.led.led_value,
        'ledPower': step.led.led_power_value.value,
        'shutterSpeedIndex': step.shutter_speed_index,
        'shutterSpeedTotal': step.shutter_speed_total,
        'shutterSpeedRelative': step.shutter_speed.shutter_speed_value.value,
    }


def _is_end_of_pose_block(step: ScenarioCaptureStep) -> bool:
    if not step.has_multiple_poses or step.pose_index >= step.pose_total:
        return False
    return step.led_index == step.led_total and step.shutter_speed_index == step.shutter_speed_total


def _steps_from_current(acquisition: Acquisition, steps: list[ScenarioCaptureStep]) -> list[ScenarioCaptureStep]:
    if acquisition.current_step is None:
        return steps
    if acquisition.current_step < 1 or acquisition.current_step > len(steps):
        raise ValueError('invalid-current-step')
    return [step for step in steps if step.step_index >= acquisition.current_step]


def execute_scenario(
    context: SseJobContext,
    session: Session,
    acquisition: Acquisition,
    *,
    image_relative_path: Callable[[int, str], str],
    image_path_to_url: Callable[[str], str],
) -> list[str]:
    """
    Exécute toutes les étapes du scénario ;
    persiste les photos et émet des événements SSE. Retourne les URLs des photos.
    """
    scenario = (
        session.query(Scenario)
        .options(
            joinedload(Scenario.leds).joinedload(ScenarioLED.led_power_value),
            joinedload(Scenario.shutter_speeds).joinedload(ScenarioShutterSpeed.shutter_speed_value),
        )
        .filter(Scenario.id == acquisition.scenario_id)
        .one()
    )

    steps = build_scenario_capture_steps(scenario)
    total = len(steps)
    steps_to_run = _steps_from_current(acquisition, steps)
    acquisition_id = acquisition.id

    output_dir = SERVER_ROOT / 'data' / 'acquisitions' / str(acquisition_id)
    output_dir.mkdir(parents=True, exist_ok=True)

    context.emit(
        'started',
        {
            'total': total,
            **(_scenario_progress_payload(steps_to_run[0]) if steps_to_run else {}),
        },
    )

    gpio_leds = leds.get()
    led_state = _LedState()
    gpio_leds.off()
    plate = turntable.get()

    # TODO : déclenchement autofocus temporaire au démarrage de l'acquisition
    # gpio_leds.on()
    # trigger_autofocus()
    # gpio_leds.off()

    for step in steps_to_run:
        if context.is_cancelled():
            raise JobCancelled()

        _apply_led_value(gpio_leds, step.led.led_value, led_state)

        base = f'image-r{step.pose_index}-l{step.led.id}-s{step.shutter_speed.id}-{step.step_index:04d}'
        preview_relative_path = image_relative_path(acquisition_id, f'{base}.jpg')
        raw_ext = getattr(config, 'CAMERA_RAW_EXTENSION', 'nef')  # repli sur l'extension RAW Nikon
        raw_relative_path = image_relative_path(acquisition_id, f'{base}.{raw_ext}')

        if config.CAMERA == 'real':
            cam = acquisition.camera_settings
            target_shutter_speed = float(cam.absolute_shutter_speed_value) * float(
                step.shutter_speed.shutter_speed_value.value
            )
            # TODO : correction temporaire pour ALL_LEDS
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
            seed = f'nenuscanner-{acquisition_id}-r{step.pose_index}-l{step.led.id}-s{step.shutter_speed.id}'
            source_url = f'https://picsum.photos/seed/{seed}/{POC_IMAGE_SIZE}'
            urllib.request.urlretrieve(source_url, SERVER_ROOT / preview_relative_path)
            raw_relative_path = preview_relative_path

        image = AcquisitionImage(
            preview_path=preview_relative_path,
            raw_path=raw_relative_path,
            acquisition_id=acquisition_id,
            pose_index=step.pose_index,
            scenario_shutter_speed_id=step.shutter_speed.id,
            scenario_led_id=step.led.id,
        )
        session.add(image)
        session.flush()

        context.emit(
            'image_ready',
            {
                'total': total,
                'imageUrl': image_path_to_url(preview_relative_path),
                **_scenario_progress_payload(step),
            },
        )
        session.commit()

        if _is_end_of_pose_block(step) and not acquisition.automatic_pose_change:
            gpio_leds.off()
            acquisition.status = AcquisitionStatus.PAUSED
            acquisition.current_step = step.step_index + 1
            session.commit()
            time.sleep(0.7)
            context.emit('paused', {'acquisitionId': acquisition.id})
            raise AcquisitionPaused()

        if _is_end_of_pose_block(step) and acquisition.automatic_pose_change:
            plate.turn(round(360 / scenario.poses_count))
            if not plate.is_dummy():
                time.sleep(30)  # TODO : temporaire, pas d'ACK de la part du plateau pour l'instant
                plate.disable()

        if step.step_index < total and config.CAMERA != 'real':
            time.sleep(STEP_DELAY_SECONDS)

    gpio_leds.off()
