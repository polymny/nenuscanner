from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.arms_position_dto import ArmsPositionReadSchema
from ..models.arms_position import ArmsPosition
from ..services.emoji_service import random_two_simple_emojis
from ...sa_db import db_session

blp = Blueprint('arms-position', __name__, description='Positions des bras')


def _get_last_by_index() -> ArmsPosition | None:
    return db_session.query(ArmsPosition).order_by(ArmsPosition.index.desc()).limit(1).one_or_none()


def _arms_position_to_dto(arms_position: ArmsPosition) -> dict:
    return {
        'id': arms_position.id,
        'index': arms_position.index,
        'emojiLeft': arms_position.emoji_left,
        'emojiRight': arms_position.emoji_right,
        'createdAt': arms_position.created_at,
    }


@blp.route('/last')
class ArmsPositionLastController(MethodView):
    @blp.response(200, ArmsPositionReadSchema)
    def get(self):
        """Retourne la dernière position de bras (index maximum)."""
        last = _get_last_by_index()
        if last is None:
            left, right = random_two_simple_emojis()
            arms_position = ArmsPosition(index=1, emoji_left=left, emoji_right=right)

            db_session.add(arms_position)
            db_session.commit()
            return _arms_position_to_dto(arms_position)
        return _arms_position_to_dto(last)


@blp.route('/increase')
class ArmsPositionIncreaseController(MethodView):
    @blp.response(201, ArmsPositionReadSchema)
    def post(self):
        """Crée une nouvelle position avec 2 emojis aléatoires."""
        last = _get_last_by_index()
        next_index = 0 if last is None else last.index + 1

        left, right = random_two_simple_emojis()
        arms_position = ArmsPosition(index=next_index, emoji_left=left, emoji_right=right)

        db_session.add(arms_position)
        db_session.commit()
        return _arms_position_to_dto(arms_position)
