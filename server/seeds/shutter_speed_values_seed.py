from sqlalchemy.orm import Session

from ..app.constants.shutter_speeds import get_shutter_speed_values
from ..app.models.shutter_speed_value import ShutterSpeedValue


def seed(session: Session) -> None:
    if session.query(ShutterSpeedValue).count() > 0:
        return

    for value in get_shutter_speed_values():
        session.add(ShutterSpeedValue(value=value))
