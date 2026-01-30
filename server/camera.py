import subprocess

from flask import jsonify
import gphoto2 as gp
import shutil
from . import leds, config
import subprocess
import json
from PIL import Image
import io


def parse_config(lines):
    config = {}
    block = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('/main/'):
            # Nouveau bloc : traiter le précédent s'il existe
            if block:
                insert_block(config, block)
                block = []
            block.append(line)
        elif line == 'END':
            block.append(line)
            insert_block(config, block)
            block = []
        else:
            block.append(line)
    return config


def insert_block(config, block):
    path = block[0].strip('/').split('/')  # ['main', 'actions', 'syncdatetimeutc']
    data = {}
    for line in block[1:-1]:  # Exclure le chemin et 'END'
        if ':' in line:
            key, value = line.split(':', 1)
            key = key.strip()
            value = value.strip()
            if key.startswith('Choice'):
                # Extrait les choix dans une liste
                idx, label = value.split(' ', 1)
                data.setdefault('Choices', []).append({'id': int(idx), 'label': label})
            else:
                data[key] = value

    # Insère dans le dictionnaire hiérarchique
    d = config
    for part in path[:-1]:  # Traverse les sections, ex: main -> actions
        d = d.setdefault(part, {})
    d[path[-1]] = data  # Attribue les données à la clé finale


class Camera:
    def capture(self):
        return None

    def config(self):
        return None


class RealCamera(Camera):
    def __init__(self):
        self._entered = False
        self.inner = gp.Camera()

    def __enter__(self):
        if not self._entered:
            self._entered = True
            self.inner.init()
        return self

    def __exit__(self, *args):
        # self.inner.exit()
        pass

    def capture(self):
        try:
            return self.inner.capture(gp.GP_CAPTURE_IMAGE)
        except Exception as e:
            print('An error occured when capturing photo', e)
            return None

    def capture_preview(self):
        capture = gp.check_result(gp.gp_camera_capture_preview(self.inner))
        file_data = gp.check_result(gp.gp_file_get_data_and_size(capture))
        data = memoryview(file_data)
        image = Image.open(io.BytesIO(file_data))
        image.save("src/nenuscanner/static/feed.jpg")

    def save(self, capture, output_file):
        preview = self.inner.file_get(capture.folder, capture.name[:-3] + 'JPG', gp.GP_FILE_TYPE_NORMAL)
        raw = self.inner.file_get(capture.folder, capture.name, gp.GP_FILE_TYPE_RAW)
        preview.save(output_file + '.jpg')
        # Resize preview
        subprocess.run(['convert', output_file + '.jpg', '-resize', '10%', output_file + '.jpg'])
        raw.save(output_file + '.cr2')

    def config(self):

        was_entered = self._entered
        if self._entered:
            self._entered = False
            self.inner.exit()

        res = subprocess.run(["gphoto2", "--list-all-config"], capture_output=True,  encoding="utf-8")

        if was_entered:
            self.__enter__()

        # print(res.stdout[:200])

        configs = res.stdout.split("\n")
        print(configs)
        config_dict = parse_config(configs)

        # Sauvegarde en JSON
        with open("configCamera.json", "w", encoding="utf-8") as f:
            json.dump(config_dict, f, indent=2, ensure_ascii=False)

    def set_config(self, parameter, value):
        subprocess.run(["gphoto2", "--set-config", f"{parameter}={value}"])
        return 0


class DummyCamera(Camera):
    def __init__(self, leds: leds.DummyLeds):
        self.leds = leds

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def capture(self):
        # Find which leds are turned on
        found = None
        all_on = False

        if all_on:
            return 'data-keep/small/all_on.jpg'
        elif found is not None:
            return 'data-keep/small/' + str(found) + '.jpg'
        else:
            return 'data-keep/small/all_off.jpg'

    def save(self, capture, output_file):
        shutil.copyfile(capture, output_file + '.jpg')


camera = DummyCamera(leds.get()) if config.CAMERA == "dummy" else RealCamera()


def get():
    return camera


def config():
    return camera.config()

def set_config(parameter, value):
    return camera.set_config(parameter, value)

class CameraException(Exception):
    """Exception personnalisée pour les erreurs liées à la caméra."""
    def __init__(self, message):
        super().__init__(message)
