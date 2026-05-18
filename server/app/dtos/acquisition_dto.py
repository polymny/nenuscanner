from marshmallow import Schema, fields


class AcquisitionReadSchema(Schema):
    class Meta:
        ordered = True

    id = fields.Integer(required=True)
    artifactId = fields.Integer(required=True)
    scenarioId = fields.Integer(required=True)
    armsPositionId = fields.Integer(required=True)
    withRotationAutofocus = fields.Boolean(required=True)
    status = fields.String(required=True)
    isoValue = fields.Float(required=True)
    absoluteShutterSpeedValue = fields.Float(required=True)
    apertureValue = fields.Float(required=True)
    isCalibration = fields.Boolean(required=True)
    createdAt = fields.DateTime(required=True)
    updatedAt = fields.DateTime(required=True)
