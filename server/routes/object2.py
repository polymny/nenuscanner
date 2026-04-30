from flask.views import MethodView
from flask_smorest import Blueprint, abort
from sqlalchemy.exc import OperationalError

from ..models_sa import Object2
from ..sa_db import db_session
from ..schemas.object2 import Object2ReadSchema

blp = Blueprint('object2', __name__, description='Object2 endpoints')


@blp.route('/first')
class Object2FirstResource(MethodView):
    @blp.response(200, Object2ReadSchema)
    @blp.alt_response(404, description='object2 table is empty')
    @blp.alt_response(503, description='DB not initialized / unavailable')
    def get(self):
        """
        Returns the first Object2 row (SQLAlchemy) or an error.
        """
        try:
            obj = db_session.query(Object2).order_by(Object2.id.asc()).first()
        except OperationalError:
            abort(503, message='db_not_initialized')

        if obj is None:
            abort(404, message='empty', errors={'detail': 'object2 table is empty'})

        return obj
