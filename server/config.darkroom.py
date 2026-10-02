from os.path import join

DATA_DIR = 'data'
BACKUPS_DIR = 'data-backups'
DATABASE_PATH = join(DATA_DIR, 'db.sqlite')

GPIO_CHIP = 'gpiochip0'
LEDS_UUIDS = [17, 27, 22, 5, 6, 13, 19, 26, 21, 20, 16, 12]
TURNTABLE_SERIAL_PORT = '/dev/ttyAMA0'
CAMERA = 'real'
CAMERA_RAW_EXTENSION = 'nef'
# Largeur du repère AF Nikon (changeafarea), capteur FX 3:2.
CAMERA_FOCUS_AREA_WIDTH = 8256
