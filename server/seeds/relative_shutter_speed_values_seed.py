from sqlalchemy.orm import Session

from ..app.constants.shutter_speeds import get_relative_shutter_speed_values
from ..app.models.relative_shutter_speed_value import RelativeShutterSpeedValue


def seed(session: Session) -> None:
    if session.query(RelativeShutterSpeedValue).count() > 0:
        return

    for value in get_relative_shutter_speed_values():
        session.add(RelativeShutterSpeedValue(value=value))
