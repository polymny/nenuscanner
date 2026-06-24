from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.test_mode_dto import TestModeLedSchema, TestModeShutterSpeedSchema
from ..services.test_mode_service import (
    AcquisitionRunningError,
    leave_test_mode,
    set_led_test_mode,
    set_shutter_speed_test_mode,
)
from ...sa_db import db_session

blp = Blueprint('test-mode', __name__, description='Mode test')


@blp.route('/led')
class TestModeLedController(MethodView):
    @blp.arguments(TestModeLedSchema)
    @blp.response(204)
    def post(self, payload):
        """Allume la LED demandée en mode test (toutes les autres sont éteintes)."""
        try:
            set_led_test_mode(db_session, payload['value'])
        except AcquisitionRunningError:
            abort(409, message='acquisition-running')


@blp.route('/shutter-speed')
class TestModeShutterSpeedController(MethodView):
    @blp.arguments(TestModeShutterSpeedSchema)
    @blp.response(204)
    def post(self, payload):
        """Applique un temps de pose relatif en mode test."""
        try:
            set_shutter_speed_test_mode(db_session, payload['value'])
        except AcquisitionRunningError:
            abort(409, message='acquisition-running')
        except ValueError as error:
            abort(400, message=str(error))


@blp.route('/leave')
class TestModeLeaveController(MethodView):
    @blp.response(204)
    def post(self):
        """Restaure l'état hors mode test (LEDs éteintes, temps de pose courant)."""
        try:
            leave_test_mode(db_session)
        except ValueError as error:
            abort(400, message=str(error))
