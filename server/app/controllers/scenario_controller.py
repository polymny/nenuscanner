from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.scenario_dto import ScenarioCreateSchema, ScenarioReadSchema, ScenarioUpdateSchema
from ..models.scenario import Scenario
from ..services.scenario_service import apply_scenario_payload
from ...sa_db import db_session

blp = Blueprint('scenario', __name__, description='Scenario endpoints')


def _scenario_to_details_dto(scenario: Scenario) -> dict:
    return {
        'id': scenario.id,
        'name': scenario.name,
        'leds': [{'value': led.led_value, 'power': led.power} for led in scenario.leds],
        'rotationsCount': len(scenario.rotations),
        'shutterSpeeds': [ss.relative_value for ss in scenario.shutter_speeds],
    }


@blp.route('/')
class ScenarioController(MethodView):
    @blp.response(200, ScenarioReadSchema(many=True))
    def get(self):
        """Liste tous les scénarios, avec leurs détails."""
        scenarios = db_session.query(Scenario).order_by(Scenario.id.asc()).all()
        return [_scenario_to_details_dto(s) for s in scenarios]

    @blp.arguments(ScenarioCreateSchema)
    @blp.response(201, ScenarioReadSchema)
    def post(self, payload):
        """Crée un scénario (avec LEDs, vitesses, rotations)."""
        scenario = Scenario(name=payload['name'], is_custom=True)
        apply_scenario_payload(scenario, payload)
        db_session.add(scenario)
        db_session.commit()
        return _scenario_to_details_dto(scenario)

    @blp.arguments(ScenarioUpdateSchema)
    @blp.response(200, ScenarioReadSchema)
    def patch(self, payload):
        """Met à jour un scénario."""
        scenario_id = payload['id']
        scenario = db_session.get(Scenario, scenario_id)
        if scenario is None:
            abort(404, message='scenario-not-found')

        apply_scenario_payload(scenario, payload)
        db_session.commit()
        return _scenario_to_details_dto(scenario)


@blp.route('/<int:scenario_id>')
class ScenarioByIdController(MethodView):
    @blp.response(204)
    def delete(self, scenario_id):
        """Supprime un scénario par identifiant."""
        scenario = db_session.get(Scenario, scenario_id)
        if scenario is None:
            abort(404, message='scenario-not-found')
        db_session.delete(scenario)
        db_session.commit()
