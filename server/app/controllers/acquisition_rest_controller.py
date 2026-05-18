from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.acquisition_dto import (
    AcquisitionCreateSchema,
    AcquisitionListQuerySchema,
    AcquisitionReadSchema,
)
from ..models.acquisition import Acquisition
from ..models.artifact import Artifact
from ..models.scenario import Scenario
from ..services.arms_position_service import get_last_arms_position
from ...sa_db import db_session

blp = Blueprint('acquisition', __name__, description='Acquisition endpoints')

ACQUISITION_STATUS_PENDING = 'PENDING'
DEFAULT_CAMERA_VALUE = 1.0


def _to_dto(row: Acquisition) -> dict:
    return {
        'id': row.id,
        'name': row.name,
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


@blp.route('/')
class AcquisitionCollectionController(MethodView):
    @blp.arguments(AcquisitionListQuerySchema, location='query')
    @blp.response(200, AcquisitionReadSchema(many=True))
    def get(self, query_args):
        """Liste les acquisitions d'un artefact."""
        artifact_id = query_args['artifactId']
        if db_session.get(Artifact, artifact_id) is None:
            abort(404, message='artifact-not-found')

        rows = (
            db_session.query(Acquisition)
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

        acquisition = Acquisition(
            name=payload['name'],
            artifact_id=payload['artifactId'],
            scenario_id=scenario_id,
            calibration_id=calibration_id,
            arms_position_id=arms_position.id,
            with_rotation_autofocus=payload['withRotationAutofocus'],
            status=ACQUISITION_STATUS_PENDING,
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
    @blp.response(204)
    def delete(self, acquisition_id: int):
        """Supprime une acquisition par identifiant."""
        acquisition = db_session.get(Acquisition, acquisition_id)
        if acquisition is None:
            abort(404, message='acquisition-not-found')
        db_session.delete(acquisition)
        db_session.commit()
