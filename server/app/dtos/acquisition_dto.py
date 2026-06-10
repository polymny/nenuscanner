from marshmallow import EXCLUDE, Schema, fields, validate

from .arms_position_dto import ArmsPositionEmojisSchema
from .scenario_dto import ScenarioSummarySchema
from ..models.acquisition import AcquisitionStatus

_ACQUISITION_NAME_PATTERN = r'^[a-zA-ZÀ-ÿ0-9\s\-_()]+$'
_ACQUISITION_STATUSES = (
    AcquisitionStatus.PENDING,
    AcquisitionStatus.RUNNING,
    AcquisitionStatus.COMPLETED,
    AcquisitionStatus.FAILED,
)
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
    artifactId = fields.Integer(required=True, allow_none=True)
    calibrationId = fields.Integer(required=True, allow_none=True)
    armsPositionId = fields.Integer(required=True)
    armsPosition = fields.Nested(ArmsPositionEmojisSchema, required=True)
    profileId = fields.Integer(required=True, allow_none=True)
    withRotationAutofocus = fields.Boolean(required=True)
    status = fields.String(required=True)
    isoValue = fields.Float(required=True)
    absoluteShutterSpeedValue = fields.Float(required=True)
    apertureValue = fields.Float(required=True)
    isCalibration = fields.Boolean(required=True)
    createdAt = fields.DateTime(required=True)
    updatedAt = fields.DateTime(required=True)
    thumbnail = fields.String(required=True, allow_none=True)
    scenario = fields.Nested(ScenarioSummarySchema, required=True)


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


class AcquisitionCreateReturnSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)


class CalibrationListQuerySchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    onlyCurrentArmsPosition = fields.Boolean(load_default=False)
    scenarioId = fields.Integer(load_default=None, allow_none=True, validate=validate.Range(min=1))
    status = fields.String(load_default=None, allow_none=True, validate=validate.OneOf(_ACQUISITION_STATUSES))


class CalibrationCreateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    name = fields.String(required=True, validate=_NAME_VALIDATE, pre_load=str.strip)
    scenarioId = fields.Integer(required=True, allow_none=True, validate=validate.Range(min=1))
    withRotationAutofocus = fields.Boolean(required=True)


class AcquisitionDownloadSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    acquisitionIds = fields.List(
        fields.Integer(validate=validate.Range(min=1)),
        required=True,
        validate=validate.Length(min=1),
    )
