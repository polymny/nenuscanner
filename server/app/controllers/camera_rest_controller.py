import json
import time

from flask import Response, stream_with_context
from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.camera_dto import CameraSettingsSchema, CameraSettingUpdateSchema
from ..services.gphoto2_service import (
    capture_preview,
    get_camera_settings,
    set_camera_setting,
    trigger_autofocus,
)

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


def _format_sse(event_type: str, payload: dict) -> str:
    return f'event: {event_type}\ndata: {json.dumps(payload)}\n\n'


@blp.route('/preview')
class CameraPreviewController(MethodView):
    def get(self):
        """Capture une prévisualisation et notifie le client via SSE."""

        def generate():
            yield _format_sse('started', {})
            while True:
                try:
                    path = capture_preview()
                    yield _format_sse(
                        'preview_ready',
                        {'path': path},
                    )
                    time.sleep(2)
                except GeneratorExit:
                    return
                except Exception as error:
                    yield _format_sse('failed', {'message': str(error)})
                    return

        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
            },
        )
