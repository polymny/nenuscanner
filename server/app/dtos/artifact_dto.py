from marshmallow import EXCLUDE, Schema, fields

from .base import NAME_VALIDATE


class ArtifactReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    # Summary of the artifact's acquisitions, only filled by the list endpoint.
    acquisitionsCount = fields.Integer()
    completedAcquisitionIds = fields.List(fields.Integer())
    lastAcquisitionAt = fields.DateTime(allow_none=True)
    sizeBytes = fields.Integer()
    thumbnail = fields.String(allow_none=True)


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
