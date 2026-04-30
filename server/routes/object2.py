from flask import Blueprint, jsonify
from sqlalchemy.exc import OperationalError, SQLAlchemyError

from ..models_sa import Object2
from ..sa_db import db_session
from ..schemas.object2 import Object2ReadSchema

blueprint = Blueprint('object2', __name__)


@blueprint.route('/first')
def first():
    """
    Returns the first Object2 row (SQLAlchemy) or an error.
    """
    try:
        obj = db_session.query(Object2).order_by(Object2.id.asc()).first()
    except OperationalError as e:
        # Common case: table doesn't exist yet (init_db not run).
        return jsonify({'status': 'error', 'error': 'db_not_initialized', 'details': str(e)}), 500
    except SQLAlchemyError as e:
        return jsonify({'status': 'error', 'error': 'db_error', 'details': str(e)}), 500

    if obj is None:
        return jsonify({'status': 'error', 'error': 'empty', 'message': 'object2 table is empty'}), 404

    schema = Object2ReadSchema()
    return jsonify({'status': 'ok', 'object2': schema.dump(obj)}), 200
