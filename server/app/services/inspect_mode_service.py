from sqlalchemy.orm import Session

from .camera_settings_service import get_current_camera_settings
from .gphoto2_service import set_camera_setting
from ..models.acquisition import Acquisition, AcquisitionStatus
from ... import config, leds


class AcquisitionRunningError(Exception):
    pass


def _assert_no_running_acquisition(session: Session) -> None:
    if session.query(Acquisition.id).filter(Acquisition.status == AcquisitionStatus.RUNNING).first() is not None:
        raise AcquisitionRunningError('acquisition-running')


def set_led_inspect_mode(session: Session, led_value: str) -> None:
    _assert_no_running_acquisition(session)
    if config.CAMERA == 'real':
        camera_settings = get_current_camera_settings(session)
        set_camera_setting('shutterspeed', float(camera_settings.absolute_shutter_speed_value))

    gpio_leds = leds.get()
    gpio_leds.off()

    if led_value == 'NO_LED':
        return

    if led_value == 'ALL_LEDS':
        gpio_leds.on()
        return

    led_uuid = int(config.LEDS_UUIDS[int(led_value) - 1])
    gpio_leds.get_by_uuid(led_uuid).on()


def set_shutter_speed_inspect_mode(session: Session, relative_value: float) -> None:
    _assert_no_running_acquisition(session)
    set_led_inspect_mode(session, 'NO_LED')

    if config.CAMERA == 'real':
        camera_settings = get_current_camera_settings(session)
        target_shutter_speed = float(camera_settings.absolute_shutter_speed_value) * float(relative_value)
        set_camera_setting('shutterspeed', target_shutter_speed)


def leave_inspect_mode(session: Session) -> None:
    leds.get().off()

    if config.CAMERA == 'real':
        camera_settings = get_current_camera_settings(session)
        set_camera_setting('shutterspeed', float(camera_settings.absolute_shutter_speed_value))
