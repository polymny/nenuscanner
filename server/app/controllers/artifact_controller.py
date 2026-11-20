from collections import defaultdict

from flask.views import MethodView
from flask_smorest import Blueprint, abort
from sqlalchemy.orm import selectinload

from ..dtos.artifact_dto import ArtifactCreateSchema, ArtifactReadSchema, ArtifactUpdateSchema
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.acquisition_image import AcquisitionImage
from ..models.artifact import Artifact
from ..services.acquisition_service import acquisition_size_bytes, acquisition_thumbnail_url
from ...db import db_session

blp = Blueprint('artifact', __name__, description='Gestion des objets')


def _artifact_to_dto(artifact: Artifact) -> dict:
    return {
        'id': artifact.id,
        'name': artifact.name,
    }


def _artifact_summary_to_dto(artifact: Artifact, acquisitions: list[Acquisition]) -> dict:
    """`acquisitions` must be sorted from newest to oldest."""
    completed = [acquisition for acquisition in acquisitions if acquisition.status == AcquisitionStatus.COMPLETED]
    return {
        **_artifact_to_dto(artifact),
        'acquisitionsCount': len(acquisitions),
        'completedAcquisitionIds': [acquisition.id for acquisition in completed],
        'lastAcquisitionAt': acquisitions[0].created_at if acquisitions else None,
        'sizeBytes': sum(acquisition_size_bytes(acquisition.images) for acquisition in acquisitions),
        'thumbnail': next(
            (url for acquisition in completed if (url := acquisition_thumbnail_url(acquisition.images))), None
        ),
    }


@blp.route('/')
class ArtifactController(MethodView):
    @blp.response(200, ArtifactReadSchema(many=True))
    def get(self):
        """Liste tous les objets, triés par id croissant, avec un résumé de leurs acquisitions."""
        artifacts = db_session.query(Artifact).order_by(Artifact.id.asc()).all()
        acquisitions = (
            db_session.query(Acquisition)
            .filter(Acquisition.artifact_id.isnot(None), Acquisition.is_calibration.is_(False))
            .options(selectinload(Acquisition.images).joinedload(AcquisitionImage.scenario_led))
            .order_by(Acquisition.created_at.desc())
            .all()
        )
        by_artifact: dict[int, list[Acquisition]] = defaultdict(list)
        for acquisition in acquisitions:
            by_artifact[acquisition.artifact_id].append(acquisition)
        return [_artifact_summary_to_dto(artifact, by_artifact[artifact.id]) for artifact in artifacts]

    @blp.arguments(ArtifactCreateSchema)
    @blp.response(201, ArtifactReadSchema)
    def post(self, payload):
        """Crée un objet à partir d'un nom."""
        artifact = Artifact(name=payload['name'])
        db_session.add(artifact)
        db_session.commit()
        return _artifact_to_dto(artifact)

    @blp.arguments(ArtifactUpdateSchema)
    @blp.response(200, ArtifactReadSchema)
    def patch(self, payload):
        """Met à jour le nom d'un objet."""
        artifact_id = payload['id']
        artifact = db_session.get(Artifact, artifact_id)
        if artifact is None:
            abort(404, message='artifact-not-found')
        artifact.name = payload['name']
        db_session.commit()
        return _artifact_to_dto(artifact)


@blp.route('/<int:artifact_id>')
class ArtifactByIdController(MethodView):
    @blp.response(204)
    def delete(self, artifact_id):
        """Supprime un objet par identifiant."""
        artifact = db_session.get(Artifact, artifact_id)
        if artifact is None:
            abort(404, message='artifact-not-found')
        db_session.delete(artifact)
        db_session.commit()
