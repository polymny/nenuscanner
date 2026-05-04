import os

from flask import Flask, send_from_directory, session
from flask_cors import CORS
from flask_smorest import Api, abort
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from . import config, db, leds, utils
from .app.controllers.artifact_controller import blp as artifact_blp
from .app.controllers.web_controller import blueprint as web_blueprint
from .sa_db import db_session

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


# Middlewares to help us deal with stuff
@app.context_processor
def inject():
    """
    Returns a dictionnary with the uuids of leds and the calibration state.
    """
    conn = db.get()
    return {
        'calibration': utils.get_calibration(conn),
        'leds': leds.get().leds,
        'CalibrationState': db.CalibrationState,
    }


@app.before_request
def manage_auto_use_last_calibration():
    """
    Automatically use the last calibration if the config is set accordingly.
    """
    if config.AUTO_USE_LAST_CALIBRATION and 'calibration_id' not in session:
        conn = db.get()
        last = db.Calibration.get_last(conn)
        if last is not None:
            session['calibration_id'] = last.id


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
        abort(503, message='db-not-initialized')
    abort(500, message='db-error')


app.register_blueprint(web_blueprint)

api.register_blueprint(artifact_blp, url_prefix='/artifact')


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


@app.route('/data/<path:path>')
def send_data(path):
    return send_from_directory(config.DATA_DIR, path)
