from flask import Response, stream_with_context
from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.acquisition_dto import (
    AcquisitionCreateSchema,
    AcquisitionDetailSchema,
    AcquisitionListQuerySchema,
    AcquisitionReadSchema,
    AcquisitionRunStartSchema,
    CalibrationCreateSchema,
    CalibrationListQuerySchema,
)
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.artifact import Artifact
from ..models.scenario import Scenario
from ..services.acquisition_service import (
    acquisition_photos_load_options,
    acquisition_scenario_load_options,
    acquisition_thumbnail_url,
    delete_acquisition,
    delete_pending_acquisitions,
    get_acquisition_with_photos,
    photo_path_to_url,
    run_acquisition,
)
from ..services.arms_position_service import get_last_arms_position
from ..services.camera_settings_service import snapshot_current_camera_settings
from ..services.profile_service import get_first_active_profile
from ..services.scenario_service import scenario_summary_dto
from ..services.sse_job_runner import sse_job_registry
from ...sa_db import db_session

blp = Blueprint('acquisition', __name__, description='Acquisition endpoints')


def _photo_to_dto(photo) -> dict:
    rotation = photo.scenario_rotation
    led = photo.scenario_led
    shutter_speed = photo.scenario_shutter_speed
    return {
        'id': photo.id,
        'imageUrl': photo_path_to_url(photo.path),
        'acquisitionId': photo.acquisition_id,
        'rotationRadians': rotation.radians_value if rotation is not None else None,
        'ledValue': led.led_value if led is not None else None,
        'ledPower': led.power if led is not None else None,
        'shutterSpeedRelative': shutter_speed.relative_value if shutter_speed is not None else None,
    }


def _to_dto(row: Acquisition, *, scenario: Scenario | None = None, include_photos: bool = False) -> dict:
    cam = row.camera_settings
    payload = {
        'id': row.id,
        'name': row.name,
        'thumbnail': acquisition_thumbnail_url(row.photos),
        'artifactId': row.artifact_id,
        'calibrationId': row.calibration_id,
        'armsPositionId': row.arms_position_id,
        'profileId': row.profile_id,
        'withRotationAutofocus': row.with_rotation_autofocus,
        'status': row.status,
        'isoValue': cam.iso_value,
        'absoluteShutterSpeedValue': cam.absolute_shutter_speed_value,
        'apertureValue': cam.aperture_value,
        'isCalibration': row.is_calibration,
        'createdAt': row.created_at,
        'updatedAt': row.updated_at,
        'scenario': scenario_summary_dto(scenario if scenario is not None else row.scenario),
    }
    if include_photos:
        payload['photos'] = [_photo_to_dto(photo) for photo in row.photos]
    return payload


@blp.route('/')
class AcquisitionController(MethodView):
    @blp.arguments(AcquisitionListQuerySchema, location='query')
    @blp.response(200, AcquisitionReadSchema(many=True))
    def get(self, query_args):
        """Liste les acquisitions d'un artefact."""
        artifact_id = query_args['artifactId']
        if db_session.get(Artifact, artifact_id) is None:
            abort(404, message='artifact-not-found')

        rows = (
            db_session.query(Acquisition)
            .options(*acquisition_photos_load_options(), *acquisition_scenario_load_options())
            .filter(
                Acquisition.artifact_id == artifact_id,
                Acquisition.is_calibration.is_(False),
            )
            .order_by(Acquisition.id.asc())
            .all()
        )
        return [_to_dto(a) for a in rows]

    @blp.arguments(AcquisitionCreateSchema)
    @blp.response(201, AcquisitionReadSchema)
    def post(self, payload):
        """Crée une acquisition pour un artefact."""
        artifact = db_session.get(Artifact, payload['artifactId'])
        if artifact is None:
            abort(404, message='artifact-not-found')

        scenario_id = payload['scenarioId']
        if scenario_id is None:
            abort(400, message='scenario-id-required')

        scenario = db_session.get(Scenario, scenario_id)
        if scenario is None:
            abort(404, message='scenario-not-found')

        arms_position = get_last_arms_position()

        calibration_id = payload['calibrationId']
        if calibration_id is not None:
            calibration = (
                db_session.query(Acquisition)
                .filter(
                    Acquisition.id == calibration_id,
                    Acquisition.is_calibration.is_(True),
                    Acquisition.scenario_id == scenario_id,
                    Acquisition.arms_position_id == arms_position.id,
                    Acquisition.status == AcquisitionStatus.COMPLETED,
                )
                .one_or_none()
            )
            if calibration is None:
                abort(404, message='calibration-not-found')

        active_profile = get_first_active_profile(db_session)

        delete_pending_acquisitions(
            db_session,
            artifact_id=payload['artifactId'],
            scenario_id=scenario_id,
            arms_position_id=arms_position.id,
            is_calibration=False,
        )

        camera_settings_snapshot = snapshot_current_camera_settings(db_session)

        acquisition = Acquisition(
            name=payload['name'],
            artifact_id=payload['artifactId'],
            scenario_id=scenario_id,
            calibration_id=calibration_id,
            arms_position_id=arms_position.id,
            profile_id=active_profile.id if active_profile is not None else None,
            camera_settings_id=camera_settings_snapshot.id,
            with_rotation_autofocus=payload['withRotationAutofocus'],
            status=AcquisitionStatus.PENDING,
            is_calibration=False,
        )
        db_session.add(acquisition)
        db_session.commit()

        return _to_dto(acquisition, scenario=scenario)


@blp.route('/calibrations')
class CalibrationController(MethodView):
    @blp.arguments(CalibrationListQuerySchema, location='query')
    @blp.response(200, AcquisitionReadSchema(many=True))
    def get(self, query_args):
        """Liste toutes les calibrations."""
        scenario_id = query_args['scenarioId']
        if scenario_id is not None and db_session.get(Scenario, scenario_id) is None:
            abort(404, message='scenario-not-found')

        query = (
            db_session.query(Acquisition)
            .options(*acquisition_photos_load_options(), *acquisition_scenario_load_options())
            .filter(Acquisition.is_calibration.is_(True))
        )

        if query_args['onlyCurrentArmsPosition']:
            arms_position = get_last_arms_position()
            query = query.filter(Acquisition.arms_position_id == arms_position.id)

        if scenario_id is not None:
            query = query.filter(Acquisition.scenario_id == scenario_id)

        status = query_args['status']
        if status is not None:
            query = query.filter(Acquisition.status == status)

        rows = query.order_by(Acquisition.id.asc()).all()
        return [_to_dto(a) for a in rows]

    @blp.arguments(CalibrationCreateSchema)
    @blp.response(201, AcquisitionReadSchema)
    def post(self, payload):
        """Crée une calibration."""
        scenario_id = payload['scenarioId']
        if scenario_id is None:
            abort(400, message='scenario-id-required')

        scenario = db_session.get(Scenario, scenario_id)
        if scenario is None:
            abort(404, message='scenario-not-found')

        arms_position = get_last_arms_position()
        active_profile = get_first_active_profile(db_session)

        delete_pending_acquisitions(
            db_session,
            artifact_id=None,
            scenario_id=scenario_id,
            arms_position_id=arms_position.id,
            is_calibration=True,
        )

        camera_settings_snapshot = snapshot_current_camera_settings(db_session)

        calibration = Acquisition(
            name=payload['name'],
            artifact_id=None,
            scenario_id=scenario_id,
            calibration_id=None,
            arms_position_id=arms_position.id,
            profile_id=active_profile.id if active_profile is not None else None,
            camera_settings_id=camera_settings_snapshot.id,
            with_rotation_autofocus=payload['withRotationAutofocus'],
            status=AcquisitionStatus.PENDING,
            is_calibration=True,
        )
        db_session.add(calibration)
        db_session.commit()

        return _to_dto(calibration, scenario=scenario)


@blp.route('/<int:acquisition_id>')
class AcquisitionByIdController(MethodView):
    @blp.response(200, AcquisitionDetailSchema)
    def get(self, acquisition_id):
        """Détail d'une acquisition avec ses photos."""
        acquisition = get_acquisition_with_photos(db_session, acquisition_id)
        if acquisition is None:
            abort(404, message='acquisition-not-found')
        return _to_dto(acquisition, include_photos=True)

    @blp.response(204)
    def delete(self, acquisition_id):
        """Supprime une acquisition par identifiant."""
        acquisition = db_session.get(Acquisition, acquisition_id)
        if acquisition is None:
            abort(404, message='acquisition-not-found')
        delete_acquisition(db_session, acquisition)
        db_session.commit()


@blp.route('/<int:acquisition_id>/run/start')
class AcquisitionRunStartController(MethodView):
    @blp.response(202, AcquisitionRunStartSchema)
    def post(self, acquisition_id):
        """Démarre l'exécution d'une acquisition."""
        acquisition = db_session.get(Acquisition, acquisition_id)
        if acquisition is None:
            abort(404, message='acquisition-not-found')
        if acquisition.status not in (AcquisitionStatus.PENDING, AcquisitionStatus.FAILED):
            abort(409, message='acquisition-not-startable')

        acquisition.status = AcquisitionStatus.RUNNING
        db_session.commit()

        job_id = sse_job_registry.start(
            lambda ctx: run_acquisition(ctx, acquisition_id),
            thread_name_prefix='acquisition',
        )
        return {'jobId': job_id, 'acquisitionId': acquisition_id}


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
