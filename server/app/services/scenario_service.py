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
        'leds': [{'value': led.led_value, 'powerId': led.led_power_value_id} for led in scenario.leds],
        'rotationsCount': len(scenario.rotations),
        'shutterSpeedIds': [ss.shutter_speed_value_id for ss in scenario.shutter_speeds],
    }


def apply_scenario_payload(scenario: Scenario, payload: dict) -> None:
    scenario.name = payload['name']

    scenario.leds = [ScenarioLED(led_value=led['value'], led_power_value_id=led['powerId']) for led in payload['leds']]
    scenario.shutter_speeds = [
        ScenarioShutterSpeed(shutter_speed_value_id=shutter_speed_id) for shutter_speed_id in payload['shutterSpeedIds']
    ]

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

    duplicated.leds = [
        ScenarioLED(led_value=led.led_value, led_power_value_id=led.led_power_value_id) for led in source.leds
    ]
    duplicated.shutter_speeds = [
        ScenarioShutterSpeed(shutter_speed_value_id=ss.shutter_speed_value_id) for ss in source.shutter_speeds
    ]
    duplicated.rotations = [ScenarioRotation(radians_value=r.radians_value) for r in source.rotations]

    duplicated.updated_at = func.now()
    return duplicated
