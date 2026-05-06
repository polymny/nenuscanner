from __future__ import annotations

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ...sa_db import Base


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
    power: Mapped[float] = mapped_column(Float, nullable=False)

    scenario: Mapped[Scenario] = relationship(back_populates='leds')

    def __repr__(self) -> str:
        return (
            f'ScenarioLED(id={self.id!r}, scenario_id={self.scenario_id!r}, '
            f'led_value={self.led_value!r}, power={self.power!r})'
        )


class ScenarioShutterSpeed(Base):
    __tablename__ = 'scenario_shutter_speed'

    id: Mapped[int] = mapped_column(primary_key=True)
    scenario_id: Mapped[int] = mapped_column(
        ForeignKey('scenario.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    relative_value: Mapped[float] = mapped_column(Float, nullable=False)

    scenario: Mapped[Scenario] = relationship(back_populates='shutter_speeds')

    def __repr__(self) -> str:
        return (
            f'ScenarioShutterSpeed(id={self.id!r}, scenario_id={self.scenario_id!r}, '
            f'relative_value={self.relative_value!r})'
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
