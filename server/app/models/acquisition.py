from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .arms_position import ArmsPosition

if TYPE_CHECKING:
    from .acquisition_photo import AcquisitionPhoto
from .artifact import Artifact
from .scenario import Scenario
from ...sa_db import Base


class AcquisitionStatus:
    PENDING = 'PENDING'
    RUNNING = 'RUNNING'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'


class Acquisition(Base):
    __tablename__ = 'artifact_acquisition'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    artifact_id: Mapped[int] = mapped_column(
        ForeignKey('artifact.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    scenario_id: Mapped[int] = mapped_column(
        ForeignKey('scenario.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )
    calibration_id: Mapped[int | None] = mapped_column(
        ForeignKey('artifact_acquisition.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    arms_position_id: Mapped[int] = mapped_column(
        ForeignKey('arms_position.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )
    with_rotation_autofocus: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(255), nullable=False)
    iso_value: Mapped[float] = mapped_column(Float, nullable=False)
    absolute_shutter_speed_value: Mapped[float] = mapped_column(Float, nullable=False)
    aperture_value: Mapped[float] = mapped_column(Float, nullable=False)
    is_calibration: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    artifact: Mapped[Artifact] = relationship()
    scenario: Mapped[Scenario] = relationship()
    calibration: Mapped[Acquisition | None] = relationship()
    arms_position: Mapped[ArmsPosition] = relationship()
    photos: Mapped[list['AcquisitionPhoto']] = relationship(
        'AcquisitionPhoto',
        back_populates='acquisition',
        cascade='all, delete-orphan',
        order_by='AcquisitionPhoto.id',
    )

    def __repr__(self) -> str:
        return (
            f'Acquisition(id={self.id!r}, name={self.name!r}, artifact_id={self.artifact_id!r}, '
            f'scenario_id={self.scenario_id!r}, status={self.status!r})'
        )
