from flask.views import MethodView
from flask_smorest import Blueprint, abort

from ..dtos.scenario_dto import (
    CompatibleScenarioIdsSchema,
    ScenarioCreateSchema,
    ScenarioDuplicateSchema,
    ScenarioIdSchema,
    ScenarioReadSchema,
    ScenarioUpdateSchema,
)
from ..models.acquisition import Acquisition, AcquisitionStatus
from ..models.scenario import Scenario
from ..services.arms_position_service import get_last_arms_position
from ..services.scenario_service import (
    apply_scenario_payload,
    compatible_scenario_ids,
    duplicate_scenario,
    is_scenario_calibrated,
    scenario_summary_dto,
)
from ...sa_db import db_session

blp = Blueprint('scenario', __name__, description='Scenario endpoints')


def _scenario_to_details_dto(
    scenario: Scenario,
    *,
    acquisitions_by_scenario_id: dict[int, list[dict]] | None = None,
    calibrations_by_scenario_id: dict[int, list[dict]] | None = None,
    is_calibrated: bool = False,
) -> dict:
    return {
        **scenario_summary_dto(scenario),
        'acquisitions': (acquisitions_by_scenario_id or {}).get(scenario.id, []),
        'calibrations': (calibrations_by_scenario_id or {}).get(scenario.id, []),
        'updatedAt': scenario.updated_at,
        'isCalibrated': is_calibrated,
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
            )
            .order_by(Acquisition.id.asc())
            .all()
        )
        for acq_id, acq_name, scenario_id in rows:
            acquisitions_by_scenario_id[scenario_id].append({'id': acq_id, 'name': acq_name})

        calibrations_by_scenario_id: dict[int, list[dict]] = {sid: [] for sid in scenario_ids}
        arms_position = get_last_arms_position()
        scenario_ids_with_completed_calibration: set[int] = set()
        cal_rows = (
            db_session.query(
                Acquisition.id,
                Acquisition.name,
                Acquisition.scenario_id,
                Acquisition.arms_position_id,
                Acquisition.status,
            )
            .filter(
                Acquisition.scenario_id.in_(scenario_ids),
                Acquisition.is_calibration.is_(True),
            )
            .order_by(Acquisition.id.asc())
            .all()
        )
        for cal_id, cal_name, scenario_id, arms_position_id, status in cal_rows:
            calibrations_by_scenario_id[scenario_id].append(
                {'id': cal_id, 'name': cal_name, 'armsPositionId': arms_position_id, 'status': status}
            )
            if arms_position_id == arms_position.id and status == AcquisitionStatus.COMPLETED:
                scenario_ids_with_completed_calibration.add(scenario_id)

        return [
            _scenario_to_details_dto(
                s,
                acquisitions_by_scenario_id=acquisitions_by_scenario_id,
                calibrations_by_scenario_id=calibrations_by_scenario_id,
                is_calibrated=is_scenario_calibrated(s, scenarios, scenario_ids_with_completed_calibration),
            )
            for s in scenarios
        ]

    @blp.arguments(ScenarioCreateSchema)
    @blp.response(204)
    def post(self, payload):
        """Crée un scénario (avec LEDs, temps de pose, rotations)."""
        scenario = Scenario(name=payload['name'], is_custom=True)
        apply_scenario_payload(scenario, payload)
        db_session.add(scenario)
        db_session.commit()

    @blp.arguments(ScenarioUpdateSchema)
    @blp.response(204)
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
            )
            .count()
        )
        if acquisitions_count > 0:
            abort(409, message='scenario-update-not-allowed')

        apply_scenario_payload(scenario, payload)
        db_session.commit()


@blp.route('/<int:scenario_id>/compatible')
class ScenarioCompatibleController(MethodView):
    @blp.response(200, CompatibleScenarioIdsSchema)
    def get(self, scenario_id):
        """Liste les identifiants des scénarios compatibles avec un scénario donné."""
        scenario = db_session.get(Scenario, scenario_id)
        if scenario is None:
            abort(404, message='scenario-not-found')

        all_scenarios = db_session.query(Scenario).all()
        return {'ids': list(compatible_scenario_ids(scenario, all_scenarios))}


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
    @blp.response(201, ScenarioIdSchema)
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
        return {'id': duplicated.id}
