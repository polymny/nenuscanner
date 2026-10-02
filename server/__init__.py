import os

from flask import Flask, send_file, send_from_directory
from flask_cors import CORS
from flask_smorest import Api, abort
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from . import config
from .app.controllers.acquisition_controller import blp as acquisition_blp
from .app.controllers.artifact_controller import blp as artifact_blp
from .app.controllers.camera_controller import blp as camera_blp
from .app.controllers.inspect_mode_controller import blp as inspect_mode_blp
from .app.controllers.led_power_value_controller import blp as led_power_value_blp
from .app.controllers.profile_controller import blp as profile_blp
from .app.controllers.relative_shutter_speed_value_controller import blp as relative_shutter_speed_value_blp
from .app.controllers.rig_configuration_controller import blp as rig_configuration_blp
from .app.controllers.scenario_controller import blp as scenario_blp
from .app.controllers.web_controller import blueprint as web_blueprint
from .db import db_session

app = Flask(__name__)

# Allow the frontend dev server to call the Flask API during development.
# (CORS headers are also needed for preflight OPTIONS requests.)
CORS(app)

# Manage secret key
try:
    from . import secret

    app.config['SECRET_KEY'] = secret.SECRET_KEY
except ImportError:
    # Secret key file does not exist, create it
    secret = os.urandom(50).hex()
    with open('secret.py', 'w') as f:
        f.write(f'SECRET_KEY = "{secret}"')
    app.config['SECRET_KEY'] = secret


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


app.config.setdefault('API_TITLE', 'NeNuScanner API')
app.config.setdefault('API_VERSION', '0.1.0')
app.config.setdefault('OPENAPI_VERSION', '3.0.3')
app.config.setdefault('OPENAPI_URL_PREFIX', '/')
app.config.setdefault('OPENAPI_SWAGGER_UI_PATH', '/swagger-ui')
app.config.setdefault('OPENAPI_SWAGGER_UI_URL', 'https://cdn.jsdelivr.net/npm/swagger-ui-dist/')

api = Api(app)


@app.errorhandler(SQLAlchemyError)
def handle_sqlalchemy_error(e):
    if isinstance(e, OperationalError):
        abort(503, message='db-consistency-error')
    abort(500, message='db-error')


app.register_blueprint(web_blueprint)

api.register_blueprint(acquisition_blp, url_prefix='/acquisition')
api.register_blueprint(artifact_blp, url_prefix='/artifact')
api.register_blueprint(camera_blp, url_prefix='/camera')
api.register_blueprint(inspect_mode_blp, url_prefix='/inspect-mode')
api.register_blueprint(led_power_value_blp, url_prefix='/led-power-value')
api.register_blueprint(relative_shutter_speed_value_blp, url_prefix='/relative-shutter-speed-value')
api.register_blueprint(profile_blp, url_prefix='/profile')
api.register_blueprint(scenario_blp, url_prefix='/scenario')
api.register_blueprint(rig_configuration_blp, url_prefix='/rig-configuration')


@app.route('/data/<path:path>')
def send_data(path):
    return send_from_directory(config.DATA_DIR, path)


# If still nothing has been reached, send index.html
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def default(path):
    return send_file('../frontend/dist/index.html')
