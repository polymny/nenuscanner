from marshmallow import Schema, fields


class ShutterSpeedValueReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    value = fields.Float(required=True)
