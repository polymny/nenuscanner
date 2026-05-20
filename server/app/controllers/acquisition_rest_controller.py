from flask import Response, stream_with_context
from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.acquisition_dto import (
    AcquisitionCreateSchema,
    AcquisitionDetailSchema,
    AcquisitionListQuerySchema,
    AcquisitionReadSchema,
    AcquisitionRunStartSchema,
)
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.artifact import Artifact
from ..models.scenario import Scenario
from ..services.acquisition_service import (
    acquisition_photos_load_options,
    acquisition_thumbnail_url,
    delete_acquisition_photos,
    delete_pending_acquisitions,
    get_acquisition_with_photos,
    photo_path_to_url,
    run_acquisition,
)
from ..services.arms_position_service import get_last_arms_position
from ..services.sse_job_runner import sse_job_registry
from ...sa_db import db_session

blp = Blueprint('acquisition', __name__, description='Acquisition endpoints')

DEFAULT_CAMERA_VALUE = 1.0


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


def _to_dto(row: Acquisition, *, include_photos: bool = False) -> dict:
    payload = {
        'id': row.id,
        'name': row.name,
        'thumbnail': acquisition_thumbnail_url(row.photos),
        'artifactId': row.artifact_id,
        'scenarioId': row.scenario_id,
        'calibrationId': row.calibration_id,
        'armsPositionId': row.arms_position_id,
        'withRotationAutofocus': row.with_rotation_autofocus,
        'status': row.status,
        'isoValue': row.iso_value,
        'absoluteShutterSpeedValue': row.absolute_shutter_speed_value,
        'apertureValue': row.aperture_value,
        'isCalibration': row.is_calibration,
        'createdAt': row.created_at,
        'updatedAt': row.updated_at,
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
            .options(*acquisition_photos_load_options())
            .filter(Acquisition.artifact_id == artifact_id)
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

        calibration_id = payload['calibrationId']
        if calibration_id is not None and db_session.get(Acquisition, calibration_id) is None:
            abort(404, message='calibration-not-found')

        arms_position = get_last_arms_position()

        delete_pending_acquisitions(
            db_session,
            artifact_id=payload['artifactId'],
            scenario_id=scenario_id,
            arms_position_id=arms_position.id,
        )

        acquisition = Acquisition(
            name=payload['name'],
            artifact_id=payload['artifactId'],
            scenario_id=scenario_id,
            calibration_id=calibration_id,
            arms_position_id=arms_position.id,
            with_rotation_autofocus=payload['withRotationAutofocus'],
            status=AcquisitionStatus.PENDING,
            iso_value=DEFAULT_CAMERA_VALUE,
            absolute_shutter_speed_value=DEFAULT_CAMERA_VALUE,
            aperture_value=DEFAULT_CAMERA_VALUE,
            is_calibration=False,
        )
        db_session.add(acquisition)
        db_session.commit()

        return _to_dto(acquisition)


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
        delete_acquisition_photos(db_session, acquisition_id)
        db_session.delete(acquisition)
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
