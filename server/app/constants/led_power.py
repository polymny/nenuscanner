LED_POWER_MIN = 0.0
LED_POWER_MAX = 1.0
LED_POWER_STEP = 0.1


def get_led_power_values() -> list[float]:
    values: list[float] = []
    current = LED_POWER_MIN
    while current <= LED_POWER_MAX + 1e-9:
        values.append(round(current, 1))
        current += LED_POWER_STEP
    return values
