from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.shutter_speed_value_dto import ShutterSpeedValueReadSchema
from ..models.shutter_speed_value import ShutterSpeedValue
from ...db import db_session

blp = Blueprint('shutter-speed-value', __name__, description='Valeurs de temps de pose')


def _shutter_speed_value_to_dto(shutter_speed_value: ShutterSpeedValue) -> dict:
    return {'id': shutter_speed_value.id, 'value': shutter_speed_value.value}


@blp.route('/')
class ShutterSpeedValueController(MethodView):
    @blp.response(200, ShutterSpeedValueReadSchema(many=True))
    def get(self):
        """Liste toutes les valeurs de temps de pose disponibles."""
        shutter_speed_values = (
            db_session.query(ShutterSpeedValue).order_by(ShutterSpeedValue.id.asc()).all()
        )
        return [
            _shutter_speed_value_to_dto(shutter_speed_value)
            for shutter_speed_value in shutter_speed_values
        ]
