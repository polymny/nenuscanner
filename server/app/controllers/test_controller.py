from flask import Blueprint, jsonify

blueprint = Blueprint('test', __name__)


@blueprint.route('/')
def get():
    return jsonify({'status': 'ok', 'message': 'test'}), 200

