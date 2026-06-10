from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.shutter_speed_value_dto import ShutterSpeedValueReadSchema
from ..models.shutter_speed_value import ShutterSpeedValue
from ...sa_db import db_session

blp = Blueprint('shutter-speed-value', __name__, description='Shutter speed value endpoints')


@blp.route('/')
class ShutterSpeedValueController(MethodView):
    @blp.response(200, ShutterSpeedValueReadSchema(many=True))
    def get(self):
        """Liste toutes les valeurs de temps de pose disponibles."""
        rows = db_session.query(ShutterSpeedValue).order_by(ShutterSpeedValue.id.asc()).all()
        return [{'id': row.id, 'value': row.value} for row in rows]
