from marshmallow import EXCLUDE, Schema, fields
from marshmallow_sqlalchemy import auto_field

from .base import BaseSchema
from ..models.object2 import Object2


class Object2ReadSchema(BaseSchema):
    class Meta:
        sqla_session = BaseSchema.Meta.sqla_session
        model = Object2
        ordered = True

    id = auto_field(dump_only=True)
    name = auto_field()


class Object2CreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True)

