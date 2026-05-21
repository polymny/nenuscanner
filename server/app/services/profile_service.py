from sqlalchemy.orm import Session

from ..models.profile import Profile


def get_first_active_profile(session: Session) -> Profile | None:
    """Retourne le premier profil actif (ordre croissant par id)."""
    return (
        session.query(Profile)
        .filter(Profile.is_active.is_(True))
        .order_by(Profile.id.asc())
        .first()
    )


def select_profile(session: Session, profile: Profile) -> Profile:
    """Active ce profil et désactive les autres. Ne fait rien si déjà actif."""
    if profile.is_active:
        return profile

    session.query(Profile).filter(Profile.is_active.is_(True)).update(
        {'is_active': False},
        synchronize_session=False,
    )
    profile.is_active = True
    return profile


def apply_profile_payload(profile: Profile, payload: dict) -> None:
    profile.name = payload['name']
    profile.owner_name = payload['ownerName']
    profile.employer = payload['employer']
    profile.contact = payload['contact']
    profile.project = payload['project']
    profile.is_active = payload['isActive']
