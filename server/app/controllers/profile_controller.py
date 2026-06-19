from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.profile_dto import ProfileCreateSchema, ProfileReadSchema, ProfileUpdateSchema
from ..models.profile import Profile
from ..services.profile_service import apply_profile_payload, select_profile
from ...sa_db import db_session

blp = Blueprint('profile', __name__, description='Gestion des profils')


def _profile_to_dto(profile: Profile) -> dict:
    return {
        'id': profile.id,
        'name': profile.name,
        'ownerName': profile.owner_name,
        'employer': profile.employer,
        'contact': profile.contact,
        'project': profile.project,
        'isActive': profile.is_active,
    }


@blp.route('/')
class ProfileController(MethodView):
    @blp.response(200, ProfileReadSchema(many=True))
    def get(self):
        """Liste tous les profils."""
        profiles = db_session.query(Profile).order_by(Profile.id.asc()).all()
        return [_profile_to_dto(profile) for profile in profiles]

    @blp.arguments(ProfileCreateSchema)
    @blp.response(201, ProfileReadSchema)
    def post(self, payload):
        """Crée un profil."""
        profile = Profile(name=payload['name'])
        apply_profile_payload(profile, payload)
        db_session.add(profile)
        db_session.commit()
        return _profile_to_dto(profile)

    @blp.arguments(ProfileUpdateSchema)
    @blp.response(200, ProfileReadSchema)
    def patch(self, payload):
        """Met à jour un profil."""
        profile_id = payload['id']
        profile = db_session.get(Profile, profile_id)
        if profile is None:
            abort(404, message='profile-not-found')

        apply_profile_payload(profile, payload)
        db_session.commit()
        return _profile_to_dto(profile)


@blp.route('/<int:profile_id>/select')
class ProfileSelectController(MethodView):
    @blp.response(200, ProfileReadSchema)
    def post(self, profile_id):
        """Sélectionne un profil actif (désactive les autres)."""
        profile = db_session.get(Profile, profile_id)
        if profile is None:
            abort(404, message='profile-not-found')

        select_profile(db_session, profile)
        db_session.commit()
        return _profile_to_dto(profile)


@blp.route('/<int:profile_id>')
class ProfileByIdController(MethodView):
    @blp.response(204)
    def delete(self, profile_id):
        """Supprime un profil par identifiant."""
        profile = db_session.get(Profile, profile_id)
        if profile is None:
            abort(404, message='profile-not-found')
        db_session.delete(profile)
        db_session.commit()
