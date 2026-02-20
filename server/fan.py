from gpiozero import PWMLED

from . import config

class Fan:
    def __init__(self, uuid):
        self.inner = PWMLED(
            uuid,
            initial_value=1.0,
            frequency=1000
        )

    def set_value(self, value: float):
        value = min(1.0, max(0.0, value))
        self.led.value = 1.0 - value


class DummyFan:
    def __init__(self, uuid):
        self.uuid = uuid

    def set_value(self, value: float):
        pass


_fan = Fan(config.FAN_UUID) if config.FAN_UUID is not None else DummyFan(0)


def get() -> Fan:
    return _fan
