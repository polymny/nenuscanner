from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, event, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .camera_settings import CameraSettings
from .rig_configuration import RigConfiguration

if TYPE_CHECKING:
    from .acquisition_photo import AcquisitionPhoto
from .artifact import Artifact
from .profile import Profile
from .scenario import Scenario
from ...db import Base


class AcquisitionStatus:
    PENDING = 'PENDING'
    RUNNING = 'RUNNING'
    PAUSED = 'PAUSED'
    COMPLETED = 'COMPLETED'
    FAILED = 'FAILED'


class Acquisition(Base):
    __tablename__ = 'acquisition'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    artifact_id: Mapped[int | None] = mapped_column(
        ForeignKey('artifact.id', ondelete='CASCADE'),
        nullable=True,
        index=True,
    )
    scenario_id: Mapped[int] = mapped_column(
        ForeignKey('scenario.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    calibration_id: Mapped[int | None] = mapped_column(
        ForeignKey('acquisition.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    rig_configuration_id: Mapped[int] = mapped_column(
        ForeignKey('rig_configuration.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )
    profile_id: Mapped[int | None] = mapped_column(
        ForeignKey('profile.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    camera_settings_id: Mapped[int] = mapped_column(
        ForeignKey('camera_settings.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )
    with_pose_autofocus: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    automatic_pose_change: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    current_step: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(255), nullable=False)
    is_calibration: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    artifact: Mapped[Artifact | None] = relationship()
    scenario: Mapped[Scenario] = relationship(back_populates='acquisitions')
    calibration: Mapped[Acquisition | None] = relationship(
        remote_side=[id],
        foreign_keys=[calibration_id],
    )
    rig_configuration: Mapped[RigConfiguration] = relationship()
    profile: Mapped[Profile | None] = relationship()
    camera_settings: Mapped[CameraSettings] = relationship(
        cascade='all, delete-orphan',
        single_parent=True,
    )
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


@event.listens_for(Acquisition, 'before_delete')
def _acquisition_before_delete(_mapper, _connection, target: Acquisition) -> None:
    from ..services.acquisition_service import delete_acquisition_files

    delete_acquisition_files(target.id)
