from flask import Blueprint, jsonify, render_template, request

from .. import config, leds

blueprint = Blueprint('leds', __name__)

# Routes for object management


@blueprint.route('/')
def get():
    """
    Returns the pages showing all leds.
    """

    return render_template('leds.html', leds=config.LEDS_UUIDS)


@blueprint.route('/set', methods=['POST'])
def set_led():
    """
    Reçoit une commande pour allumer ou éteindre une LED.
    Attend un JSON : { "led": "14", "state": "on" } ou { "led": "15, "state": "off" }
    """
    data = request.get_json()
    led = data.get('led')
    state = data.get('state')
    # get the controller (lazy, stored on app.extensions)
    gpio_leds = leds.get()

    try:
        # parse led id/name according to your naming convention
        print([x.gpio_pin for x in gpio_leds.leds])
        gpio_led = gpio_leds.get_by_uuid(int(led))
        print(f'Setting {led} / {gpio_led} to {state}')
        if state == 'on':
            gpio_led.on()
        else:
            gpio_led.off()

    except Exception as e:
        raise
        print(f'{e}')
        return jsonify({'status': 'error', 'error': 'error'}), 400

    print(f'Commande reçue pour {led} : {state}')

    return jsonify({'status': 'ok', 'led': led, 'state': state})
