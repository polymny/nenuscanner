from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.led_power_value_dto import LedPowerValueReadSchema
from ..models.led_power_value import LedPowerValue
from ...db import db_session

blp = Blueprint('led-power-value', __name__, description='Valeurs de puissance LED')


def _led_power_value_to_dto(led_power_value: LedPowerValue) -> dict:
    return {'id': led_power_value.id, 'value': led_power_value.value}


@blp.route('/')
class LedPowerValueController(MethodView):
    @blp.response(200, LedPowerValueReadSchema(many=True))
    def get(self):
        """Liste toutes les valeurs de puissance LED disponibles."""
        led_power_values = db_session.query(LedPowerValue).order_by(LedPowerValue.id.asc()).all()
        return [_led_power_value_to_dto(led_power_value) for led_power_value in led_power_values]
