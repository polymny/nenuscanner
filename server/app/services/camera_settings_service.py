from __future__ import annotations

from sqlalchemy.orm import Session

from .gphoto2_service import get_camera_settings
from ..models.camera_settings import CameraSettings


def _current_values_from_camera() -> dict[str, float]:
    camera = get_camera_settings()
    return {
        'aperture_value': float(camera['currentApertureValue']),
        'iso_value': float(camera['currentIsoValue']),
        'absolute_shutter_speed_value': float(camera['currentShutterSpeedValue']),
    }


def _get_or_create_current(session: Session) -> CameraSettings:
    current = (
        session.query(CameraSettings)
        .filter(CameraSettings.is_current.is_(True))
        .order_by(CameraSettings.id.asc())
        .first()
    )
    if current is not None:
        return current

    current = CameraSettings(**_current_values_from_camera(), is_current=True)
    session.add(current)
    session.flush()
    return current


def persist_current_camera_settings(session: Session) -> None:
    """Met à jour la ligne courante en DB depuis la caméra (crée la ligne si besoin)."""
    current = _get_or_create_current(session)
    values = _current_values_from_camera()
    current.aperture_value = values['aperture_value']
    current.iso_value = values['iso_value']
    current.absolute_shutter_speed_value = values['absolute_shutter_speed_value']


def snapshot_current_camera_settings(session: Session) -> CameraSettings:
    """Duplique la ligne courante pour figer les réglages d'une acquisition."""
    current = _get_or_create_current(session)
    snapshot = CameraSettings(
        aperture_value=current.aperture_value,
        iso_value=current.iso_value,
        absolute_shutter_speed_value=current.absolute_shutter_speed_value,
        is_current=False,
    )
    session.add(snapshot)
    session.flush()
    return snapshot
