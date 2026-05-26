from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.camera_dto import CameraSettingsSchema, CameraSettingUpdateSchema
from ..services.gphoto2_service import get_camera_settings, set_camera_setting, trigger_autofocus

blp = Blueprint('camera', __name__, description='Camera endpoints')


@blp.route('/settings')
class CameraSettingsController(MethodView):
    @blp.response(200, CameraSettingsSchema)
    def get(self):
        """Retourne les réglages ISO, temps de pose et ouverture de la caméra."""
        return get_camera_settings()

    @blp.arguments(CameraSettingUpdateSchema)
    @blp.response(204)
    def patch(self, payload):
        """Applique un réglage caméra (ISO, temps de pose ou ouverture)."""
        try:
            set_camera_setting(payload['setting'], payload['value'])
        except ValueError as error:
            abort(400, message=str(error))


@blp.route('/autofocus')
class CameraAutofocusController(MethodView):
    @blp.response(204)
    def post(self):
        """Déclenche l'autofocus de la caméra."""
        trigger_autofocus()
