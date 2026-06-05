import subprocess

from flask import Blueprint, render_template, send_file, send_from_directory

from . import (
    acquisition_controller,
    calibration_controller,
    camera_controller,
    leds_controller,
    object_controller,
    test_controller,
)

blueprint = Blueprint('routes', __name__)


@blueprint.route('/')
def index():
    return send_file('../frontend/dist/index.html')


@blueprint.route('/assets/<path:filename>')
def asset(filename):
    return send_from_directory('../frontend/dist/assets', filename)


@blueprint.route('/restart')
def restart():
    subprocess.Popen(
        ['bash', '-c', 'sleep 1 && systemctl restart nenuscanner --user'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    return render_template('restart.html')


blueprint.register_blueprint(object_controller.blueprint, url_prefix='/object')
blueprint.register_blueprint(calibration_controller.blueprint, url_prefix='/calibration')
blueprint.register_blueprint(acquisition_controller.blueprint, url_prefix='/acquisition')
blueprint.register_blueprint(camera_controller.blueprint, url_prefix='/camera')
blueprint.register_blueprint(leds_controller.blueprint, url_prefix='/leds')
blueprint.register_blueprint(test_controller.blueprint, url_prefix='/test')
