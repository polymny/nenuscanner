from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.artifact_dto import ArtifactCreateSchema, ArtifactReadSchema, ArtifactUpdateSchema
from ..models.artifact import Artifact
from ...db import db_session

blp = Blueprint('artifact', __name__, description='Gestion des objets')


def _artifact_to_dto(artifact: Artifact) -> dict:
    return {
        'id': artifact.id,
        'name': artifact.name,
    }


@blp.route('/')
class ArtifactController(MethodView):
    @blp.response(200, ArtifactReadSchema(many=True))
    def get(self):
        """Liste tous les objets (identifiant et nom), triés par id croissant."""
        artifacts = db_session.query(Artifact).order_by(Artifact.id.asc()).all()
        return [_artifact_to_dto(artifact) for artifact in artifacts]

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
