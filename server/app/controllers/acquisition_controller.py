from flask import Response, stream_with_context
from flask.views import MethodView
from flask_smorest import Blueprint, abort
from sqlalchemy.orm import joinedload

from ..dtos.acquisition_dto import (
    AcquisitionCreateReturnSchema,
    AcquisitionCreateSchema,
    AcquisitionDetailSchema,
    AcquisitionDownloadSchema,
    AcquisitionListQuerySchema,
    AcquisitionReadSchema,
    AcquisitionRunCancelSchema,
    AcquisitionRunStartSchema,
    CalibrationCreateSchema,
    CalibrationListQuerySchema,
)
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.artifact import Artifact
from ..models.rig_configuration import RigConfiguration
from ..models.scenario import Scenario
from ..services.acquisition_download_service import (
    EXTERNAL_DISK_PATH,
    copy_acquisitions_data_to_disk,
)
from ..services.acquisition_service import (
    acquisition_photos_load_options,
    acquisition_scenario_load_options,
    acquisition_size_bytes,
    acquisition_thumbnail_url,
    delete_acquisition,
    delete_pending_acquisitions,
    photo_path_to_url,
    run_acquisition,
)
from ..services.camera_settings_service import snapshot_current_camera_settings
from ..services.profile_service import get_first_active_profile
from ..services.rig_configuration_service import get_last_rig_configuration
from ..services.scenario_service import scenario_summary_dto
from ..services.sse_job_runner import sse_job_registry
from ...db import db_session

blp = Blueprint('acquisition', __name__, description='Gestion des acquisitions')


def _photo_to_dto(photo) -> dict:
    led = photo.scenario_led
    shutter_speed = photo.scenario_shutter_speed
    return {
        'id': photo.id,
        'imageUrl': photo_path_to_url(photo.preview_path),
        'acquisitionId': photo.acquisition_id,
        'rotationIndex': photo.rotation_index,
        'ledValue': led.led_value if led is not None else None,
        'ledPower': led.led_power_value.value if led is not None else None,
        'shutterSpeedRelative': shutter_speed.shutter_speed_value.value if shutter_speed is not None else None,
    }


def _acquisition_to_dto(
    acquisition: Acquisition,
    *,
    scenario: Scenario | None = None,
    include_photos: bool = False,
    acquisitions: list[dict] | None = None,
) -> dict:
    camera_settings = acquisition.camera_settings
    payload = {
        'id': acquisition.id,
        'name': acquisition.name,
        'thumbnail': acquisition_thumbnail_url(acquisition.photos),
        'artifactId': acquisition.artifact_id,
        'calibrationId': acquisition.calibration_id,
        'rigConfigurationId': acquisition.rig_configuration_id,
        'rigConfiguration': {
            'emojiLeft': acquisition.rig_configuration.emoji_left,
            'emojiRight': acquisition.rig_configuration.emoji_right,
        },
        'profileId': acquisition.profile_id,
        'withRotationAutofocus': acquisition.with_rotation_autofocus,
        'withManualRotations': acquisition.with_manual_rotations,
        'status': acquisition.status,
        'isoValue': camera_settings.iso_value,
        'absoluteShutterSpeedValue': camera_settings.absolute_shutter_speed_value,
        'apertureValue': camera_settings.aperture_value,
        'isCalibration': acquisition.is_calibration,
        'createdAt': acquisition.created_at,
        'updatedAt': acquisition.updated_at,
        'photosCount': len(acquisition.photos),
        'sizeBytes': acquisition_size_bytes(acquisition.photos),
        'scenario': scenario_summary_dto(scenario if scenario is not None else acquisition.scenario),
    }
    if acquisitions is not None:
        payload['acquisitions'] = acquisitions
    if include_photos:
        payload['photos'] = [_photo_to_dto(photo) for photo in acquisition.photos]
    return payload


@blp.route('/')
class AcquisitionController(MethodView):
    @blp.arguments(AcquisitionListQuerySchema, location='query')
    @blp.response(200, AcquisitionReadSchema(many=True))
    def get(self, query_args):
        """Liste les acquisitions d'un objet."""
        artifact_id = query_args['artifactId']
        if db_session.get(Artifact, artifact_id) is None:
            abort(404, message='artifact-not-found')

        acquisitions = (
            db_session.query(Acquisition)
            .options(
                *acquisition_photos_load_options(),
                *acquisition_scenario_load_options(),
                joinedload(Acquisition.rig_configuration),
            )
            .join(Acquisition.rig_configuration)
            .filter(
                Acquisition.artifact_id == artifact_id,
                Acquisition.is_calibration.is_(False),
            )
            .order_by(RigConfiguration.index.desc())
            .all()
        )
        return [_acquisition_to_dto(acquisition) for acquisition in acquisitions]

    @blp.arguments(AcquisitionCreateSchema)
    @blp.response(201, AcquisitionCreateReturnSchema)
    def post(self, payload):
        """Crée une acquisition pour un objet."""
        artifact = db_session.get(Artifact, payload['artifactId'])
        if artifact is None:
            abort(404, message='artifact-not-found')

        scenario_id = payload['scenarioId']
        if scenario_id is None:
            abort(400, message='scenario-id-required')

        scenario = db_session.get(Scenario, scenario_id)
        if scenario is None:
            abort(404, message='scenario-not-found')

        if payload['withManualRotations'] and scenario.rotations_count == 1:
            abort(400, message='manual-rotations-require-multiple-rotations')

        rig_configuration = get_last_rig_configuration(db_session)

        calibration_id = payload['calibrationId']
        if calibration_id is not None:
            calibration = (
                db_session.query(Acquisition)
                .filter(
                    Acquisition.id == calibration_id,
                    Acquisition.is_calibration.is_(True),
                    Acquisition.rig_configuration_id == rig_configuration.id,
                    Acquisition.status == AcquisitionStatus.COMPLETED,
                )
                .one_or_none()
            )
            if calibration is None:
                abort(404, message='calibration-not-found')

            # TODO : voir ce qu'on fait de ce check là
            # all_scenarios = db_session.query(Scenario).all()
            # matching_scenario_ids = {scenario_id} | compatible_scenario_ids(scenario, all_scenarios)
            # if calibration.scenario_id not in matching_scenario_ids:
            #     abort(404, message='calibration-not-found')

        active_profile = get_first_active_profile(db_session)

        delete_pending_acquisitions(
            db_session,
            artifact_id=payload['artifactId'],
            scenario_id=scenario_id,
            rig_configuration_id=rig_configuration.id,
            is_calibration=False,
        )

        camera_settings_snapshot = snapshot_current_camera_settings(db_session)

        acquisition = Acquisition(
            name=payload['name'],
            artifact_id=payload['artifactId'],
            scenario_id=scenario_id,
            calibration_id=calibration_id,
            rig_configuration_id=rig_configuration.id,
            profile_id=active_profile.id if active_profile is not None else None,
            camera_settings_id=camera_settings_snapshot.id,
            with_rotation_autofocus=payload['withRotationAutofocus'],
            with_manual_rotations=payload['withManualRotations'],
            status=AcquisitionStatus.PENDING,
            is_calibration=False,
        )
        db_session.add(acquisition)
        db_session.commit()

        return {'id': acquisition.id}


@blp.route('/calibrations')
class CalibrationController(MethodView):
    @blp.arguments(CalibrationListQuerySchema, location='query')
    @blp.response(200, AcquisitionReadSchema(many=True))
    def get(self, query_args):
        """Liste tous les étalonnages."""
        query = (
            db_session.query(Acquisition)
            .options(
                *acquisition_photos_load_options(),
                *acquisition_scenario_load_options(),
                joinedload(Acquisition.rig_configuration),
            )
            .filter(Acquisition.is_calibration.is_(True))
        )

        if query_args['onlyCurrentRigConfiguration']:
            rig_configuration = get_last_rig_configuration(db_session)
            query = query.filter(Acquisition.rig_configuration_id == rig_configuration.id)

        status = query_args['status']
        if status is not None:
            query = query.filter(Acquisition.status == status)

        calibrations = query.join(Acquisition.rig_configuration).order_by(RigConfiguration.index.desc()).all()

        calibration_ids = [calibration.id for calibration in calibrations]
        acquisitions_by_calibration_id: dict[int, list[dict]] = {
            calibration_id: [] for calibration_id in calibration_ids
        }
        if calibration_ids:
            rows = (
                db_session.query(Acquisition.id, Acquisition.name, Acquisition.calibration_id)
                .filter(
                    Acquisition.calibration_id.in_(calibration_ids),
                    Acquisition.is_calibration.is_(False),
                )
                .order_by(Acquisition.id.asc())
                .all()
            )
            for acquisition_id, acquisition_name, calibration_id in rows:
                acquisitions_by_calibration_id[calibration_id].append({'id': acquisition_id, 'name': acquisition_name})

        return [
            _acquisition_to_dto(
                calibration,
                acquisitions=acquisitions_by_calibration_id.get(calibration.id, []),
            )
            for calibration in calibrations
        ]

    @blp.arguments(CalibrationCreateSchema)
    @blp.response(201, AcquisitionCreateReturnSchema)
    def post(self, payload):
        """Crée un étalonnage."""
        scenario_id = payload['scenarioId']
        if scenario_id is None:
            abort(400, message='scenario-id-required')

        scenario = db_session.get(Scenario, scenario_id)
        if scenario is None:
            abort(404, message='scenario-not-found')

        if payload['withManualRotations'] and scenario.rotations_count == 1:
            abort(400, message='manual-rotations-require-multiple-rotations')

        rig_configuration = get_last_rig_configuration(db_session)
        active_profile = get_first_active_profile(db_session)

        delete_pending_acquisitions(
            db_session,
            artifact_id=None,
            scenario_id=scenario_id,
            rig_configuration_id=rig_configuration.id,
            is_calibration=True,
        )

        camera_settings_snapshot = snapshot_current_camera_settings(db_session)

        calibration = Acquisition(
            name=payload['name'],
            artifact_id=None,
            scenario_id=scenario_id,
            calibration_id=None,
            rig_configuration_id=rig_configuration.id,
            profile_id=active_profile.id if active_profile is not None else None,
            camera_settings_id=camera_settings_snapshot.id,
            with_rotation_autofocus=payload['withRotationAutofocus'],
            with_manual_rotations=payload['withManualRotations'],
            status=AcquisitionStatus.PENDING,
            is_calibration=True,
        )
        db_session.add(calibration)
        db_session.commit()

        return {'id': calibration.id}


@blp.route('/download')
class AcquisitionDownloadController(MethodView):
    @blp.arguments(AcquisitionDownloadSchema)
    def post(self, payload):
        """Télécharge les données des acquisitions sélectionnées."""
        unique_ids = list(dict.fromkeys(payload['acquisitionIds']))
        acquisitions = db_session.query(Acquisition).filter(Acquisition.id.in_(unique_ids)).all()
        if len(acquisitions) != len(unique_ids):
            abort(404, message='acquisition-not-found')

        for acquisition in acquisitions:
            if acquisition.status != AcquisitionStatus.COMPLETED:
                abort(400, message='acquisition-not-completed')

        if not EXTERNAL_DISK_PATH.is_dir():
            abort(503, message='external-disk-not-mounted')

        dest_path = copy_acquisitions_data_to_disk(db_session, acquisitions)
        return {'path': str(dest_path)}

        # return download_acquisitions_data(db_session, acquisitions)


@blp.route('/<int:acquisition_id>')
class AcquisitionByIdController(MethodView):
    @blp.response(200, AcquisitionDetailSchema)
    def get(self, acquisition_id):
        """Détail d'une acquisition avec ses photos."""
        acquisition = (
            db_session.query(Acquisition)
            .options(*acquisition_photos_load_options(), *acquisition_scenario_load_options())
            .filter(Acquisition.id == acquisition_id)
            .one_or_none()
        )
        if acquisition is None:
            abort(404, message='acquisition-not-found')
        return _acquisition_to_dto(acquisition, include_photos=True)

    @blp.response(204)
    def delete(self, acquisition_id):
        """Supprime une acquisition par identifiant."""
        acquisition = db_session.get(Acquisition, acquisition_id)
        if acquisition is None:
            abort(404, message='acquisition-not-found')
        if acquisition.status == AcquisitionStatus.RUNNING:
            abort(409, message='acquisition-is-running')
        delete_acquisition(db_session, acquisition)
        db_session.commit()


@blp.route('/<int:acquisition_id>/run/start-or-resume')
class AcquisitionRunStartOrResumeController(MethodView):
    @blp.response(202, AcquisitionRunStartSchema)
    def post(self, acquisition_id):
        """Démarre ou reprend l'exécution d'une acquisition."""
        acquisition = db_session.get(Acquisition, acquisition_id)
        if acquisition is None:
            abort(404, message='acquisition-not-found')
        if acquisition.status not in (
            AcquisitionStatus.PENDING,
            AcquisitionStatus.FAILED,
            AcquisitionStatus.PAUSED,
        ):
            abort(409, message='acquisition-not-startable')

        if acquisition.status == AcquisitionStatus.PAUSED:
            if acquisition.current_step is None:
                abort(409, message='acquisition-not-resumable')
        else:
            acquisition.current_step = None

        acquisition.status = AcquisitionStatus.RUNNING
        db_session.commit()

        job_id = sse_job_registry.start(
            lambda ctx: run_acquisition(ctx, acquisition_id),
            thread_name_prefix='acquisition',
        )
        return {'jobId': job_id, 'acquisitionId': acquisition_id}


@blp.route('/run/<string:job_id>/cancel')
class AcquisitionRunCancelController(MethodView):
    @blp.response(202, AcquisitionRunCancelSchema)
    def post(self, job_id):
        """Annule un job d'exécution en cours."""
        if sse_job_registry.get(job_id) is None:
            abort(404, message='job-not-found')
        if not sse_job_registry.request_cancel(job_id):
            abort(409, message='job-not-cancellable')

        return {'jobId': job_id}


@blp.route('/run/<string:job_id>/events')
class AcquisitionRunEventsController(MethodView):
    def get(self, job_id):
        """Flux SSE de progression d'une exécution d'acquisition."""
        if sse_job_registry.get(job_id) is None:
            abort(404, message='job-not-found')

        return Response(
            stream_with_context(sse_job_registry.iter_sse_events(job_id)),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no',
            },
        )
