import subprocess

from flask import Blueprint, render_template

from . import acquisition, calibration, camera, leds, object, object2, test
from .. import db

blueprint = Blueprint('routes', __name__)


# Generic routes
@blueprint.route('/')
def index():
    """
    Serves the index of nenuscanner.
    """
    conn = db.get()
    projects = db.Object.all_by_project(conn)
    return render_template('index.html', projects=projects)


# Route that restarts the server
@blueprint.route('/restart')
def restart():
    """
    Serves the index of nenuscanner.
    """
    subprocess.Popen(
        ['bash', '-c', 'sleep 1 && systemctl restart nenuscanner --user'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    return render_template('restart.html')


blueprint.register_blueprint(object.blueprint, url_prefix='/object')
blueprint.register_blueprint(calibration.blueprint, url_prefix='/calibration')
blueprint.register_blueprint(acquisition.blueprint, url_prefix='/acquisition')
blueprint.register_blueprint(camera.blueprint, url_prefix='/camera')
blueprint.register_blueprint(leds.blueprint, url_prefix='/leds')


blueprint.register_blueprint(object2.blueprint, url_prefix='/object2')
blueprint.register_blueprint(test.blueprint, url_prefix='/test')
