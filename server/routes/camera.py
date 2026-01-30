from flask import Blueprint, render_template, request, send_file, jsonify
import json
import subprocess

from .. import camera as C


blueprint = Blueprint('camera', __name__)

# Routes for object management


@blueprint.route('/')
def get():
    """
    Returns the page showing camera configuration for all parameters in capturesettings and imgsettings,
    grouped by section.
    """
  

  
    return render_template(
        'camera.html')


@blueprint.route('/set', methods=['POST'])
def set_camera_settings():
    """
    Receives and processes new camera settings for all parameters from the client.
    """
    data = request.get_json()
    updated = {}
    for key, value in data.items():
        print(f"Received {key}: {value}")
        C.set_config(key, value)
        updated[key] = value

    try:
        cam = C.get()
        cam.capture_preview()
        return jsonify({'status': 'ok'})
    except C.CameraException as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
    
    return {'status': 'ok', **updated}

@blueprint.route('/feed.jpg', methods=['GET'])
def camera_feed():
    capture_preview()
    return send_file('static/feed.jpg', mimetype='image/jpeg')

@blueprint.route('/config', methods=['GET'])
def get_camera_config():
    """
    Returns grouped camera parameters as JSON for frontend JS.
    """
    
    try:
        cam = C.get()
        cam.config()

    except C.CameraException as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
    
    with open('configCamera.json', 'r') as f:
        config = json.load(f)

    grouped_params = []
    # Iterate over all sections in config['main']
    for section, settings in config['main'].items():
        section_params = []
        if isinstance(settings, dict):
            for param_name, param in settings.items():
                if 'Choices' in param and isinstance(param['Choices'], list) and param['Choices']:
                    choices = [
                        {'value': c.get('id', idx), 'label': c['label']}
                        for idx, c in enumerate(param['Choices'])
                    ]
                   
                    section_params.append({
                            'name': param_name,
                            'label': param.get('Label', param_name.capitalize()),
                            'choices': choices,
                            'current': param.get('Current', ''),
                            'Type': param.get('Type', 'Text'),
                            'Readonly': param.get('Readonly', 0)
                    })
                    
        if section_params:
            grouped_params.append({
                'section': section,
                'params': section_params
            })

    return jsonify(grouped_params)

# @blueprint.route('/capture_preview', methods=['POST'])
def capture_preview():
    """
    Capture un aperçu avec gphoto2 et sauvegarde dans static/feed.jpg
    """
    try:
        with C.get() as cam:
            cam.capture_preview()
            return jsonify({'status': 'ok'})
    except C.CameraException as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
