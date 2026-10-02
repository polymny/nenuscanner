from os.path import join

DATA_DIR = 'data'
BACKUPS_DIR = 'data-backups'
DATABASE_PATH = join(DATA_DIR, 'db.sqlite')

GPIO_CHIP = None
LEDS_UUIDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
CAMERA = 'dummy'
CAMERA_RAW_EXTENSION = 'nef'
# Largeur du repère AF Nikon (changeafarea), capteur FX 3:2.
CAMERA_FOCUS_AREA_WIDTH = 8256
