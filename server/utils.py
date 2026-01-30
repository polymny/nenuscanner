from flask import session
import sqlite3
from . import db


def get_calibration(conn: sqlite3.Connection) -> db.Calibration:
    """
    Retrieves the calibration from the session and the database.

    Returns empty calibration if nothing is found.
    """
    calibration_id = session.get('calibration_id', None)
    if calibration_id is None:
        return db.Calibration.Dummy

    return db.Calibration.get_from_id(calibration_id, conn)
