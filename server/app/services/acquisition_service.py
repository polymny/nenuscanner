"""Acquisition execution (scenario steps, captures). Semi-PoC still uses Picsum placeholders."""

from __future__ import annotations

import time
import urllib.request
from pathlib import Path

from sqlalchemy.orm import Session, joinedload

from .sse_job_runner import SseJobContext
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.acquisition_photo import AcquisitionPhoto
from ...sa_db import db_session

POC_PHOTO_COUNT = 10
POC_DELAY_SECONDS = 1
POC_IMAGE_SIZE = '800/600'

SERVER_ROOT = Path(__file__).resolve().parents[2]


def photo_relative_path(acquisition_id: int, filename: str) -> str:
    return f'data/acquisitions/{acquisition_id}/{filename}'.replace('\\', '/')


def photo_path_to_url(path: str) -> str:
    if path.startswith('data/'):
        return f'/{path}'
    return f'/data/{path}'


def run_acquisition(context: SseJobContext, acquisition_id: int) -> None:
    """
    Run acquisition for the given id (Picsum placeholders for now).
    Persists photos and updates acquisition status in the database.
    """
    session = db_session()
    try:
        acquisition = session.get(Acquisition, acquisition_id)
        if acquisition is None:
            raise ValueError('acquisition-not-found')
        if acquisition.status != AcquisitionStatus.RUNNING:
            raise ValueError('acquisition-not-running')

        output_dir = SERVER_ROOT / 'data' / 'acquisitions' / str(acquisition_id)
        output_dir.mkdir(parents=True, exist_ok=True)

        context.emit('started', {'total': POC_PHOTO_COUNT, 'acquisitionId': acquisition_id})
        image_urls: list[str] = []

        for index in range(POC_PHOTO_COUNT):
            step = index + 1
            filename = f'photo-{step:02d}.jpg'
            relative_path = photo_relative_path(acquisition_id, filename)
            file_path = SERVER_ROOT / relative_path
            source_url = f'https://picsum.photos/seed/nenuscanner-acq-{acquisition_id}-{step}/{POC_IMAGE_SIZE}'

            urllib.request.urlretrieve(source_url, file_path)

            photo = AcquisitionPhoto(
                path=relative_path,
                acquisition_id=acquisition_id,
                scenario_rotation_id=None,
                scenario_shutter_speed_id=None,
                scenario_led_id=None,
            )
            session.add(photo)
            session.flush()

            image_url = photo_path_to_url(relative_path)
            image_urls.append(image_url)
            context.emit(
                'photo_ready',
                {
                    'step': step,
                    'total': POC_PHOTO_COUNT,
                    'acquisitionId': acquisition_id,
                    'imageUrl': image_url,
                    'photoId': photo.id,
                },
            )
            session.commit()

            if step < POC_PHOTO_COUNT:
                time.sleep(POC_DELAY_SECONDS)

        acquisition = session.get(Acquisition, acquisition_id)
        if acquisition is not None:
            acquisition.status = AcquisitionStatus.COMPLETED
            session.commit()

        context.set_status(AcquisitionStatus.COMPLETED)
        context.emit(
            'completed',
            {'images': image_urls, 'total': POC_PHOTO_COUNT, 'acquisitionId': acquisition_id},
        )
    except Exception:
        session.rollback()
        _mark_acquisition_failed(session, acquisition_id)
        raise
    finally:
        session.close()
        db_session.remove()


def _mark_acquisition_failed(session: Session, acquisition_id: int) -> None:
    acquisition = session.get(Acquisition, acquisition_id)
    if acquisition is not None:
        acquisition.status = AcquisitionStatus.FAILED
        session.commit()


def delete_pending_acquisitions(
    session: Session,
    *,
    artifact_id: int,
    scenario_id: int,
    arms_position_id: int,
) -> None:
    pending_rows = (
        session.query(Acquisition)
        .filter(
            Acquisition.artifact_id == artifact_id,
            Acquisition.scenario_id == scenario_id,
            Acquisition.arms_position_id == arms_position_id,
            Acquisition.status == AcquisitionStatus.PENDING,
        )
        .all()
    )
    for row in pending_rows:
        session.delete(row)


def get_acquisition_with_photos(session: Session, acquisition_id: int) -> Acquisition | None:
    return (
        session.query(Acquisition)
        .options(joinedload(Acquisition.photos))
        .filter(Acquisition.id == acquisition_id)
        .one_or_none()
    )
