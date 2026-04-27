import sqlite3

from flask import session

from . import db


def get_calibration(conn: sqlite3.Connection) -> db.Calibration:
    """
    Retrieves the calibration from the session and the database.

    Returns empty calibration if nothing is found.
    """
    calibration_id = session.get('calibration_id', None)
    if calibration_id is None:
        return db.Calibration.Dummy

    calib = db.Calibration.get_from_id(calibration_id, conn)
    if calib is None:
        # Session can point to a deleted/invalid calibration id.
        # Falling back to a dummy calibration keeps templates/routes safe.
        session.pop('calibration_id', None)
        return db.Calibration.Dummy

    return calib
