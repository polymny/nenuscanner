from flask.views import MethodView
from flask_smorest import Blueprint

from ..dtos.rig_configuration_dto import RigConfigurationReadSchema
from ..models.rig_configuration import RigConfiguration
from ..services.rig_configuration_service import get_last_rig_configuration, increase_rig_configuration
from ...db import db_session

blp = Blueprint('rig-configuration', __name__, description='Rig')


def _rig_configuration_to_dto(rig_configuration: RigConfiguration) -> dict:
    return {
        'id': rig_configuration.id,
        'index': rig_configuration.index,
        'emojiLeft': rig_configuration.emoji_left,
        'emojiRight': rig_configuration.emoji_right,
        'createdAt': rig_configuration.created_at,
    }


@blp.route('/last')
class RigConfigurationLastController(MethodView):
    @blp.response(200, RigConfigurationReadSchema)
    def get(self):
        """Retourne le dernier rig (index maximum)."""
        rig_configuration = get_last_rig_configuration(db_session)
        db_session.commit()
        return _rig_configuration_to_dto(rig_configuration)


@blp.route('/increase')
class RigConfigurationIncreaseController(MethodView):
    @blp.response(201, RigConfigurationReadSchema)
    def post(self):
        """Crée un nouveau rig avec 2 emojis aléatoires."""
        rig_configuration = increase_rig_configuration(db_session)
        db_session.commit()
        return _rig_configuration_to_dto(rig_configuration)
