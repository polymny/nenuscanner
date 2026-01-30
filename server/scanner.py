import os
from os.path import join
import time
from . import leds, camera, config


def delay_capture(cam):
    # Measure the time it takes to capture
    start = time.time()
    output = cam.capture()
    delta = time.time() - start

    # Wait for at least one second between each capture
    if config.DELAY is not None and delta < config.DELAY:
        time.sleep(config.DELAY - delta)

    return output


def delay_save(cam, source, target):
    # Measure the time it takes to save
    start = time.time()
    cam.save(source, target)
    delta = time.time() - start

    # Wait for at least one second between each save
    if config.DELAY is not None and delta < config.DELAY:
        time.sleep(config.DELAY - delta)


def scan(output_dir: str, on_and_off: bool = True):
    os.makedirs(output_dir, exist_ok=True)

    file_paths = []
    length = len(config.LEDS_UUIDS) + (2 if on_and_off else 0)

    with camera.get() as cam:
        with leds.get() as gpio_leds:
            for count, led in enumerate(gpio_leds.leds):
                print(f'Turn on {led}')

                led.on()
                file_paths.append((str(led), delay_capture(cam)))
                led.off()

                print(f'Turn off {led}')

                ratio = (count + 1) / (2 * length)
                yield f'{{ "status": "captured", "id": "{led}", "ratio": {ratio:.3} }}\n'

            # capture with all leds ON OFF
            if on_and_off:
                gpio_leds.on()
                file_paths.append(('all_on', delay_capture(cam)))
                ratio = (length - 1) / (2 * length)
                yield f'{{ "status": "captured", "id": "all_on", "ratio": {ratio:.3} }}\n'

                gpio_leds.off()
                file_paths.append(('all_off', delay_capture(cam)))
                ratio = 0.5
                yield f'{{ "status": "captured", "id": "all_off", "ratio": {ratio:.3} }}\n'

    with camera.get() as cam:
        for count, (target, source) in enumerate(file_paths):
            delay_save(cam, source, join(output_dir, target))
            ratio = 0.5 + (count + 1) / (2 * length)
            yield f'{{ "status": "ready", "id": "{target}", "ratio": {ratio:.3} }}\n'
