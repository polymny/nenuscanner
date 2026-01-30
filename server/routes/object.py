from flask import Blueprint, render_template, redirect, request
import os
from os.path import join
import itertools

from .. import db, config, archive

blueprint = Blueprint('routes', __name__)


# Routes for object management
@blueprint.route('/<id>')
def get(id: int):
    """
    Returns the page showing an object.
    """
    conn = db.get()
    object = db.Object.get_from_id(id, conn).full(conn)
    return render_template('object.html', object=object)


@blueprint.route('/create', methods=['POST'])
def create():
    """
    Creates a new object.
    """
    conn = db.get()
    with conn:
        db.Object.create(request.form.get('name'), request.form.get('project'), conn)
        return redirect('/')


@blueprint.route('/delete/<id>')
def delete(id: int):
    """
    Deletes an object from its id.
    """
    conn = db.get()
    with conn:
        db.Object.delete_from_id(id, conn)
        return redirect('/')


def download_object(id: int, archive: archive.ArchiveSender):
    """
    Helper for routes that send archives.
    """
    conn = db.get()
    object = db.Object.get_from_id(id, conn).full(conn)

    # Group acquisitions sharing calibration
    def keyfunc(x: db.Calibration) -> int:
        return x.calibration_id

    acquisitions_sorted = sorted(object.acquisitions, key=keyfunc)
    acquisitions_grouped = [
        (db.Calibration.get_from_id(k, conn), list(g))
        for k, g in itertools.groupby(acquisitions_sorted, key=keyfunc)
    ]

    # Create archive file to send
    for calibration_index, (calib, acquisitions) in enumerate(acquisitions_grouped):
        calibration_dir = join(config.CALIBRATION_DIR, str(calib.id))

        # Add calibration images
        for image in os.listdir(calibration_dir):
            archive.add_file(
                f'object/{calibration_index}/calibration/{image}',
                join(calibration_dir, image)
            )

        # Add each acquisition
        for acquisition_index, acquisition in enumerate(acquisitions):
            acquisition_dir = join(config.OBJECT_DIR, str(object.id), str(acquisition.id))

            for image in os.listdir(acquisition_dir):
                archive.add_file(
                    f'object/{calibration_index}/{acquisition_index}/{image}',
                    join(acquisition_dir, image)
                )

    return archive.response()


@blueprint.route('/download/tar/<id>')
def download_object_tar(id: int):
    """
    Downloads an object as a tar archive.
    """
    return download_object(id, archive.TarSender())


@blueprint.route('/download/zip/<id>')
def download_object_zip(id: int):
    """
    Downloads an object as a zip archive.
    """
    return download_object(id, archive.ZipSender())
