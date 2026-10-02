from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.relative_shutter_speed_value_dto import RelativeShutterSpeedValueReadSchema
from ..models.relative_shutter_speed_value import RelativeShutterSpeedValue
from ...db import db_session

blp = Blueprint('relative-shutter-speed-value', __name__, description='Valeurs de temps de pose relatives')


def _relative_shutter_speed_value_to_dto(relative_shutter_speed_value: RelativeShutterSpeedValue) -> dict:
    return {'id': relative_shutter_speed_value.id, 'value': relative_shutter_speed_value.value}


@blp.route('/')
class RelativeShutterSpeedValueController(MethodView):
    @blp.response(200, RelativeShutterSpeedValueReadSchema(many=True))
    def get(self):
        """Liste toutes les valeurs de temps de pose relatives disponibles."""
        relative_shutter_speed_values = (
            db_session.query(RelativeShutterSpeedValue)
            .order_by(RelativeShutterSpeedValue.id.asc())
            .all()
        )
        return [
            _relative_shutter_speed_value_to_dto(relative_shutter_speed_value)
            for relative_shutter_speed_value in relative_shutter_speed_values
        ]
