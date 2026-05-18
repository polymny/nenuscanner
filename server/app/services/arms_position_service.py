from ..models.arms_position import ArmsPosition
from ..services.emoji_service import random_two_simple_emojis
from ...sa_db import db_session


def get_last_arms_position() -> ArmsPosition:
    last = db_session.query(ArmsPosition).order_by(ArmsPosition.index.desc()).limit(1).one_or_none()
    if last is not None:
        return last

    emoji_left, emoji_right = random_two_simple_emojis()
    arms_position = ArmsPosition(index=1, emoji_left=emoji_left, emoji_right=emoji_right)
    db_session.add(arms_position)
    db_session.flush()
    return arms_position
