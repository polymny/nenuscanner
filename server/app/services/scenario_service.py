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

    # Rotations stockées en radians (2π / N)
    rotations_count = payload['rotationsCount']
    if rotations_count > 0:
        step = (2 * math.pi) / rotations_count
        scenario.rotations = [ScenarioRotation(radians_value=i * step) for i in range(rotations_count)]
    else:
        scenario.rotations = []

    scenario.updated_at = func.now()


def scenarios_have_same_led_values(a: Scenario, b: Scenario) -> bool:
    values_a = sorted(led.led_value for led in a.leds)
    values_b = sorted(led.led_value for led in b.leds)
    return values_a == values_b


def scenarios_have_same_led_power_values(a: Scenario, b: Scenario) -> bool:
    powers_by_led_value_a = {led.led_value: led.led_power_value_id for led in a.leds}
    powers_by_led_value_b = {led.led_value: led.led_power_value_id for led in b.leds}
    return powers_by_led_value_a == powers_by_led_value_b


def scenarios_have_same_shutter_speeds(a: Scenario, b: Scenario) -> bool:
    shutter_speeds_a = sorted(ss.shutter_speed_value_id for ss in a.shutter_speeds)
    shutter_speeds_b = sorted(ss.shutter_speed_value_id for ss in b.shutter_speeds)
    return shutter_speeds_a == shutter_speeds_b


def scenarios_have_same_rotations_count(a: Scenario, b: Scenario) -> bool:
    return len(a.rotations) == len(b.rotations)


def scenario_compatibility(reference: Scenario, other: Scenario) -> dict:
    return {
        'id': other.id,
        'sameLedPowerValues': scenarios_have_same_led_power_values(reference, other),
        'sameShutterSpeeds': scenarios_have_same_shutter_speeds(reference, other),
        'sameRotationsCount': scenarios_have_same_rotations_count(reference, other),
    }


def compatible_scenarios_details(reference: Scenario, all_scenarios: list[Scenario]) -> list[dict]:
    return [
        scenario_compatibility(reference, other)
        for other in all_scenarios
        if other.id != reference.id and scenarios_have_same_led_values(reference, other)
    ]


# def compatible_scenario_ids(scenario: Scenario, all_scenarios: list[Scenario]) -> set[int]:
#     return {
#         other.id for other in all_scenarios if other.id != scenario.id and scenarios_are_compatible(scenario, other)
#     }


# def scenarios_are_compatible(a: Scenario, b: Scenario) -> bool:
#     return (
#         scenarios_have_same_leds(a, b)
#         and scenarios_have_same_shutter_speeds(a, b)
#         and scenarios_have_same_rotations_count(a, b)
#     )


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
