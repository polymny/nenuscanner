from flask import Flask, send_from_directory, session
import os
from . import db, config, routes, utils, leds, fan

app = Flask(__name__)

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


app.register_blueprint(routes.blueprint)


@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)


@app.route('/data/<path:path>')
def send_data(path):
    return send_from_directory(config.DATA_DIR, path)
