import math

from sqlalchemy import func

from ..models.scenario import (
    Scenario,
    ScenarioLED,
    ScenarioRotation,
    ScenarioShutterSpeed,
)


def scenario_summary_dto(scenario: Scenario) -> dict:
    return {
        'id': scenario.id,
        'name': scenario.name,
        'leds': [{'value': led.led_value, 'power': led.power} for led in scenario.leds],
        'rotationsCount': len(scenario.rotations),
        'shutterSpeeds': [ss.relative_value for ss in scenario.shutter_speeds],
    }


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


def duplicate_scenario(source: Scenario, new_name: str) -> Scenario:
    duplicated = Scenario(name=new_name, is_custom=True)

    duplicated.leds = [ScenarioLED(led_value=led.led_value, power=led.power) for led in source.leds]
    duplicated.shutter_speeds = [ScenarioShutterSpeed(relative_value=ss.relative_value) for ss in source.shutter_speeds]
    duplicated.rotations = [ScenarioRotation(radians_value=r.radians_value) for r in source.rotations]

    duplicated.updated_at = func.now()
    return duplicated
