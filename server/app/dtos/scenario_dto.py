from marshmallow import EXCLUDE, Schema, fields, validate

from .base import ACQUISITION_STATUSES, NAME_VALIDATE
from ..constants.leds import LED_VALUES


class ScenarioLEDSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    value = fields.String(required=True, validate=validate.OneOf(LED_VALUES))
    powerId = fields.Integer(required=True, validate=validate.Range(min=1))


class ScenarioSummarySchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    leds = fields.List(fields.Nested(ScenarioLEDSchema), required=True)
    rotationsCount = fields.Integer(required=True)
    shutterSpeedIds = fields.List(fields.Integer(), required=True)


class ScenarioLinkedAcquisitionSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)


class ScenarioLinkedCalibrationSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    armsPositionId = fields.Integer(required=True)
    status = fields.String(required=True, validate=validate.OneOf(ACQUISITION_STATUSES))


class ScenarioReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    updatedAt = fields.DateTime(required=True)
    leds = fields.List(fields.Nested(ScenarioLEDSchema), required=True)
    rotationsCount = fields.Integer(required=True)
    shutterSpeedIds = fields.List(fields.Integer(), required=True)
    acquisitions = fields.List(fields.Nested(ScenarioLinkedAcquisitionSchema), required=True)
    calibrations = fields.List(fields.Nested(ScenarioLinkedCalibrationSchema), required=True)
    isCalibrated = fields.Boolean(required=True)


class ScenarioCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True, validate=NAME_VALIDATE, pre_load=str.strip)
    leds = fields.List(fields.Nested(ScenarioLEDSchema), required=True, validate=validate.Length(min=1))
    rotationsCount = fields.Integer(required=True, validate=validate.Range(min=0, max=12))
    shutterSpeedIds = fields.List(
        fields.Integer(validate=validate.Range(min=1)),
        required=True,
        validate=validate.Length(min=1),
    )


class ScenarioUpdateSchema(ScenarioCreateSchema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    id = fields.Integer(required=True)


class ScenarioIdSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)


class CompatibleScenarioIdsSchema(Schema):
    class Meta:
        ordered = True

    ids = fields.List(fields.Integer(), required=True)


class ScenarioDuplicateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    sourceScenarioId = fields.Integer(required=True)
    name = fields.String(required=True, validate=NAME_VALIDATE, pre_load=str.strip)
