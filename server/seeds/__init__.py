from sqlalchemy.orm import Session

from . import led_power_values_seed, shutter_speed_values_seed


def run_seeds(session: Session) -> None:
    led_power_values_seed.seed(session)
    shutter_speed_values_seed.seed(session)
    session.commit()
