from __future__ import annotations

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .arms_position import ArmsPosition
from .artifact import Artifact
from .scenario import Scenario
from ...sa_db import Base


class Acquisition(Base):
    __tablename__ = 'artifact_acquisition'

    id: Mapped[int] = mapped_column(primary_key=True)
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
    arms_position: Mapped[ArmsPosition] = relationship()

    def __repr__(self) -> str:
        return (
            f'Acquisition(id={self.id!r}, artifact_id={self.artifact_id!r}, '
            f'scenario_id={self.scenario_id!r}, status={self.status!r})'
        )
