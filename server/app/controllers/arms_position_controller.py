from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.arms_position_dto import ArmsPositionReadSchema
from ..models.arms_position import ArmsPosition
from ..services.arms_position_service import get_last_arms_position, increase_arms_position
from ...db import db_session

blp = Blueprint('arms-position', __name__, description='Positions des bras')


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
        arms_position = get_last_arms_position(db_session)
        db_session.commit()
        return _arms_position_to_dto(arms_position)


@blp.route('/increase')
class ArmsPositionIncreaseController(MethodView):
    @blp.response(201, ArmsPositionReadSchema)
    def post(self):
        """Crée une nouvelle position avec 2 emojis aléatoires."""
        arms_position = increase_arms_position(db_session)
        db_session.commit()
        return _arms_position_to_dto(arms_position)
