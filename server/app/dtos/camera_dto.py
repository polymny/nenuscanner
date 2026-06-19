from marshmallow import EXCLUDE, Schema, fields, validate

# Repère normalisé exposé par l'API (cadre 3:2)
FOCUS_AREA_NORM_WIDTH = 6966
FOCUS_AREA_NORM_HEIGHT = 4644

CAMERA_SETTING_NAMES = ('shutterspeed', 'iso', 'aperture')


class CameraSettingsSchema(Schema):
    class Meta:
        ordered = True

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


class CameraFocusAreaUpdateSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    x = fields.Integer(required=True, validate=validate.Range(min=0, max=FOCUS_AREA_NORM_WIDTH))
    y = fields.Integer(required=True, validate=validate.Range(min=0, max=FOCUS_AREA_NORM_HEIGHT))
