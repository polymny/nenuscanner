from gpiozero import PWMLED

from . import config

GPIO_LED_MAX_PWM_VALUE = 0.8

class Leds:
    def on(self):
        pass

    def off(self):
        pass

class GpioLed:
    def __init__(self, gpio_pin: int):
        self.gpio_pin = gpio_pin
        self.led = PWMLED(
            self.gpio_pin,
            initial_value=1.0,
            frequency=200,
        )
        self.off()

    def set_value(self, value: float):
        value = min(1.0, max(0.0, value))
        self.led.value = 1.0 - GPIO_LED_MAX_PWM_VALUE * value

    def on(self):
        self.set_value(0)

    def off(self):
        self.set_value(1)

    def __str__(self):
        return f'LED{self.gpio_pin:02}'


class GpioLeds(Leds):
    def __init__(self, gpio_pins: list[int]):
        self._entered = False
        self.leds = []

        for pin in gpio_pins:
            self.leds.append(GpioLed(pin))

    def off(self):
        for led in self.leds:
            led.off()

    def on(self):
        for led in self.leds:
            led.on()

    def get_by_uuid(self, uuid: int) -> GpioLed:
        for led in self.leds:
            if led.gpio_pin == uuid:
                return led
        raise ValueError(f"No LED with UUID {uuid}")

class DummyLed:
    def __init__(self, gpio_pin: int):
        self.gpio_pin = gpio_pin
        self.value = 0

    def on(self):
        self.value = 1

    def off(self):
        self.value = 0

    def __str__(self):
        return f'LED{self.gpio_pin:02}'


class DummyLeds(Leds):
    def __init__(self, gpio_pins: list[int]):
        self.leds = []
        for pin in gpio_pins:
            self.leds.append(DummyLed(pin))

    def __enter__(self):
        for led in self.leds:
            led.enter()
        return self

    def __exit__(self, *args):
        for led in self.leds:
            led.exit()

    def off(self):
        for led in self.leds:
            led.off()

    def on(self):
        for led in self.leds:
            led.on()

    def enter(self):
        return self.__enter__()

    def exit(self,*args):
        self.__exit__(*args)

    def get_by_uuid(self, uuid: int) -> DummyLed:
        for led in self.leds:
            if led.gpio_pin == uuid:
                return led
        raise ValueError(f"No LED with UUID {uuid}")


_leds = GpioLeds(config.LEDS_UUIDS) if config.GPIO_CHIP is not None else DummyLeds(config.LEDS_UUIDS)


def get() -> Leds:
    return _leds
