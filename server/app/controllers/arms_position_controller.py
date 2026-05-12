from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.arms_position_dto import ArmsPositionReadSchema
from ..models.arms_position import ArmsPosition
from ..services.emoji_service import random_two_simple_emojis
from ...sa_db import db_session

blp = Blueprint('arms-position', __name__, description='Arms position endpoints')


def _get_last_by_index() -> ArmsPosition | None:
    return db_session.query(ArmsPosition).order_by(ArmsPosition.index.desc()).limit(1).one_or_none()


def _to_dto(ap: ArmsPosition) -> dict:
    return {
        'id': ap.id,
        'index': ap.index,
        'emojiLeft': ap.emoji_left,
        'emojiRight': ap.emoji_right,
        'createdAt': ap.created_at,
    }


@blp.route('/last')
class ArmsPositionLastController(MethodView):
    @blp.response(200, ArmsPositionReadSchema)
    def get(self):
        """Retourne la dernière position de bras (index maximum)."""
        last = _get_last_by_index()
        if last is None:
            left, right = random_two_simple_emojis()
            ap = ArmsPosition(index=1, emoji_left=left, emoji_right=right)

            db_session.add(ap)
            db_session.commit()
            return _to_dto(ap)
        return _to_dto(last)


@blp.route('/increase')
class ArmsPositionIncreaseController(MethodView):
    @blp.response(201, ArmsPositionReadSchema)
    def post(self):
        """Crée une nouvelle position avec 2 emojis aléatoires."""
        last = _get_last_by_index()
        next_index = 0 if last is None else last.index + 1

        left, right = random_two_simple_emojis()
        ap = ArmsPosition(index=next_index, emoji_left=left, emoji_right=right)

        db_session.add(ap)
        db_session.commit()
        return _to_dto(ap)
