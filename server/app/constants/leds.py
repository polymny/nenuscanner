LEDS_COUNT: int = 12

LED_NUMERIC_VALUES: tuple[str, ...] = tuple(str(i) for i in range(1, LEDS_COUNT + 1))
LED_SPECIAL_VALUES: tuple[str, ...] = ('ALL_LEDS', 'NO_LED')

LED_VALUES: tuple[str, ...] = (*LED_NUMERIC_VALUES, *LED_SPECIAL_VALUES)
