from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.scenario_dto import ScenarioCreateSchema, ScenarioDuplicateSchema, ScenarioReadSchema, ScenarioUpdateSchema
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.scenario import Scenario
from ..services.arms_position_service import get_last_arms_position
from ..services.scenario_service import apply_scenario_payload, duplicate_scenario
from ...sa_db import db_session

blp = Blueprint('scenario', __name__, description='Scenario endpoints')


def _scenario_to_details_dto(
    scenario: Scenario,
    *,
    acquisitions_by_scenario_id: dict[int, list[dict]] | None = None,
    calibrations_by_scenario_id: dict[int, list[dict]] | None = None,
) -> dict:
    return {
        'id': scenario.id,
        'name': scenario.name,
        'leds': [{'value': led.led_value, 'power': led.power} for led in scenario.leds],
        'rotationsCount': len(scenario.rotations),
        'shutterSpeeds': [ss.relative_value for ss in scenario.shutter_speeds],
        'acquisitions': (acquisitions_by_scenario_id or {}).get(scenario.id, []),
        'calibrations': (calibrations_by_scenario_id or {}).get(scenario.id, []),
    }


@blp.route('/')
class ScenarioController(MethodView):
    @blp.response(200, ScenarioReadSchema(many=True))
    def get(self):
        """Liste tous les scénarios, avec leurs détails."""
        scenarios = db_session.query(Scenario).order_by(Scenario.id.asc()).all()
        scenario_ids = [s.id for s in scenarios]
        if not scenario_ids:
            return []

        acquisitions_by_scenario_id: dict[int, list[dict]] = {sid: [] for sid in scenario_ids}
        rows = (
            db_session.query(Acquisition.id, Acquisition.name, Acquisition.scenario_id)
            .filter(
                Acquisition.scenario_id.in_(scenario_ids),
                Acquisition.is_calibration.is_(False),
                Acquisition.status == AcquisitionStatus.COMPLETED,
            )
            .order_by(Acquisition.id.asc())
            .all()
        )
        for acq_id, acq_name, scenario_id in rows:
            acquisitions_by_scenario_id[scenario_id].append({'id': acq_id, 'name': acq_name})

        arms_position = get_last_arms_position()
        calibrations_by_scenario_id: dict[int, list[dict]] = {sid: [] for sid in scenario_ids}
        cal_rows = (
            db_session.query(Acquisition.id, Acquisition.name, Acquisition.scenario_id)
            .filter(
                Acquisition.scenario_id.in_(scenario_ids),
                Acquisition.is_calibration.is_(True),
                Acquisition.arms_position_id == arms_position.id,
                Acquisition.status == AcquisitionStatus.COMPLETED,
            )
            .order_by(Acquisition.id.asc())
            .all()
        )
        for cal_id, cal_name, scenario_id in cal_rows:
            calibrations_by_scenario_id[scenario_id].append({'id': cal_id, 'name': cal_name})

        return [
            _scenario_to_details_dto(
                s,
                acquisitions_by_scenario_id=acquisitions_by_scenario_id,
                calibrations_by_scenario_id=calibrations_by_scenario_id,
            )
            for s in scenarios
        ]

    @blp.arguments(ScenarioCreateSchema)
    @blp.response(201, ScenarioReadSchema)
    def post(self, payload):
        """Crée un scénario (avec LEDs, temps de pose, rotations)."""
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

        acquisitions_count = (
            db_session.query(Acquisition)
            .filter(
                Acquisition.scenario_id == scenario_id,
                Acquisition.is_calibration.is_(False),
                Acquisition.status == AcquisitionStatus.COMPLETED,
            )
            .count()
        )
        if acquisitions_count > 0:
            abort(409, message='scenario-update-not-allowed')

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


@blp.route('/duplicate')
class ScenarioDuplicateController(MethodView):
    @blp.arguments(ScenarioDuplicateSchema)
    @blp.response(201, ScenarioReadSchema)
    def post(self, payload):
        """Duplique un scénario existant sous un nouveau nom."""
        source_scenario_id = payload['sourceScenarioId']
        new_name = payload['name']

        source = db_session.get(Scenario, source_scenario_id)
        if source is None:
            abort(404, message='scenario-not-found')

        duplicated = duplicate_scenario(source, new_name)
        db_session.add(duplicated)
        db_session.commit()
        return _scenario_to_details_dto(duplicated)
