from __future__ import annotations

from sqlalchemy.orm import Session

from .gphoto2_service import get_gphoto2_camera_settings
from ..models.absolute_shutter_speed_value import AbsoluteShutterSpeedValue
from ..models.aperture_value import ApertureValue
from ..models.camera_settings import CameraSettings
from ..models.iso_value import IsoValue
from ... import config


def _nearest_value_id(session: Session, model: type, value: float) -> int:
    rows = session.query(model).all()
    if not rows:
        raise ValueError(f'no-{model.__tablename__}-rows')
    nearest = min(rows, key=lambda row: abs(float(row.value) - float(value)))
    return int(nearest.id)


def _current_ids_from_camera(session: Session) -> dict[str, int]:
    camera = get_gphoto2_camera_settings()
    return {
        'aperture_value_id': _nearest_value_id(session, ApertureValue, camera['currentApertureValue']),
        'iso_value_id': _nearest_value_id(session, IsoValue, camera['currentIsoValue']),
        'absolute_shutter_speed_value_id': _nearest_value_id(
            session, AbsoluteShutterSpeedValue, camera['currentShutterSpeedValue']
        ),
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

    current = CameraSettings(**_current_ids_from_camera(session), is_current=True)
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
        'currentApertureValue': float(current.aperture_value.value),
        'isoValues': [float(row.value) for row in session.query(IsoValue).order_by(IsoValue.id.asc()).all()],
        'currentIsoValue': float(current.iso_value.value),
        'shutterSpeedValues': [
            float(row.value)
            for row in session.query(AbsoluteShutterSpeedValue).order_by(AbsoluteShutterSpeedValue.id.asc()).all()
        ],
        'currentShutterSpeedValue': float(current.absolute_shutter_speed_value.value),
    }


def persist_current_camera_settings(session: Session) -> None:
    """Met à jour la ligne courante en DB depuis la caméra (crée la ligne si besoin)."""
    current = _get_or_create_current(session)
    ids = _current_ids_from_camera(session)
    current.aperture_value_id = ids['aperture_value_id']
    current.iso_value_id = ids['iso_value_id']
    current.absolute_shutter_speed_value_id = ids['absolute_shutter_speed_value_id']


def snapshot_current_camera_settings(session: Session) -> CameraSettings:
    """Duplique la ligne courante pour figer les réglages d'une acquisition."""
    current = _get_or_create_current(session)
    snapshot = CameraSettings(
        aperture_value_id=current.aperture_value_id,
        iso_value_id=current.iso_value_id,
        absolute_shutter_speed_value_id=current.absolute_shutter_speed_value_id,
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
