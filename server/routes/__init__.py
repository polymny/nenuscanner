import subprocess
from flask import Blueprint, render_template

from .. import db
from . import object, acquisition, camera, leds

blueprint = Blueprint('routes', __name__)


# Generic routes
@blueprint.route("/")
def index():
    """
    Serves the index of nenuscanner.
    """
    conn = db.get()
    projects = db.Object.all_by_project(conn)
    return render_template('index.html', projects=projects)

# Route that restarts the server
@blueprint.route("/restart")
def restart():
    """
    Serves the index of nenuscanner.
    """
    subprocess.Popen(
        ["bash", "-c", "sleep 1 && systemctl restart nenuscanner --user"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True
    )
    return render_template('restart.html')



blueprint.register_blueprint(object.blueprint, url_prefix='/object')
blueprint.register_blueprint(acquisition.blueprint, url_prefix='/acquisition')
blueprint.register_blueprint(camera.blueprint, url_prefix='/camera')
blueprint.register_blueprint(leds.blueprint, url_prefix='/leds')
