from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .absolute_shutter_speed_value import AbsoluteShutterSpeedValue
from .aperture_value import ApertureValue
from .iso_value import IsoValue
from ...db import Base


class CameraSettings(Base):
    __tablename__ = 'camera_settings'

    id: Mapped[int] = mapped_column(primary_key=True)

    aperture_value: Mapped[float] = mapped_column(Float, nullable=False)
    iso_value: Mapped[float] = mapped_column(Float, nullable=False)
    absolute_shutter_speed_value: Mapped[float] = mapped_column(Float, nullable=False)

    aperture_value_id: Mapped[int | None] = mapped_column(
        ForeignKey('aperture_value.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )
    iso_value_id: Mapped[int | None] = mapped_column(
        ForeignKey('iso_value.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )
    absolute_shutter_speed_value_id: Mapped[int | None] = mapped_column(
        ForeignKey('absolute_shutter_speed_value.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
    )

    # Il doit exister au plus une ligne "courante" à un instant T (garanti par la logique applicative).
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

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

    aperture_value_ref: Mapped[ApertureValue | None] = relationship(foreign_keys=[aperture_value_id])
    iso_value_ref: Mapped[IsoValue | None] = relationship(foreign_keys=[iso_value_id])
    absolute_shutter_speed_value_ref: Mapped[AbsoluteShutterSpeedValue | None] = relationship(
        foreign_keys=[absolute_shutter_speed_value_id]
    )

    def __repr__(self) -> str:
        return (
            f'CameraSettings(id={self.id!r}, is_current={self.is_current!r}, '
            f'iso_value={self.iso_value!r}, aperture_value={self.aperture_value!r}, '
            f'absolute_shutter_speed_value={self.absolute_shutter_speed_value!r})'
        )
