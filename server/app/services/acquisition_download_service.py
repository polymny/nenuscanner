from __future__ import annotations

import shutil
import tempfile
from datetime import datetime
from pathlib import Path

from flask import Response
from sqlalchemy.orm import Session, joinedload

from .acquisition_service import acquisition_photos_load_options
from ..models.acquisition import Acquisition
from ..models.acquisition_photo import AcquisitionPhoto
from ...archive import ZipSender

SERVER_ROOT = Path(__file__).resolve().parents[2]

# TODO(temp): disque externe Samsung T9 (label T9_B), monté dans le home de pi
EXTERNAL_DISK_PATH = Path('/home/pi/mnt/T9_B')


class _AcquisitionDownloadZipSender(ZipSender):
    """Zip sender that removes temporary metadata files after the archive is written."""

    def __init__(self, temp_dir: Path):
        super().__init__()
        self._temp_dir = temp_dir

    def generator(self):
        try:
            yield from super().generator()
        finally:
            shutil.rmtree(self._temp_dir, ignore_errors=True)

    def write_to_path(self, path: Path | str) -> None:
        try:
            super().write_to_path(path)
        finally:
            shutil.rmtree(self._temp_dir, ignore_errors=True)


def _folder_name(acquisition: Acquisition) -> str:
    name = f'{acquisition.id}_{acquisition.name}'.replace('/', '_').replace('\\', '_')
    return name.encode('ascii', 'ignore').decode('ascii') or str(acquisition.id)


def _photo_leaf_path(photo: AcquisitionPhoto) -> str:
    rotation = photo.scenario_rotation
    led = photo.scenario_led
    shutter = photo.scenario_shutter_speed
    rotation_name = 'rotation_0' if rotation is None else f'rotation_{rotation.radians_value:g}'
    led_name = 'led_unknown' if led is None else f'led_{led.led_value}'
    shutter_name = 'shutter_unknown' if shutter is None else f'shutter_{shutter.relative_value:g}'
    return f'{rotation_name}/{led_name}/{shutter_name}'


def _add_photos_to_zip(
    zip_sender: ZipSender,
    *,
    section: str,
    folder_name: str,
    photos: list[AcquisitionPhoto],
) -> None:
    for photo in photos:
        folder_path = f'data/{section}/{folder_name}/{_photo_leaf_path(photo)}'
        for relative_path in (photo.raw_path, photo.preview_path):
            disk_path = SERVER_ROOT / relative_path
            if not disk_path.is_file():
                continue
            archive_path = f'{folder_path}/{disk_path.name}'
            if archive_path in zip_sender.files:
                continue
            zip_sender.add_file(archive_path, str(disk_path))


def _build_acquisitions_zip(acquisitions: list[Acquisition], calibrations: list[Acquisition]) -> ZipSender:
    temp_path = Path(tempfile.mkdtemp())
    zip_sender = _AcquisitionDownloadZipSender(temp_path)
    calibration_by_id = {calibration.id: calibration for calibration in calibrations}

    for calibration in calibrations:
        _add_photos_to_zip(
            zip_sender,
            section='calibrations',
            folder_name=_folder_name(calibration),
            photos=list(calibration.photos),
        )

    for acquisition in acquisitions:
        folder_name = _folder_name(acquisition)
        calibration = calibration_by_id.get(acquisition.calibration_id) if acquisition.calibration_id else None
        calibration_name = calibration.name if calibration else None
        if calibration_name:
            escaped = calibration_name.replace('\\', '\\\\').replace('"', '\\"')
            metadata_content = f'calibration: "{escaped}"\n'
        else:
            metadata_content = 'calibration: ""\n'
        metadata_file = temp_path / f'metadata_{acquisition.id}.yaml'
        metadata_file.write_text(metadata_content, encoding='utf-8')
        zip_sender.add_file(f'data/acquisitions/{folder_name}/metadata.yaml', str(metadata_file))
        _add_photos_to_zip(
            zip_sender,
            section='acquisitions',
            folder_name=folder_name,
            photos=list(acquisition.photos),
        )

    return zip_sender


def _load_acquisitions_for_download(
    session: Session, acquisitions: list[Acquisition]
) -> tuple[list[Acquisition], list[Acquisition]]:
    acquisition_ids = [acquisition.id for acquisition in acquisitions]
    acquisitions_with_photos = (
        session.query(Acquisition)
        .options(*acquisition_photos_load_options(), joinedload(Acquisition.calibration))
        .filter(Acquisition.id.in_(acquisition_ids))
        .all()
    )

    calibration_ids = list({row.calibration_id for row in acquisitions_with_photos if row.calibration_id is not None})
    calibrations: list[Acquisition] = []
    if calibration_ids:
        calibrations = (
            session.query(Acquisition)
            .options(*acquisition_photos_load_options())
            .filter(Acquisition.id.in_(calibration_ids))
            .all()
        )

    return acquisitions_with_photos, calibrations


def download_acquisitions_data(session: Session, acquisitions: list[Acquisition]) -> Response:
    """Build a zip archive with acquisition and related calibration data."""
    acquisitions_with_photos, calibrations = _load_acquisitions_for_download(session, acquisitions)
    zip_sender = _build_acquisitions_zip(acquisitions_with_photos, calibrations)
    return zip_sender.response()


def copy_acquisitions_data_to_disk(session: Session, acquisitions: list[Acquisition]) -> Path:
    """Build a zip archive and copy it to the external disk instead of streaming it."""
    acquisitions_with_photos, calibrations = _load_acquisitions_for_download(session, acquisitions)
    zip_sender = _build_acquisitions_zip(acquisitions_with_photos, calibrations)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dest_path = EXTERNAL_DISK_PATH / f'acquisitions_{timestamp}.zip'
    zip_sender.write_to_path(dest_path)
    return dest_path
