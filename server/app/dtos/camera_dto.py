from marshmallow import EXCLUDE, Schema, fields, validate

from ..services.gphoto2_service import CAMERA_SETTING_NAMES


class CameraSettingsSchema(Schema):
    shutterSpeedValues = fields.List(fields.Float(), required=True)
    currentShutterSpeedValue = fields.Float(required=True)
    apertureValues = fields.List(fields.Float(), required=True)
    currentApertureValue = fields.Float(required=True)
    isoValues = fields.List(fields.Float(), required=True)
    currentIsoValue = fields.Float(required=True)


class CameraSettingUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    setting = fields.String(required=True, validate=validate.OneOf(CAMERA_SETTING_NAMES))
    value = fields.Float(required=True)
