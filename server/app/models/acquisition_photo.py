from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .acquisition import Acquisition
from .scenario import ScenarioLED, ScenarioRotation, ScenarioShutterSpeed
from ...sa_db import Base


class AcquisitionPhoto(Base):
    __tablename__ = 'acquisition_photo'

    id: Mapped[int] = mapped_column(primary_key=True)
    path: Mapped[str] = mapped_column(String(512), nullable=False)
    acquisition_id: Mapped[int] = mapped_column(
        ForeignKey('artifact_acquisition.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    scenario_rotation_id: Mapped[int | None] = mapped_column(
        ForeignKey('scenario_rotation.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    scenario_shutter_speed_id: Mapped[int | None] = mapped_column(
        ForeignKey('scenario_shutter_speed.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )
    scenario_led_id: Mapped[int | None] = mapped_column(
        ForeignKey('scenario_led.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
    )

    acquisition: Mapped[Acquisition] = relationship(back_populates='photos')
    scenario_rotation: Mapped[ScenarioRotation | None] = relationship()
    scenario_shutter_speed: Mapped[ScenarioShutterSpeed | None] = relationship()
    scenario_led: Mapped[ScenarioLED | None] = relationship()

    def __repr__(self) -> str:
        return (
            f'AcquisitionPhoto(id={self.id!r}, acquisition_id={self.acquisition_id!r}, path={self.path!r})'
        )
