from marshmallow import Schema, fields


class RigConfigurationEmojisSchema(Schema):
    class Meta:
        ordered = True

    emojiLeft = fields.String(required=True)
    emojiRight = fields.String(required=True)


class RigConfigurationReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    index = fields.Integer(required=True)
    emojiLeft = fields.String(required=True)
    emojiRight = fields.String(required=True)
    createdAt = fields.DateTime(required=True)
