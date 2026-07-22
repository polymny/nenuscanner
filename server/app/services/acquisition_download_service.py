from __future__ import annotations

import shutil
import tempfile
from datetime import datetime
from pathlib import Path

import yaml
from flask import Response
from sqlalchemy.orm import Session, joinedload

from .acquisition_service import acquisition_camera_settings_load_options, acquisition_images_load_options
from ..models.acquisition import Acquisition
from ..models.acquisition_image import AcquisitionImage
from ..paths import SERVER_ROOT
from ...archive import ZipSender

# TODO(temp): disque externe Samsung T9 (label T9_B), monté dans le home de pi
EXTERNAL_DISK_PATH = Path('/home/pi/mnt/T9_B')


class _AcquisitionDownloadZipSender(ZipSender):
    """Envoi zip qui supprime les fichiers de métadonnées temporaires après écriture de l'archive."""

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


def _image_leaf_path(image: AcquisitionImage) -> str:
    led = image.scenario_led
    shutter = image.scenario_shutter_speed
    pose_name = f'pose_{image.pose_index}'
    led_name = 'led_unknown' if led is None else f'led_{led.led_value}'
    shutter_name = 'shutter_unknown' if shutter is None else f'shutter_{shutter.relative_shutter_speed_value.value:g}'
    return f'{pose_name}/{led_name}/{shutter_name}'


def _add_images_to_zip(
    zip_sender: ZipSender,
    *,
    section: str,
    folder_name: str,
    images: list[AcquisitionImage],
) -> None:
    for image in images:
        folder_path = f'data/{section}/{folder_name}/{_image_leaf_path(image)}'
        for relative_path in (image.raw_path, image.preview_path):
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
        _add_images_to_zip(
            zip_sender,
            section='calibrations',
            folder_name=_folder_name(calibration),
            images=list(calibration.images),
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
        _add_images_to_zip(
            zip_sender,
            section='acquisitions',
            folder_name=folder_name,
            images=list(acquisition.images),
        )

    return zip_sender


def _load_acquisitions_for_download(
    session: Session, acquisitions: list[Acquisition]
) -> tuple[list[Acquisition], list[Acquisition]]:
    acquisition_ids = [acquisition.id for acquisition in acquisitions if not acquisition.is_calibration]
    calibration_ids_direct = {acquisition.id for acquisition in acquisitions if acquisition.is_calibration}

    acquisitions: list[Acquisition] = []
    if acquisition_ids:
        acquisitions = (
            session.query(Acquisition)
            .options(*acquisition_images_load_options(), joinedload(Acquisition.calibration))
            .filter(Acquisition.id.in_(acquisition_ids))
            .all()
        )

    calibration_ids = list(
        {row.calibration_id for row in acquisitions if row.calibration_id is not None} | calibration_ids_direct
    )
    calibrations: list[Acquisition] = []
    if calibration_ids:
        calibrations = (
            session.query(Acquisition)
            .options(*acquisition_images_load_options())
            .filter(Acquisition.id.in_(calibration_ids))
            .all()
        )

    return acquisitions, calibrations


# ---------------------------------------------------------------------------
# Nouvelle architecture d'archive :
# - un descripteur YAML à la racine (structure proche de la DB)
# - un dossier par acquisition (les calibrations sont des acquisitions)
# - pose_index global, croissant d'une acquisition à la suivante
# ---------------------------------------------------------------------------


def _load_acquisitions_for_archive(session: Session, acquisitions: list[Acquisition]) -> list[Acquisition]:
    selected_ids = [acquisition.id for acquisition in acquisitions]
    selected = (
        session.query(Acquisition)
        .options(
            *acquisition_images_load_options(),
            *acquisition_camera_settings_load_options(),
            joinedload(Acquisition.images).joinedload(AcquisitionImage.effective_shutter_speed_value),
            joinedload(Acquisition.profile),
            joinedload(Acquisition.artifact),
            joinedload(Acquisition.rig_configuration),
            joinedload(Acquisition.calibration),
        )
        .filter(Acquisition.id.in_(selected_ids))
        .all()
    )

    calibration_ids = {acquisition.id for acquisition in selected if acquisition.is_calibration} | {
        acquisition.calibration_id for acquisition in selected if acquisition.calibration_id is not None
    }
    missing_calibration_ids = calibration_ids - {acquisition.id for acquisition in selected}
    if missing_calibration_ids:
        selected.extend(
            session.query(Acquisition)
            .options(
                *acquisition_images_load_options(),
                *acquisition_camera_settings_load_options(),
                joinedload(Acquisition.images).joinedload(AcquisitionImage.effective_shutter_speed_value),
                joinedload(Acquisition.profile),
                joinedload(Acquisition.artifact),
                joinedload(Acquisition.rig_configuration),
                joinedload(Acquisition.calibration),
            )
            .filter(Acquisition.id.in_(missing_calibration_ids))
            .all()
        )

    calibrations = sorted((a for a in selected if a.is_calibration), key=lambda a: a.id)
    non_calibrations = sorted((a for a in selected if not a.is_calibration), key=lambda a: a.id)
    return calibrations + non_calibrations


def _build_acquisitions_archive(acquisitions: list[Acquisition]) -> ZipSender:
    temp_path = Path(tempfile.mkdtemp())
    zip_sender = _AcquisitionDownloadZipSender(temp_path)

    profile_ids: dict[int, str] = {}
    shutter_speed_ids: dict[int, str] = {}
    aperture_ids: dict[int, str] = {}
    iso_ids: dict[int, str] = {}
    led_ids: dict[str, str] = {}
    led_power_ids: dict[int, str] = {}
    rig_configuration_ids: dict[int, str] = {}
    artifact_ids: dict[int, str] = {}
    acquisition_ids: dict[int, str] = {}
    image_ids: dict[int, str] = {}

    descriptor: dict = {
        'profiles': {},
        'shutter_speeds': {},
        'apertures': {},
        'isos': {},
        'leds': {},
        'led_powers': {},
        'rig_configurations': {},
        'artifacts': {},
        'acquisitions': {},
        'images': {},
    }

    next_pose_index = 1

    for acquisition in acquisitions:
        acquisition_key = acquisition_ids.setdefault(acquisition.id, f'id_{len(acquisition_ids) + 1}')

        profile_key = None
        profile = acquisition.profile
        if profile is not None:
            profile_key = profile_ids.setdefault(profile.id, f'id_{len(profile_ids) + 1}')
            descriptor['profiles'][profile_key] = {
                'id': profile_key,
                'name': profile.name,
                'author_name': profile.owner_name,
                'employer': profile.employer,
                'contact': profile.contact,
                'project': profile.project,
            }

        camera_settings = acquisition.camera_settings
        iso = camera_settings.iso_value
        aperture = camera_settings.aperture_value
        iso_key = iso_ids.setdefault(iso.id, f'id_{len(iso_ids) + 1}')
        aperture_key = aperture_ids.setdefault(aperture.id, f'id_{len(aperture_ids) + 1}')
        iso_value = int(iso.value) if float(iso.value).is_integer() else iso.value
        aperture_value = int(aperture.value) if float(aperture.value).is_integer() else aperture.value
        descriptor['isos'][iso_key] = {'value': iso_value, 'unit': ''}
        descriptor['apertures'][aperture_key] = {'value': aperture_value, 'unit': ''}

        rig = acquisition.rig_configuration
        rig_key = rig_configuration_ids.setdefault(rig.id, f'id_{len(rig_configuration_ids) + 1}')
        descriptor['rig_configurations'][rig_key] = {}

        artifact_key = None
        if acquisition.artifact is not None:
            artifact_key = artifact_ids.setdefault(acquisition.artifact.id, f'id_{len(artifact_ids) + 1}')
            descriptor['artifacts'][artifact_key] = {'name': acquisition.artifact.name}

        calibration_key = None
        if acquisition.calibration_id is not None:
            calibration_key = acquisition_ids.setdefault(acquisition.calibration_id, f'id_{len(acquisition_ids) + 1}')

        descriptor['acquisitions'][acquisition_key] = {
            'name': acquisition.name,
            'artifact_id': artifact_key,
            'calibration_id': calibration_key,
            'rig_configuration_id': rig_key,
            'profile_id': profile_key,
            'iso_id': iso_key,
            'aperture_id': aperture_key,
            'is_calibration': acquisition.is_calibration,
            'automatic_pose_change': acquisition.automatic_pose_change,
        }

        local_pose_indices = sorted({image.pose_index for image in acquisition.images})
        local_to_global_pose = {
            local_pose: next_pose_index + offset for offset, local_pose in enumerate(local_pose_indices)
        }
        next_pose_index += len(local_pose_indices)

        for image in acquisition.images:
            image_key = image_ids.setdefault(image.id, f'id_{len(image_ids) + 1}')
            disk_path = SERVER_ROOT / image.raw_path
            if not disk_path.is_file():
                continue

            archive_path = f'{acquisition_key}/{disk_path.name}'
            if archive_path not in zip_sender.files:
                zip_sender.add_file(archive_path, str(disk_path))

            shutter = image.effective_shutter_speed_value
            shutter_key = shutter_speed_ids.setdefault(shutter.id, f'id_{len(shutter_speed_ids) + 1}')
            shutter_value = int(shutter.value) if float(shutter.value).is_integer() else shutter.value
            descriptor['shutter_speeds'][shutter_key] = {'value': shutter_value, 'unit': 's'}

            led_key = None
            led_power_key = None
            led = image.scenario_led
            if led is not None:
                led_key = led_ids.setdefault(led.led_value, f'id_{len(led_ids) + 1}')
                descriptor['leds'][led_key] = {'value': led.led_value}
                led_power = led.led_power_value
                led_power_key = led_power_ids.setdefault(led_power.id, f'id_{len(led_power_ids) + 1}')
                led_power_percent = float(led_power.value) * 100
                led_power_value = int(led_power_percent) if led_power_percent.is_integer() else led_power_percent
                descriptor['led_powers'][led_power_key] = {'value': led_power_value, 'unit': '%'}

            descriptor['images'][image_key] = {
                'path': f'/{archive_path}',
                'acquisition_id': acquisition_key,
                'pose_index': local_to_global_pose[image.pose_index],
                'shutter_speed_id': shutter_key,
                'led_id': led_key,
                'led_power_id': led_power_key,
            }

    descriptor_file = temp_path / 'descriptor.yaml'
    descriptor_file.write_text(
        yaml.safe_dump(descriptor, sort_keys=False, allow_unicode=True),
        encoding='utf-8',
    )
    zip_sender.add_file('descriptor.yaml', str(descriptor_file))
    return zip_sender


def download_acquisitions_data(session: Session, acquisitions: list[Acquisition]) -> Response:
    """Construit une archive zip avec les données d'acquisition et d'étalonnage associées."""
    acquisitions_for_archive = _load_acquisitions_for_archive(session, acquisitions)
    zip_sender = _build_acquisitions_archive(acquisitions_for_archive)
    return zip_sender.response()


def copy_acquisitions_data_to_disk(session: Session, acquisitions: list[Acquisition]) -> Path:
    """Construit une archive zip et la copie sur le disque externe au lieu de la streamer."""
    acquisitions_for_archive = _load_acquisitions_for_archive(session, acquisitions)
    zip_sender = _build_acquisitions_archive(acquisitions_for_archive)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dest_path = EXTERNAL_DISK_PATH / f'acquisitions_{timestamp}.zip'
    zip_sender.write_to_path(dest_path)
    return dest_path
