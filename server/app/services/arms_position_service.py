from sqlalchemy.orm import Session

from ..models.arms_position import ArmsPosition
from ..services.emoji_service import random_two_simple_emojis


def _get_last_arms_position_or_none(session: Session) -> ArmsPosition | None:
    return (
        session.query(ArmsPosition)
        .order_by(ArmsPosition.index.desc())
        .limit(1)
        .one_or_none()
    )


def _create_arms_position(session: Session, index: int) -> ArmsPosition:
    emoji_left, emoji_right = random_two_simple_emojis()
    arms_position = ArmsPosition(index=index, emoji_left=emoji_left, emoji_right=emoji_right)
    session.add(arms_position)
    session.flush()
    return arms_position


def get_last_arms_position(session: Session) -> ArmsPosition:
    last = _get_last_arms_position_or_none(session)
    if last is not None:
        return last
    return _create_arms_position(session, 1)


def increase_arms_position(session: Session) -> ArmsPosition:
    last = _get_last_arms_position_or_none(session)
    next_index = 0 if last is None else last.index + 1
    return _create_arms_position(session, next_index)
