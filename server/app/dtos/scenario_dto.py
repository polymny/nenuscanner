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
    power = fields.Float(required=True, validate=validate.Range(min=0, max=1))


class ScenarioReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    leds = fields.List(fields.Nested(ScenarioLEDSchema), required=True)
    rotationsCount = fields.Integer(required=True, data_key='rotationsCount')
    shutterSpeeds = fields.List(fields.Float(), required=True, data_key='shutterSpeeds')


class ScenarioCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True, validate=_NAME_VALIDATE, pre_load=str.strip)
    leds = fields.List(fields.Nested(ScenarioLEDSchema), required=True, validate=validate.Length(min=1))
    rotationsCount = fields.Integer(required=True, validate=validate.Range(min=0, max=12), data_key='rotationsCount')
    shutterSpeeds = fields.List(
        fields.Float(validate=validate.Range(min=0, min_inclusive=False)),
        required=True,
        data_key='shutterSpeeds',
        validate=validate.Length(min=1),
    )


class ScenarioUpdateSchema(ScenarioCreateSchema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    id = fields.Integer(required=True)
