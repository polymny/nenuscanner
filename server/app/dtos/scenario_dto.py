from marshmallow import EXCLUDE, Schema, fields, validate

from ..constants.leds import LED_VALUES

_SCENARIO_NAME_PATTERN = r'^[a-zA-ZÀ-ÿ0-9\s\-_()]+$'
_NAME_VALIDATE = (
    validate.Length(min=1, max=255),
    validate.Regexp(_SCENARIO_NAME_PATTERN),
)


class ScenarioLEDSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    value = fields.String(
        required=True,
        validate=validate.OneOf(LED_VALUES),
        data_key='value',
    )
    powerId = fields.Integer(required=True, data_key='powerId', validate=validate.Range(min=1))


class ScenarioSummarySchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    leds = fields.List(fields.Nested(ScenarioLEDSchema), required=True)
    rotationsCount = fields.Integer(required=True, data_key='rotationsCount')
    shutterSpeedIds = fields.List(fields.Integer(), required=True, data_key='shutterSpeedIds')


class ScenarioReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    updatedAt = fields.DateTime(required=True)
    leds = fields.List(fields.Nested(ScenarioLEDSchema), required=True)
    rotationsCount = fields.Integer(required=True, data_key='rotationsCount')
    shutterSpeedIds = fields.List(fields.Integer(), required=True, data_key='shutterSpeedIds')
    acquisitions = fields.List(fields.Dict(), required=True)
    calibrations = fields.List(fields.Dict(), required=True)
    isCalibrated = fields.Boolean(required=True, data_key='isCalibrated')


class ScenarioCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True, validate=_NAME_VALIDATE, pre_load=str.strip)
    leds = fields.List(fields.Nested(ScenarioLEDSchema), required=True, validate=validate.Length(min=1))
    rotationsCount = fields.Integer(required=True, validate=validate.Range(min=0, max=12), data_key='rotationsCount')
    shutterSpeedIds = fields.List(
        fields.Integer(validate=validate.Range(min=1)),
        required=True,
        data_key='shutterSpeedIds',
        validate=validate.Length(min=1),
    )


class ScenarioUpdateSchema(ScenarioCreateSchema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    id = fields.Integer(required=True)


class ScenarioIdSchema(Schema):
    id = fields.Integer(required=True)


class CompatibleScenarioIdsSchema(Schema):
    ids = fields.List(fields.Integer(), required=True)


class ScenarioDuplicateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    sourceScenarioId = fields.Integer(required=True, data_key='sourceScenarioId')
    name = fields.String(required=True, validate=_NAME_VALIDATE, pre_load=str.strip)
