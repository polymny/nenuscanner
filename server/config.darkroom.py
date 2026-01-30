from os.path import join

DATA_DIR = 'data'
BACKUPS_DIR = 'data-backups'
CALIBRATION_DIR = join(DATA_DIR, 'calibrations')
OBJECT_DIR = join(DATA_DIR, 'objects')
DATABASE_PATH = join(DATA_DIR, 'db.sqlite')

AUTO_USE_LAST_CALIBRATION = True
DELAY = None
GPIO_CHIP = 'gpiochip0'
LEDS_UUIDS = [17, 18, 22, 23, 24, 27]
CAMERA = 'real'
