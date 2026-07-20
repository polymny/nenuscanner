from __future__ import annotations

from sqlalchemy import Float
from sqlalchemy.orm import Mapped, mapped_column

from ...db import Base


class RelativeShutterSpeedValue(Base):
    __tablename__ = 'relative_shutter_speed_value'

    id: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[float] = mapped_column(Float, nullable=False, unique=True)

    def __repr__(self) -> str:
        return f'RelativeShutterSpeedValue(id={self.id!r}, value={self.value!r})'
