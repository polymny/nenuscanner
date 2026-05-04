from marshmallow import EXCLUDE, Schema, fields, validate
from marshmallow_sqlalchemy import auto_field

from .base import BaseSchema
from ..models.artifact import Artifact

_ARTIFACT_NAME_PATTERN = r'^[a-zA-ZÀ-ÿ0-9\s\-_()]+$'
_NAME_VALIDATE = (
    validate.Length(min=1, max=255),
    validate.Regexp(_ARTIFACT_NAME_PATTERN),
)


class ArtifactReadSchema(BaseSchema):
    class Meta:
        sqla_session = BaseSchema.Meta.sqla_session
        model = Artifact
        ordered = True

    id = auto_field(dump_only=True)
    name = auto_field()


class ArtifactCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True, validate=_NAME_VALIDATE, pre_load=str.strip)


class ArtifactUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True, validate=_NAME_VALIDATE, pre_load=str.strip)
