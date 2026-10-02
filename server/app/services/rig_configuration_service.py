from sqlalchemy.orm import Session

from ..models.rig_configuration import RigConfiguration
from ..services.emoji_service import random_two_simple_emojis


def _get_last_rig_configuration_or_none(session: Session) -> RigConfiguration | None:
    return session.query(RigConfiguration).order_by(RigConfiguration.index.desc()).limit(1).one_or_none()


def _create_rig_configuration(session: Session, index: int) -> RigConfiguration:
    emoji_left, emoji_right = random_two_simple_emojis()
    rig_configuration = RigConfiguration(index=index, emoji_left=emoji_left, emoji_right=emoji_right)
    session.add(rig_configuration)
    session.flush()
    return rig_configuration


def get_last_rig_configuration(session: Session) -> RigConfiguration:
    last = _get_last_rig_configuration_or_none(session)
    if last is not None:
        return last
    return _create_rig_configuration(session, 1)


def increase_rig_configuration(session: Session) -> RigConfiguration:
    last = _get_last_rig_configuration_or_none(session)
    next_index = 0 if last is None else last.index + 1
    return _create_rig_configuration(session, next_index)
