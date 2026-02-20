from os.path import join

DATA_DIR = 'data'
BACKUPS_DIR = 'data-backups'
CALIBRATION_DIR = join(DATA_DIR, 'calibrations')
OBJECT_DIR = join(DATA_DIR, 'objects')
DATABASE_PATH = join(DATA_DIR, 'db.sqlite')

SKIP_LOCAL_CALIBRATION = True
AUTO_USE_LAST_CALIBRATION = True
DELAY = None
GPIO_CHIP = 'gpiochip0'
LEDS_UUIDS = [17, 27, 22, 5, 6, 13, 19, 26, 21, 20, 16, 12]
FAN_UUID = 10
CAMERA = 'real'
