from marshmallow import validate

from ..models.acquisition import AcquisitionStatus

NAME_PATTERN = r'^[a-zA-ZÀ-ÿ0-9\s\-_()]+$'
NAME_VALIDATE = (
    validate.Length(min=1, max=255),
    validate.Regexp(NAME_PATTERN),
)

ACQUISITION_STATUSES = (
    AcquisitionStatus.PENDING,
    AcquisitionStatus.RUNNING,
    AcquisitionStatus.COMPLETED,
    AcquisitionStatus.FAILED,
)
