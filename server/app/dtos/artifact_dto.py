from marshmallow import EXCLUDE, Schema, fields

from .base import NAME_VALIDATE


class ArtifactReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)


class ArtifactCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True, validate=NAME_VALIDATE, pre_load=str.strip)


class ArtifactUpdateSchema(ArtifactCreateSchema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    id = fields.Integer(required=True)
