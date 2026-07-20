from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .led_power_value import LedPowerValue
from .relative_shutter_speed_value import RelativeShutterSpeedValue
from ...db import Base

if TYPE_CHECKING:
    from .acquisition import Acquisition


class Scenario(Base):
    __tablename__ = 'scenario'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_custom: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    poses_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default='1')
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

    leds: Mapped[list[ScenarioLED]] = relationship(
        back_populates='scenario',
        cascade='all, delete-orphan',
    )
    shutter_speeds: Mapped[list[ScenarioShutterSpeed]] = relationship(
        back_populates='scenario',
        cascade='all, delete-orphan',
    )
    acquisitions: Mapped[list[Acquisition]] = relationship(
        back_populates='scenario',
        cascade='all, delete-orphan',
    )

    def __repr__(self) -> str:
        return f'Scenario(id={self.id!r}, name={self.name!r}, is_custom={self.is_custom!r})'


class ScenarioLED(Base):
    __tablename__ = 'scenario_led'

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[int] = mapped_column(
        ForeignKey('scenario.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    led_value: Mapped[str] = mapped_column(String(255), nullable=False)
    led_power_value_id: Mapped[int] = mapped_column(
        ForeignKey('led_power_value.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )

    scenario: Mapped[Scenario] = relationship(back_populates='leds')
    led_power_value: Mapped[LedPowerValue] = relationship()

    def __repr__(self) -> str:
        return (
            f'ScenarioLED(id={self.id!r}, scenario_id={self.scenario_id!r}, '
            f'led_value={self.led_value!r}, led_power_value_id={self.led_power_value_id!r})'
        )


class ScenarioShutterSpeed(Base):
    __tablename__ = 'scenario_shutter_speed'

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[int] = mapped_column(
        ForeignKey('scenario.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    relative_shutter_speed_value_id: Mapped[int] = mapped_column(
        ForeignKey('relative_shutter_speed_value.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )

    scenario: Mapped[Scenario] = relationship(back_populates='shutter_speeds')
    relative_shutter_speed_value: Mapped[RelativeShutterSpeedValue] = relationship()

    def __repr__(self) -> str:
        return (
            f'ScenarioShutterSpeed(id={self.id!r}, scenario_id={self.scenario_id!r}, '
            f'relative_shutter_speed_value_id={self.relative_shutter_speed_value_id!r})'
        )
