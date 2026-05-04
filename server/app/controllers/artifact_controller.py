from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.artifact_dto import ArtifactCreateSchema, ArtifactReadSchema, ArtifactUpdateSchema
from ..models.artifact import Artifact
from ...sa_db import db_session

blp = Blueprint('artifact', __name__, description='Artifact endpoints')


@blp.route('/')
class ArtifactController(MethodView):
    @blp.response(200, ArtifactReadSchema(many=True))
    def get(self):
        """Liste tous les artefacts (identifiant et nom), triés par id croissant."""
        return db_session.query(Artifact).order_by(Artifact.id.asc()).all()

    @blp.arguments(ArtifactCreateSchema)
    @blp.response(201, ArtifactReadSchema)
    def post(self, body):
        """Crée un artefact à partir d'un nom."""
        artifact = Artifact(name=body['name'])
        db_session.add(artifact)
        db_session.commit()
        return artifact

    @blp.arguments(ArtifactUpdateSchema)
    @blp.response(200, ArtifactReadSchema)
    def patch(self, body):
        """Met à jour le nom d'un artefact."""
        artifact_id = body['id']
        artifact = db_session.get(Artifact, artifact_id)
        if artifact is None:
            abort(404, message='artifact-not-found')
        artifact.name = body['name']
        db_session.commit()
        return artifact


@blp.route('/<int:artifact_id>')
class ArtifactByIdController(MethodView):
    @blp.response(204)
    def delete(self, artifact_id):
        """Supprime un artefact par identifiant."""
        artifact = db_session.get(Artifact, artifact_id)
        if artifact is None:
            abort(404, message='artifact-not-found')
        db_session.delete(artifact)
        db_session.commit()
