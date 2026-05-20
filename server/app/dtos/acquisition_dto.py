from marshmallow import EXCLUDE, Schema, fields, validate

_ACQUISITION_NAME_PATTERN = r'^[a-zA-ZÀ-ÿ0-9\s\-_()]+$'
_NAME_VALIDATE = (
    validate.Length(min=1, max=255),
    validate.Regexp(_ACQUISITION_NAME_PATTERN),
)


class AcquisitionListQuerySchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    artifactId = fields.Integer(required=True, validate=validate.Range(min=1))


class AcquisitionReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    name = fields.String(required=True)
    artifactId = fields.Integer(required=True)
    scenarioId = fields.Integer(required=True)
    calibrationId = fields.Integer(required=True, allow_none=True)
    armsPositionId = fields.Integer(required=True)
    withRotationAutofocus = fields.Boolean(required=True)
    status = fields.String(required=True)
    isoValue = fields.Float(required=True)
    absoluteShutterSpeedValue = fields.Float(required=True)
    apertureValue = fields.Float(required=True)
    isCalibration = fields.Boolean(required=True)
    createdAt = fields.DateTime(required=True)
    updatedAt = fields.DateTime(required=True)
    thumbnail = fields.String(required=True, allow_none=True)


class AcquisitionPhotoReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    imageUrl = fields.String(required=True)
    acquisitionId = fields.Integer(required=True)
    rotationRadians = fields.Float(required=True, allow_none=True)
    ledValue = fields.String(required=True, allow_none=True)
    ledPower = fields.Float(required=True, allow_none=True)
    shutterSpeedRelative = fields.Float(required=True, allow_none=True)


class AcquisitionDetailSchema(AcquisitionReadSchema):
    photos = fields.Nested(AcquisitionPhotoReadSchema, many=True, required=True)


class AcquisitionRunStartSchema(Schema):
    class Meta:
        ordered = True

    jobId = fields.String(required=True)
    acquisitionId = fields.Integer(required=True)


class AcquisitionCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True, validate=_NAME_VALIDATE, pre_load=str.strip)
    artifactId = fields.Integer(required=True, validate=validate.Range(min=1))
    scenarioId = fields.Integer(required=True, allow_none=True, validate=validate.Range(min=1))
    calibrationId = fields.Integer(required=True, allow_none=True, validate=validate.Range(min=1))
    withRotationAutofocus = fields.Boolean(required=True)
