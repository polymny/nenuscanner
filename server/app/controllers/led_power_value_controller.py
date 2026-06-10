from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.led_power_value_dto import LedPowerValueReadSchema
from ..models.led_power_value import LedPowerValue
from ...sa_db import db_session

blp = Blueprint('led-power-value', __name__, description='LED power value endpoints')


@blp.route('/')
class LedPowerValueController(MethodView):
    @blp.response(200, LedPowerValueReadSchema(many=True))
    def get(self):
        """Liste toutes les valeurs de puissance LED disponibles."""
        rows = db_session.query(LedPowerValue).order_by(LedPowerValue.id.asc()).all()
        return [{'id': row.id, 'value': row.value} for row in rows]
