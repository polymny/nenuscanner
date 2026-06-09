from __future__ import annotations

import shutil
from pathlib import Path

from sqlalchemy.orm import Session, joinedload

from server import leds

from .scenario_execution_service import execute_scenario
from .sse_job_runner import SseJobContext
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.acquisition_photo import AcquisitionPhoto
from ..models.scenario import Scenario
from ...sa_db import db_session

_THUMBNAIL_TARGET_SHUTTER_RELATIVE = 1.0

SERVER_ROOT = Path(__file__).resolve().parents[2]


def photo_relative_path(acquisition_id: int, filename: str) -> str:
    return f'data/acquisitions/{acquisition_id}/{filename}'.replace('\\', '/')


def photo_path_to_url(path: str) -> str:
    if path.startswith('data/'):
        return f'/{path}'
    return f'/data/{path}'


def acquisition_photos_load_options():
    return (
        joinedload(Acquisition.photos).joinedload(AcquisitionPhoto.scenario_led),
        joinedload(Acquisition.photos).joinedload(AcquisitionPhoto.scenario_rotation),
        joinedload(Acquisition.photos).joinedload(AcquisitionPhoto.scenario_shutter_speed),
    )


def acquisition_scenario_load_options():
    return (
        joinedload(Acquisition.scenario).joinedload(Scenario.leds),
        joinedload(Acquisition.scenario).joinedload(Scenario.rotations),
        joinedload(Acquisition.scenario).joinedload(Scenario.shutter_speeds),
    )


def acquisition_thumbnail_url(photos: list[AcquisitionPhoto]) -> str | None:
    """Pick a representative photo URL: first rotation, ALL_LEDS (or first LED), shutter nearest 1."""
    if not photos:
        return None

    rotation_id = next((p.scenario_rotation_id for p in photos if p.scenario_rotation_id is not None), None)
    pool = [p for p in photos if p.scenario_rotation_id == rotation_id]
    led_id = next(
        (p.scenario_led_id for p in pool if p.scenario_led and p.scenario_led.led_value == 'ALL_LEDS'),
        next((p.scenario_led_id for p in pool if p.scenario_led_id is not None), None),
    )
    pool = [p for p in pool if led_id is None or p.scenario_led_id == led_id]
    if not pool:
        return None

    best = min(
        pool,
        key=lambda p: (
            abs(p.scenario_shutter_speed.relative_value - _THUMBNAIL_TARGET_SHUTTER_RELATIVE)
            if p.scenario_shutter_speed
            else float('inf')
        ),
    )
    return photo_path_to_url(best.preview_path)


def run_acquisition(context: SseJobContext, acquisition_id: int) -> None:
    """Run acquisition for the given id following its scenario."""
    session = db_session()
    try:
        acquisition = session.get(Acquisition, acquisition_id)
        if acquisition is None:
            raise ValueError('acquisition-not-found')
        if acquisition.status != AcquisitionStatus.RUNNING:
            raise ValueError('acquisition-not-running')

        execute_scenario(
            context,
            session,
            acquisition,
            photo_relative_path=photo_relative_path,
            photo_path_to_url=photo_path_to_url,
        )

        acquisition = session.get(Acquisition, acquisition_id)
        if acquisition is not None:
            acquisition.status = AcquisitionStatus.COMPLETED
            session.commit()

        context.set_status(AcquisitionStatus.COMPLETED)
        context.emit('completed', {'acquisitionId': acquisition_id})
    except Exception as exc:
        session.rollback()
        _mark_acquisition_failed(session, acquisition_id)
        context.emit('failed', {'message': str(exc)})
        raise
    finally:
        leds.guard_off()
        session.close()
        db_session.remove()


def delete_acquisition_files(acquisition_id: int) -> None:
    photos_dir = SERVER_ROOT / 'data' / 'acquisitions' / str(acquisition_id)
    if photos_dir.is_dir():
        shutil.rmtree(photos_dir)


def delete_acquisition_photos(session: Session, acquisition_id: int) -> None:
    session.query(AcquisitionPhoto).filter(AcquisitionPhoto.acquisition_id == acquisition_id).delete()
    delete_acquisition_files(acquisition_id)


def delete_acquisition(session: Session, acquisition: Acquisition) -> None:
    session.delete(acquisition)


def _mark_acquisition_failed(session: Session, acquisition_id: int) -> None:
    acquisition = session.get(Acquisition, acquisition_id)
    if acquisition is not None:
        delete_acquisition_photos(session, acquisition_id)
        acquisition.status = AcquisitionStatus.FAILED
        session.commit()


def delete_pending_acquisitions(
    session: Session,
    *,
    artifact_id: int | None,
    scenario_id: int,
    arms_position_id: int,
    is_calibration: bool = False,
) -> None:
    artifact_filter = (
        Acquisition.artifact_id.is_(None) if artifact_id is None else Acquisition.artifact_id == artifact_id
    )
    pending_rows = (
        session.query(Acquisition)
        .filter(
            artifact_filter,
            Acquisition.scenario_id == scenario_id,
            Acquisition.arms_position_id == arms_position_id,
            Acquisition.status == AcquisitionStatus.PENDING,
            Acquisition.is_calibration.is_(is_calibration),
        )
        .all()
    )
    for row in pending_rows:
        delete_acquisition(session, row)


def get_acquisition_with_photos(session: Session, acquisition_id: int) -> Acquisition | None:
    return (
        session.query(Acquisition)
        .options(*acquisition_photos_load_options(), *acquisition_scenario_load_options())
        .filter(Acquisition.id == acquisition_id)
        .one_or_none()
    )
