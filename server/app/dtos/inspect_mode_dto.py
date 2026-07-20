from marshmallow import Schema, fields, validate

from ..constants.leds import LED_VALUES
from ..constants.shutter_speeds import RELATIVE_SHUTTER_SPEED_MAX, RELATIVE_SHUTTER_SPEED_MIN


class InspectModeLedSchema(Schema):
    class Meta:
        ordered = True

    value = fields.String(required=True, validate=validate.OneOf(LED_VALUES))
    powerId = fields.Integer(required=True, validate=validate.Range(min=1))


class InspectModeShutterSpeedSchema(Schema):
    class Meta:
        ordered = True

    relative_value = fields.Float(
        required=True, validate=validate.Range(min=RELATIVE_SHUTTER_SPEED_MIN, max=RELATIVE_SHUTTER_SPEED_MAX)
    )


class InspectModePoseSchema(Schema):
    class Meta:
        ordered = True

    posesCount = fields.Integer(required=True, validate=validate.Range(min=1, max=12))
