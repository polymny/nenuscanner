"""Build and execute scenario capture steps (mock capture via Picsum for now)."""

from __future__ import annotations

import time
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy.orm import Session, joinedload

from .sse_job_runner import SseJobContext
from ..models.acquisition import Acquisition
from ..models.acquisition_photo import AcquisitionPhoto
from ..models.scenario import Scenario, ScenarioLED, ScenarioRotation, ScenarioShutterSpeed

STEP_DELAY_SECONDS = 1
POC_IMAGE_SIZE = '800/600'
SERVER_ROOT = Path(__file__).resolve().parents[2]


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
    """
    rotations = sorted(scenario.rotations, key=lambda row: row.radians_value)
    rotation_slots = rotations if rotations else [None]
    leds = list(scenario.leds)
    shutter_speeds = list(scenario.shutter_speeds)
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
        'ledPower': step.led.power,
        'shutterSpeedIndex': step.shutter_speed_index,
        'shutterSpeedTotal': step.shutter_speed_total,
        'shutterSpeedRelative': step.shutter_speed.relative_value,
    }


def execute_scenario_mock(
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
            joinedload(Scenario.leds),
            joinedload(Scenario.shutter_speeds),
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

    for step in steps:
        filename = (
            f'photo-r{step.rotation.id if step.rotation else 0}'
            f'-l{step.led.id}-s{step.shutter_speed.id}-{step.step_index:04d}.jpg'
        )
        relative_path = photo_relative_path(acquisition_id, filename)
        file_path = SERVER_ROOT / relative_path

        seed = (
            f'nenuscanner-{acquisition_id}-r{step.rotation.id if step.rotation else 0}'
            f'-l{step.led.id}-s{step.shutter_speed.id}'
        )
        source_url = f'https://picsum.photos/seed/{seed}/{POC_IMAGE_SIZE}'
        urllib.request.urlretrieve(source_url, file_path)

        photo = AcquisitionPhoto(
            path=relative_path,
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
                'imageUrl': photo_path_to_url(relative_path),
                **_scenario_progress_payload(step),
            },
        )
        session.commit()

        if step.step_index < total:
            time.sleep(STEP_DELAY_SECONDS)
