from flask import Blueprint, jsonify

blueprint = Blueprint('test', __name__)

# Routes for object management


@blueprint.route('/')
def get():
    """
    Returns the test.
    """

    return jsonify({'status': 'ok', 'message': 'test'}), 200
