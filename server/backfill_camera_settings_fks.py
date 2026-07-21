from __future__ import annotations

import os

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session, joinedload, sessionmaker

from . import config
from .app.constants.leds import LEDS_COUNT
from .app.models.absolute_shutter_speed_value import AbsoluteShutterSpeedValue
from .app.models.acquisition import Acquisition
from .app.models.acquisition_image import AcquisitionImage
from .app.models.aperture_value import ApertureValue
from .app.models.camera_settings import CameraSettings
from .app.models.iso_value import IsoValue
from .app.models.scenario import ScenarioShutterSpeed
from .db import Base, engine


def _ensure_fk_columns() -> None:
    inspector = inspect(engine)

    camera_settings_columns = {column['name'] for column in inspector.get_columns('camera_settings')}
    camera_settings_indexes = {index['name'] for index in inspector.get_indexes('camera_settings')}
    camera_settings_fk_columns = (
        ('aperture_value_id', 'INTEGER REFERENCES aperture_value(id)'),
        ('iso_value_id', 'INTEGER REFERENCES iso_value(id)'),
        ('absolute_shutter_speed_value_id', 'INTEGER REFERENCES absolute_shutter_speed_value(id)'),
    )

    acquisition_image_columns = {column['name'] for column in inspector.get_columns('acquisition_image')}
    acquisition_image_indexes = {index['name'] for index in inspector.get_indexes('acquisition_image')}
    acquisition_image_fk_columns = (
        (
            'effective_shutter_speed_value_id',
            'INTEGER NOT NULL DEFAULT 1 REFERENCES absolute_shutter_speed_value(id)',
        ),
    )

    with engine.begin() as connection:
        for column_name, column_type in camera_settings_fk_columns:
            if column_name not in camera_settings_columns:
                connection.execute(text(f'ALTER TABLE camera_settings ADD COLUMN {column_name} {column_type}'))

        for column_name, _column_type in camera_settings_fk_columns:
            index_name = f'ix_camera_settings_{column_name}'
            if index_name not in camera_settings_indexes:
                connection.execute(text(f'CREATE INDEX {index_name} ON camera_settings ({column_name})'))

        for column_name, column_type in acquisition_image_fk_columns:
            if column_name not in acquisition_image_columns:
                connection.execute(text(f'ALTER TABLE acquisition_image ADD COLUMN {column_name} {column_type}'))

        for column_name, _column_type in acquisition_image_fk_columns:
            index_name = f'ix_acquisition_image_{column_name}'
            if index_name not in acquisition_image_indexes:
                connection.execute(text(f'CREATE INDEX {index_name} ON acquisition_image ({column_name})'))


def _nearest_row_id(rows, value: float) -> int | None:
    if not rows:
        return None
    best = min(rows, key=lambda row: abs(float(row.value) - float(value)))
    return int(best.id)


def backfill_camera_settings_foreign_keys(session: Session) -> int:
    """Remplit les FK camera_settings à partir des valeurs float existantes (plus proche)."""
    aperture_rows = session.query(ApertureValue).order_by(ApertureValue.id.asc()).all()
    iso_rows = session.query(IsoValue).order_by(IsoValue.id.asc()).all()
    shutter_rows = session.query(AbsoluteShutterSpeedValue).order_by(AbsoluteShutterSpeedValue.id.asc()).all()

    updated = 0
    for settings in session.query(CameraSettings).order_by(CameraSettings.id.asc()).all():
        settings.aperture_value_id = _nearest_row_id(aperture_rows, settings.aperture_value)
        settings.iso_value_id = _nearest_row_id(iso_rows, settings.iso_value)
        settings.absolute_shutter_speed_value_id = _nearest_row_id(shutter_rows, settings.absolute_shutter_speed_value)
        updated += 1

    return updated


def backfill_acquisition_image_effective_shutter_speeds(session: Session) -> int:
    """Remplit effective_shutter_speed_value_id comme dans scenario_execution_service."""
    shutter_rows = session.query(AbsoluteShutterSpeedValue).order_by(AbsoluteShutterSpeedValue.id.asc()).all()
    if not shutter_rows:
        return 0

    images = (
        session.query(AcquisitionImage)
        .options(
            joinedload(AcquisitionImage.acquisition).joinedload(Acquisition.camera_settings),
            joinedload(AcquisitionImage.scenario_shutter_speed).joinedload(
                ScenarioShutterSpeed.relative_shutter_speed_value
            ),
            joinedload(AcquisitionImage.scenario_led),
        )
        .order_by(AcquisitionImage.id.asc())
        .all()
    )

    updated = 0
    for image in images:
        acquisition = image.acquisition
        shutter = image.scenario_shutter_speed
        led = image.scenario_led
        if acquisition is None or shutter is None:
            continue

        target_shutter_speed = float(acquisition.camera_settings.absolute_shutter_speed_value) * float(
            shutter.relative_shutter_speed_value.value
        )
        # TODO : correction temporaire pour ALL_LEDS
        if led is not None and led.led_value == 'ALL_LEDS':
            target_shutter_speed /= LEDS_COUNT

        nearest_id = _nearest_row_id(shutter_rows, target_shutter_speed)
        if nearest_id is None:
            continue

        image.effective_shutter_speed_value_id = nearest_id
        updated += 1

    return updated


def main() -> None:
    os.makedirs(config.DATA_DIR, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    _ensure_fk_columns()

    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)
    with SessionLocal() as session:
        camera_settings_updated = backfill_camera_settings_foreign_keys(session)
        images_updated = backfill_acquisition_image_effective_shutter_speeds(session)
        session.commit()
        print(f'Updated {camera_settings_updated} camera_settings row(s).')
        print(f'Updated {images_updated} acquisition_image row(s).')


if __name__ == '__main__':
    main()
