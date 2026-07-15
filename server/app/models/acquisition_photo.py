from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .acquisition import Acquisition
from .scenario import ScenarioLED, ScenarioShutterSpeed
from ...sa_db import Base


class AcquisitionPhoto(Base):
    __tablename__ = 'acquisition_photo'

    id: Mapped[int] = mapped_column(primary_key=True)
    preview_path: Mapped[str] = mapped_column(String(512), nullable=False)
    raw_path: Mapped[str] = mapped_column(String(512), nullable=False)
    acquisition_id: Mapped[int] = mapped_column(
        ForeignKey('artifact_acquisition.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    rotation_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default='0')
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
    scenario_shutter_speed: Mapped[ScenarioShutterSpeed | None] = relationship()
    scenario_led: Mapped[ScenarioLED | None] = relationship()

    def __repr__(self) -> str:
        return (
            f'AcquisitionPhoto(id={self.id!r}, acquisition_id={self.acquisition_id!r}, '
            f'preview_path={self.preview_path!r}, raw_path={self.raw_path!r})'
        )
