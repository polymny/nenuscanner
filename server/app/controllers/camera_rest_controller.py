from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.camera_dto import CameraFocusAreaUpdateSchema, CameraSettingsSchema, CameraSettingUpdateSchema
from ..services.camera_settings_service import persist_current_camera_settings
from ..services.gphoto2_service import (
    get_camera_settings,
    set_camera_setting,
    set_focus_area,
    trigger_autofocus,
)
from ...sa_db import db_session

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
        """Applique un réglage caméra (ISO, temps de pose ou ouverture) et persiste l'état courant en DB."""
        try:
            set_camera_setting(payload['setting'], payload['value'])
            persist_current_camera_settings(db_session)
            db_session.commit()
        except ValueError as error:
            db_session.rollback()
            abort(400, message=str(error))
        except Exception:
            db_session.rollback()
            raise


@blp.route('/autofocus')
class CameraAutofocusController(MethodView):
    @blp.response(204)
    def post(self):
        """Déclenche l'autofocus de la caméra."""
        trigger_autofocus()


@blp.route('/focus-area')
class CameraFocusAreaController(MethodView):
    @blp.arguments(CameraFocusAreaUpdateSchema)
    @blp.response(204)
    def post(self, payload):
        """Déplace la zone AF (format 3:2) puis déclenche l'autofocus."""
        set_focus_area(payload['x'], payload['y'])
