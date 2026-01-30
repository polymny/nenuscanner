from flask import Blueprint, Response, render_template, session, redirect
from os.path import join

from .. import db, config, scanner

blueprint = Blueprint('acquisition', __name__)


@blueprint.route('/scan/<id>')
def scan(id: int):
    """
    Route to scan an object
    """
    conn = db.get()
    calibration_id = session.get('calibration_id', None)
    object = db.Object.get_from_id(id, conn)

    if calibration_id is None:
        raise RuntimeError("Impossible de faire l'acquisition sans étalonnage")

    return render_template('scan.html', object=object, calibrated=True)


@blueprint.route('/rescan/<id>')
def scan_existing(id: int):
    conn = db.get()
    calibrated = session.get('calibration_id', None) is not None
    acquisition = db.Acquisition.get_from_id(id, conn)
    object = acquisition.object(conn) if acquisition is not None else None
    return render_template('scan.html', object=object, acquisition=acquisition, calibrated=calibrated)


@blueprint.route('/run/<object_id>')
def run(object_id: int):
    conn = db.get()
    calibration_id = session.get('calibration_id', None)

    if calibration_id is None:
        raise RuntimeError("Impossible de faire l'acquisition sans étalonnage")

    object = db.Object.get_from_id(object_id, conn)

    if object is None:
        raise RuntimeError(f"Aucun objet d'id {object_id}")

    with conn:
        acquisition = object.add_acquisition(calibration_id, conn)

    def generate():
        yield str(acquisition.id)
        for value in scanner.scan(join(config.OBJECT_DIR, str(object.id), str(acquisition.id))):
            yield value

    return Response(generate(), mimetype='text/plain')


@blueprint.route('/rerun/<acquisition_id>')
def rescan(acquisition_id: int):
    """
    Route to relaunch an acquisition
    """
    conn = db.get()
    calibration_id = session.get('calibration_id', None)

    if calibration_id is None:
        raise RuntimeError("Impossible de faire l'acquisition sans étalonnage")

    acquisition = db.Acquisition.get_from_id(acquisition_id, conn)

    if acquisition is None:
        raise RuntimeError(f"Aucun acquisition d'id {acquisition_id}")

    object = acquisition.object(conn)

    def generate():
        for value in scanner.scan(join(config.OBJECT_DIR, str(object.id), str(acquisition.id))):
            yield value

    return Response(generate(), mimetype='text/plain')


@blueprint.route('/validate/<acquisition_id>')
def validate(acquisition_id: int):
    conn = db.get()
    acquisition = db.Acquisition.get_from_id(acquisition_id, conn)

    if acquisition is None:
        raise Exception(f"Aucune acquisition d'id {acquisition_id}")

    object = acquisition.object(conn)

    acquisition.validated = True
    with conn:
        acquisition.save(conn)

    return redirect(f'/object/{object.id}')


@blueprint.route("/delete/<acquisition_id>")
def delete(acquisition_id: int):
    conn = db.get()
    with conn:
        acqusition = db.Acquisition.delete_from_id(acquisition_id, conn)
        return redirect('/object/' + str(acqusition.object_id))
