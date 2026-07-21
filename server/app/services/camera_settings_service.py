from __future__ import annotations

from sqlalchemy.orm import Session

from .gphoto2_service import get_gphoto2_camera_settings
from ..models.absolute_shutter_speed_value import AbsoluteShutterSpeedValue
from ..models.aperture_value import ApertureValue
from ..models.camera_settings import CameraSettings
from ..models.iso_value import IsoValue
from ... import config


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


def get_current_camera_settings(session: Session) -> CameraSettings:
    """Retourne la ligne courante des réglages caméra en DB."""
    return _get_or_create_current(session)


def get_camera_settings(session: Session) -> dict:
    """Retourne les listes de valeurs et les réglages courants depuis la DB."""
    current = _get_or_create_current(session)
    return {
        'apertureValues': [
            float(row.value) for row in session.query(ApertureValue).order_by(ApertureValue.id.asc()).all()
        ],
        'currentApertureValue': float(current.aperture_value),
        'isoValues': [float(row.value) for row in session.query(IsoValue).order_by(IsoValue.id.asc()).all()],
        'currentIsoValue': float(current.iso_value),
        'shutterSpeedValues': [
            float(row.value)
            for row in session.query(AbsoluteShutterSpeedValue).order_by(AbsoluteShutterSpeedValue.id.asc()).all()
        ],
        'currentShutterSpeedValue': float(current.absolute_shutter_speed_value),
    }


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


def fill_available_camera_values(session: Session) -> None:
    """Remplit aperture/iso/shutter si vides."""
    if config.CAMERA != 'real':
        return

    tables = (
        (ApertureValue, 'apertureValues'),
        (IsoValue, 'isoValues'),
        (AbsoluteShutterSpeedValue, 'shutterSpeedValues'),
    )
    empty_models = [model for model, _key in tables if session.query(model).count() == 0]
    if not empty_models:
        return

    settings = get_gphoto2_camera_settings()

    for model, values_key in tables:
        if model not in empty_models:
            continue
        for index, value in enumerate(settings.get(values_key, [])):
            session.add(model(value=float(value), api_key=str(index + 1)))


def refresh_available_camera_values(session: Session) -> None:
    """Vide puis remplit les tables de valeurs caméra."""
    if config.CAMERA != 'real':
        return

    session.query(ApertureValue).delete()
    session.query(IsoValue).delete()
    session.query(AbsoluteShutterSpeedValue).delete()
    session.flush()
    fill_available_camera_values(session)
