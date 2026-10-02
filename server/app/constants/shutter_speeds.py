import math

RELATIVE_SHUTTER_SPEED_MIN = 1 / 100
RELATIVE_SHUTTER_SPEED_MAX = 100
SHUTTER_SPEED_SIDES_COUNT = 10


def _create_log_spaced_values(min_val: float, max_val: float, count: int) -> list[float]:
    min_log = math.log10(min_val)
    max_log = math.log10(max_val)
    return [float(f'{10 ** (min_log + (i / (count - 1)) * (max_log - min_log)):.4g}') for i in range(count)]


def get_relative_shutter_speed_values() -> list[float]:
    below_reference = _create_log_spaced_values(RELATIVE_SHUTTER_SPEED_MIN, 1, SHUTTER_SPEED_SIDES_COUNT + 1)
    above_reference = _create_log_spaced_values(1, RELATIVE_SHUTTER_SPEED_MAX, SHUTTER_SPEED_SIDES_COUNT + 1)[1:]
    return below_reference + above_reference
