from datetime import datetime

from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.camera_dto import CameraFocusAreaUpdateSchema, CameraSettingsSchema, CameraSettingUpdateSchema
from ..paths import SERVER_ROOT
from ..services.camera_settings_service import (
    get_camera_settings,
    persist_current_camera_settings,
    refresh_available_camera_values,
)
from ..services.exiftool_service import write_jpeg_preview_from_raw
from ..services.gphoto2_service import (
    capture_raw_to_file,
    set_camera_setting,
    set_focus_area,
    trigger_autofocus,
)
from ... import config
from ...db import db_session

blp = Blueprint('camera', __name__, description='Réglages caméra')


@blp.route('/settings')
class CameraSettingsController(MethodView):
    @blp.response(200, CameraSettingsSchema)
    def get(self):
        """Retourne les réglages ISO, temps de pose et ouverture de la caméra."""
        try:
            return get_camera_settings(db_session)
        except ValueError as error:
            abort(400, message=str(error))

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


@blp.route('/change')
class CameraChangeController(MethodView):
    @blp.response(204)
    def post(self):
        """Réinitialise les valeurs caméra disponibles depuis l'appareil connecté."""
        try:
            refresh_available_camera_values(db_session)
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


@blp.route('/calibration-capture')
class CameraCalibrationCaptureController(MethodView):
    @blp.response(200)
    def post(self):
        """Capture une photo pour chaque temps de pose disponible sur la caméra."""
        if config.CAMERA != 'real':
            abort(400, 'camera-not-available')

        try:
            settings = get_camera_settings(db_session)
        except ValueError as error:
            abort(400, message=str(error))
        shutter_speeds = settings['shutterSpeedValues']
        iso_value = float(settings['currentIsoValue'])
        aperture_value = float(settings['currentApertureValue'])

        session_dir = SERVER_ROOT / 'data' / 'camera_calibration' / datetime.now().strftime('%Y%m%d-%H%M%S')
        session_dir.mkdir(parents=True, exist_ok=True)

        raw_ext = getattr(config, 'CAMERA_RAW_EXTENSION', 'nef')
        images: list[dict] = []

        for index, shutter_speed in enumerate(shutter_speeds, start=1):
            label = f'{float(shutter_speed):g}'.replace('.', '_')
            base = f'{index:03d}-shutter-{label}'
            raw_path = session_dir / f'{base}.{raw_ext}'
            preview_path = session_dir / f'{base}.jpg'

            capture_raw_to_file(
                str(raw_path),
                shutterspeed_value=float(shutter_speed),
                iso_value=iso_value,
                aperture_value=aperture_value,
            )
            write_jpeg_preview_from_raw(str(raw_path), str(preview_path))
            saved_raw_path = raw_path

            images.append(
                {
                    'shutterSpeed': float(shutter_speed),
                    'rawPath': str(saved_raw_path.relative_to(SERVER_ROOT)),
                    'previewPath': str(preview_path.relative_to(SERVER_ROOT)),
                }
            )

        return {
            'directory': str(session_dir.relative_to(SERVER_ROOT)),
            'images': images,
        }
