from __future__ import annotations

from sqlalchemy import Boolean, DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from ...sa_db import Base


class CameraSettings(Base):
    __tablename__ = 'camera_settings'

    id: Mapped[int] = mapped_column(primary_key=True)

    aperture_value: Mapped[float] = mapped_column(Float, nullable=False)
    iso_value: Mapped[float] = mapped_column(Float, nullable=False)
    absolute_shutter_speed_value: Mapped[float] = mapped_column(Float, nullable=False)

    # Il doit exister au plus une ligne "courante" à un instant T (garanti par la logique applicative).
    is_current: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

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

