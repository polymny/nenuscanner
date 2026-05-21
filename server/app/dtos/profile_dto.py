from marshmallow import EXCLUDE, Schema, fields, validate

_PROFILE_NAME_PATTERN = r'^[a-zA-ZÀ-ÿ0-9\s\-_()]+$'
_NAME_VALIDATE = (
    validate.Length(min=1, max=255),
    validate.Regexp(_PROFILE_NAME_PATTERN),
)


class ProfileReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    ownerName = fields.String(required=True, allow_none=True)
    employer = fields.String(required=True, allow_none=True)
    contact = fields.String(required=True, allow_none=True)
    project = fields.String(required=True, allow_none=True)
    isActive = fields.Boolean(required=True)


class ProfileCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True, validate=_NAME_VALIDATE, pre_load=str.strip)
    ownerName = fields.String(required=True, allow_none=True)
    employer = fields.String(required=True, allow_none=True)
    contact = fields.String(required=True, allow_none=True)
    project = fields.String(required=True, allow_none=True)
    isActive = fields.Boolean(required=True)


class ProfileUpdateSchema(ProfileCreateSchema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    id = fields.Integer(required=True)
