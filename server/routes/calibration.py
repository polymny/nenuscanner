from flask import Blueprint, Response, render_template, redirect, session
from os.path import join
import json

from .. import db, utils, scanner, config, calibration

blueprint = Blueprint('calibration', __name__)


@blueprint.route("/create")
def create():
    """
    Creates a new calibration and redirects to the page to calibrate.
    """
    conn = db.get()
    with conn:
        calibration = db.Calibration.create(conn)
        session['calibration_id'] = calibration.id

    return redirect('/calibration/calibrate')


@blueprint.route("/calibrate")
def calibrate():
    """
    Returns the page to calibrate the system.
    """
    conn = db.get()
    if 'calibration_id' not in session:
        with conn:
            calibration = db.Calibration.create(conn)
            session['calibration_id'] = calibration.id
    else:
        calibration = db.Calibration.get_from_id(session['calibration_id'], conn)

    if calibration.state in [db.CalibrationState.Empty, db.CalibrationState.HasData]:
        return render_template('calibrate.html')
    else:
        return render_template('calibration.html', calibration=calibration)


@blueprint.route('/scan')
def scan():
    """
    Starts a scan for calibration.
    """
    conn = db.get()

    if 'calibration_id' not in session:
        with conn:
            calibration = db.Calibration.create(conn)
            calibration_id = str(calibration.id)
            session['calibration_id'] = calibration.id
    else:
        calibration_id = str(session['calibration_id'])
        calibration = utils.get_calibration(conn)

    def generate():
        for value in scanner.scan(join(config.CALIBRATION_DIR, calibration_id), False):
            yield value

        with conn:
            calibration.state = db.CalibrationState.HasData
            calibration.save(conn)

    return Response(generate(), mimetype='text/plain')


@blueprint.route('/compute')
def compute():
    """
    Compute the calibration from the scan.
    """
    conn = db.get()
    id = session['calibration_id']
    calib = db.Calibration.get_from_id(id, conn)
    if calib is None:
        return 'oops', 404

    try:
        if config.SKIP_LOCAL_CALIBRATION:
            calibration_json = 'skipped'
        else:
            calibration_json = calibration.calibrate(join(config.CALIBRATION_DIR, str(id)))
    except:
        calibration_json = 'failure'

    with open(join(config.CALIBRATION_DIR, str(id), 'calibration.json'), 'w') as f:
        json.dump(calibration_json, f, indent=4)
    with conn:
        calib.state = db.CalibrationState.IsComputed
        calib.save(conn)

    return 'ok'


@blueprint.route('/cancel')
def cancel():
    """
    Cancels a calibration.
    """
    conn = db.get()
    calibration = db.Calibration.get_from_id(session['calibration_id'], conn)
    calibration.state = db.CalibrationState.HasData
    with conn:
        calibration.save(conn)
    return redirect('/calibration/calibrate')


@blueprint.route('/validate')
def validate():
    """
    Validates a calibration.
    """
    conn = db.get()
    calib = utils.get_calibration(conn)
    if calib is None:
        return 'oops', 404

    with conn:
        calib.validate(conn)

    return redirect('/')


@blueprint.route('/use-last')
def use_last():
    """
    Sets the current calibration to the last one that was validated.
    """
    conn = db.get()
    calib = db.Calibration.get_last(conn)
    session['calibration_id'] = calib.id
    return redirect('/calibration/calibrate')
