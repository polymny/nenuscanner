from sqlalchemy.orm import Session

from ..app.constants.led_power import get_led_power_values
from ..app.models.led_power_value import LedPowerValue


def seed(session: Session) -> None:
    if session.query(LedPowerValue).count() > 0:
        return

    for value in get_led_power_values():
        session.add(LedPowerValue(value=value))
