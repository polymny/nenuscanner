from os.path import join

DATA_DIR = 'data'
BACKUPS_DIR = 'data-backups'
CALIBRATION_DIR = join(DATA_DIR, 'calibrations')
OBJECT_DIR = join(DATA_DIR, 'objects')
DATABASE_PATH = join(DATA_DIR, 'db.sqlite')

AUTO_USE_LAST_CALIBRATION = False
DELAY = 0.5
GPIO_CHIP = None
LEDS_UUIDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
FAN_UUID = None
CAMERA = 'dummy'
CAMERA_RAW_EXTENSION = 'nef'
