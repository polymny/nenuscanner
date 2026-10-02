import subprocess

from flask import Blueprint, send_file, send_from_directory

blueprint = Blueprint('routes', __name__)


@blueprint.route('/')
def index():
    return send_file('../frontend/dist/index.html')


@blueprint.route('/assets/<path:filename>')
def asset(filename):
    return send_from_directory('../frontend/dist/assets', filename)


@blueprint.route('/restart')
def restart():
    subprocess.Popen(
        ['bash', '-c', 'sleep 1 && systemctl restart nenuscanner --user'],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )
    return 'Redémarrage du serveur en cours…', 200, {'Content-Type': 'text/html; charset=utf-8'}
