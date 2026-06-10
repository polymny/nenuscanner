from marshmallow import Schema, fields


class LedPowerValueReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    value = fields.Float(required=True)
