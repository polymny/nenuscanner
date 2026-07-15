from marshmallow import Schema, fields, validate

from ..constants.leds import LED_VALUES
from ..constants.shutter_speeds import SHUTTER_SPEED_MAX, SHUTTER_SPEED_MIN


class InspectModeLedSchema(Schema):
    class Meta:
        ordered = True

    value = fields.String(required=True, validate=validate.OneOf(LED_VALUES))
    powerId = fields.Integer(required=True, validate=validate.Range(min=1))


class InspectModeShutterSpeedSchema(Schema):
    class Meta:
        ordered = True

    value = fields.Float(required=True, validate=validate.Range(min=SHUTTER_SPEED_MIN, max=SHUTTER_SPEED_MAX))


class InspectModeRotationSchema(Schema):
    class Meta:
        ordered = True

    rotationsCount = fields.Integer(required=True, validate=validate.Range(min=1, max=12))
