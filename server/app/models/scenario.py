from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .led_power_value import LedPowerValue
from .shutter_speed_value import ShutterSpeedValue
from ...sa_db import Base

if TYPE_CHECKING:
    from .acquisition import Acquisition


class Scenario(Base):
    __tablename__ = 'scenario'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_custom: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
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

    leds: Mapped[list[ScenarioLED]] = relationship(
        back_populates='scenario',
        cascade='all, delete-orphan',
    )
    shutter_speeds: Mapped[list[ScenarioShutterSpeed]] = relationship(
        back_populates='scenario',
        cascade='all, delete-orphan',
    )
    rotations: Mapped[list[ScenarioRotation]] = relationship(
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
    shutter_speed_value_id: Mapped[int] = mapped_column(
        ForeignKey('shutter_speed_value.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )

    scenario: Mapped[Scenario] = relationship(back_populates='shutter_speeds')
    shutter_speed_value: Mapped[ShutterSpeedValue] = relationship()

    def __repr__(self) -> str:
        return (
            f'ScenarioShutterSpeed(id={self.id!r}, scenario_id={self.scenario_id!r}, '
            f'shutter_speed_value_id={self.shutter_speed_value_id!r})'
        )


class ScenarioRotation(Base):
    __tablename__ = 'scenario_rotation'

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[int] = mapped_column(
        ForeignKey('scenario.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    radians_value: Mapped[float] = mapped_column(Float, nullable=False)

    scenario: Mapped[Scenario] = relationship(back_populates='rotations')

    def __repr__(self) -> str:
        return (
            f'ScenarioRotation(id={self.id!r}, scenario_id={self.scenario_id!r}, radians_value={self.radians_value!r})'
        )
