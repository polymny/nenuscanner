from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.inspect_mode_dto import InspectModeLedSchema, InspectModeRotationSchema, InspectModeShutterSpeedSchema
from ..services.inspect_mode_service import (
    AcquisitionRunningError,
    leave_inspect_mode,
    set_led_inspect_mode,
    set_shutter_speed_inspect_mode,
    turn_inspect_mode_rotation,
)
from ...sa_db import db_session

blp = Blueprint('inspect-mode', __name__, description='Mode inspection')


@blp.route('/led')
class InspectModeLedController(MethodView):
    @blp.arguments(InspectModeLedSchema)
    @blp.response(204)
    def post(self, payload):
        """Allume la LED demandée en mode inspection (toutes les autres sont éteintes)."""
        try:
            set_led_inspect_mode(db_session, payload['value'])
        except AcquisitionRunningError:
            abort(409, message='acquisition-running')


@blp.route('/shutter-speed')
class InspectModeShutterSpeedController(MethodView):
    @blp.arguments(InspectModeShutterSpeedSchema)
    @blp.response(204)
    def post(self, payload):
        """Applique un temps de pose relatif en mode inspection."""
        try:
            set_shutter_speed_inspect_mode(db_session, payload['value'])
        except AcquisitionRunningError:
            abort(409, message='acquisition-running')
        except ValueError as error:
            abort(400, message=str(error))


@blp.route('/rotation')
class InspectModeRotationController(MethodView):
    @blp.arguments(InspectModeRotationSchema)
    @blp.response(204)
    def post(self, payload):
        """Tourne le plateau d'un pas selon le nombre de rotations du scénario."""
        try:
            turn_inspect_mode_rotation(db_session, payload['rotationsCount'])
        except AcquisitionRunningError:
            abort(409, message='acquisition-running')


@blp.route('/leave')
class InspectModeLeaveController(MethodView):
    @blp.response(204)
    def post(self):
        """Restaure l'état hors mode inspection (LEDs éteintes, temps de pose courant)."""
        try:
            leave_inspect_mode(db_session)
        except ValueError as error:
            abort(400, message=str(error))
