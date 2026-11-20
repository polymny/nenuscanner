import subprocess

from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..models.acquisition import Acquisition, AcquisitionStatus
from ... import config
from ...db import db_session

blp = Blueprint('system', __name__, description='Gestion du système')

# Delayed so that the HTTP response leaves before the network goes down.
SHUTDOWN_COMMAND = ['bash', '-c', 'sleep 1 && sudo -n systemctl poweroff']


@blp.route('/shutdown')
class SystemShutdownController(MethodView):
    @blp.response(202)
    def post(self):
        """Éteint la machine, sauf si une acquisition est en cours."""
        # Opt-in: the same backend runs on development machines, which must not be powered off from the UI.
        if not getattr(config, 'ALLOW_SHUTDOWN', False):
            abort(403, message='shutdown-disabled')
        running = db_session.query(Acquisition.id).filter(Acquisition.status == AcquisitionStatus.RUNNING).first()
        if running is not None:
            abort(409, message='acquisition-running')
        subprocess.Popen(SHUTDOWN_COMMAND, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
