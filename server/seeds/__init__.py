from sqlalchemy.orm import Session

from . import led_power_values_seed, relative_shutter_speed_values_seed


def run_seeds(session: Session) -> None:
    led_power_values_seed.seed(session)
    relative_shutter_speed_values_seed.seed(session)
    session.commit()
