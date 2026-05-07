import math

from sqlalchemy import func

from ..models.scenario import (
    Scenario,
    ScenarioLED,
    ScenarioRotation,
    ScenarioShutterSpeed,
)


def apply_scenario_payload(scenario: Scenario, payload: dict) -> None:
    scenario.name = payload['name']

    scenario.leds = [ScenarioLED(led_value=led['value'], power=led['power']) for led in payload['leds']]
    scenario.shutter_speeds = [ScenarioShutterSpeed(relative_value=value) for value in payload['shutterSpeeds']]

    # Rotations stored as radians (2π / N)
    rotations_count = payload['rotationsCount']
    if rotations_count > 0:
        step = (2 * math.pi) / rotations_count
        scenario.rotations = [ScenarioRotation(radians_value=i * step) for i in range(rotations_count)]
    else:
        scenario.rotations = []

    scenario.updated_at = func.now()
