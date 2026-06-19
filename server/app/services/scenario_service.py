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


def is_scenario_calibrated(
    target_scenario: Scenario,
    all_scenarios: list[Scenario],
    scenario_ids_with_completed_calibration: set[int],
) -> bool:
    """Vrai si le scénario cible a un étalonnage terminé, ou est compatible avec un scénario qui en a un."""
    if target_scenario.id in scenario_ids_with_completed_calibration:
        return True

    scenarios_by_id = {scenario.id: scenario for scenario in all_scenarios}
    return any(
        scenarios_are_compatible(target_scenario, scenarios_by_id[calibrated_scenario_id])
        for calibrated_scenario_id in scenario_ids_with_completed_calibration
    )


def compatible_scenario_ids(scenario: Scenario, all_scenarios: list[Scenario]) -> set[int]:
    return {
        other.id for other in all_scenarios if other.id != scenario.id and scenarios_are_compatible(scenario, other)
    }


def scenarios_are_compatible(a: Scenario, b: Scenario) -> bool:
    leds_a = sorted((led.led_value, led.led_power_value_id) for led in a.leds)
    leds_b = sorted((led.led_value, led.led_power_value_id) for led in b.leds)
    if leds_a != leds_b:
        return False

    shutter_speeds_a = sorted(ss.shutter_speed_value_id for ss in a.shutter_speeds)
    shutter_speeds_b = sorted(ss.shutter_speed_value_id for ss in b.shutter_speeds)
    return shutter_speeds_a == shutter_speeds_b


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
