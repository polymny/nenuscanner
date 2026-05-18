from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.acquisition_dto import AcquisitionReadSchema
from ..models.acquisition import Acquisition
from ..models.artifact import Artifact
from ...sa_db import db_session

blp = Blueprint('artifact-acquisition', __name__, description='Acquisitions par artefact')


def _to_dto(row: Acquisition) -> dict:
    return {
        'id': row.id,
        'artifactId': row.artifact_id,
        'scenarioId': row.scenario_id,
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


@blp.route('/<int:artifact_id>/acquisitions')
class AcquisitionsByArtifactController(MethodView):
    @blp.response(200, AcquisitionReadSchema(many=True))
    def get(self, artifact_id: int):
        """Liste les acquisitions pour un artefact donné."""
        if db_session.get(Artifact, artifact_id) is None:
            abort(404, message='artifact-not-found')
        rows = (
            db_session.query(Acquisition)
            .filter(Acquisition.artifact_id == artifact_id)
            .order_by(Acquisition.id.asc())
            .all()
        )
        return [_to_dto(a) for a in rows]
