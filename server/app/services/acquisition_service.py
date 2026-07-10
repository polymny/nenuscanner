from __future__ import annotations

import shutil

from sqlalchemy.orm import Session, joinedload

from .scenario_execution_service import AcquisitionPaused, execute_scenario
from .sse_job_runner import JobCancelled, SseJobContext
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.acquisition_photo import AcquisitionPhoto
from ..models.scenario import Scenario, ScenarioLED, ScenarioShutterSpeed
from ..paths import SERVER_ROOT
from ... import leds
from ...sa_db import db_session

_THUMBNAIL_TARGET_SHUTTER_RELATIVE = 1.0


def photo_relative_path(acquisition_id: int, filename: str) -> str:
    return f'data/acquisitions/{acquisition_id}/{filename}'.replace('\\', '/')


def photo_path_to_url(path: str) -> str:
    if path.startswith('data/'):
        return f'/{path}'
    return f'/data/{path}'


def acquisition_photos_load_options():
    return (
        joinedload(Acquisition.photos)
        .joinedload(AcquisitionPhoto.scenario_led)
        .joinedload(ScenarioLED.led_power_value),
        joinedload(Acquisition.photos)
        .joinedload(AcquisitionPhoto.scenario_shutter_speed)
        .joinedload(ScenarioShutterSpeed.shutter_speed_value),
    )


def acquisition_scenario_load_options():
    return (
        joinedload(Acquisition.scenario).joinedload(Scenario.leds).joinedload(ScenarioLED.led_power_value),
        joinedload(Acquisition.scenario)
        .joinedload(Scenario.shutter_speeds)
        .joinedload(ScenarioShutterSpeed.shutter_speed_value),
    )


def acquisition_size_bytes(photos: list[AcquisitionPhoto]) -> int:
    total = 0
    seen_paths: set[str] = set()
    for photo in photos:
        for relative_path in (photo.raw_path, photo.preview_path):
            if relative_path in seen_paths:
                continue
            seen_paths.add(relative_path)
            disk_path = SERVER_ROOT / relative_path
            if disk_path.is_file():
                total += disk_path.stat().st_size
    return total


def acquisition_thumbnail_url(photos: list[AcquisitionPhoto]) -> str | None:
    """
    Choisit une URL de photo représentative :
    - première rotation,
    - ALL_LEDS (ou première LED),
    - temps de pose le plus proche de 1.
    """
    if not photos:
        return None

    rotation_index = next((p.rotation_index for p in photos if p.rotation_index > 0), 0)
    pool = [p for p in photos if p.rotation_index == rotation_index]
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
            abs(p.scenario_shutter_speed.shutter_speed_value.value - _THUMBNAIL_TARGET_SHUTTER_RELATIVE)
            if p.scenario_shutter_speed
            else float('inf')
        ),
    )
    return photo_path_to_url(best.preview_path)


def run_acquisition(context: SseJobContext, acquisition_id: int) -> None:
    """Exécute l'acquisition pour l'identifiant donné en suivant son scénario."""
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
        if acquisition is not None and acquisition.status == AcquisitionStatus.RUNNING:
            acquisition.status = AcquisitionStatus.COMPLETED
            acquisition.current_step = None
            session.commit()

        context.set_status('COMPLETED')
        context.emit('completed', {'acquisitionId': acquisition_id})
    except AcquisitionPaused:
        context.set_status('PAUSED')
    except JobCancelled:
        session.rollback()
        _reset_acquisition_to_pending(session, acquisition_id)
        context.set_status('CANCELLED')
        context.emit('cancelled', {'acquisitionId': acquisition_id})
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


def clear_acquisition_photos(session: Session, acquisition_id: int) -> None:
    session.query(AcquisitionPhoto).filter(AcquisitionPhoto.acquisition_id == acquisition_id).delete()
    delete_acquisition_files(acquisition_id)


def delete_acquisition(session: Session, acquisition: Acquisition) -> None:
    clear_acquisition_photos(session, acquisition.id)
    session.delete(acquisition)


def _reset_acquisition_to_pending(session: Session, acquisition_id: int) -> None:
    acquisition = session.get(Acquisition, acquisition_id)
    if acquisition is not None:
        clear_acquisition_photos(session, acquisition_id)
        acquisition.status = AcquisitionStatus.PENDING
        acquisition.current_step = None
        session.commit()


def _mark_acquisition_failed(session: Session, acquisition_id: int) -> None:
    acquisition = session.get(Acquisition, acquisition_id)
    if acquisition is not None:
        clear_acquisition_photos(session, acquisition_id)
        acquisition.status = AcquisitionStatus.FAILED
        acquisition.current_step = None
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
    pending_acquisitions = (
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
    for pending_acquisition in pending_acquisitions:
        delete_acquisition(session, pending_acquisition)
