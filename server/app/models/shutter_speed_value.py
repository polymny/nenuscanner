from __future__ import annotations

from sqlalchemy import Float
from sqlalchemy.orm import Mapped, mapped_column

from ...sa_db import Base


class ShutterSpeedValue(Base):
    __tablename__ = 'shutter_speed_value'

    id: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[float] = mapped_column(Float, nullable=False, unique=True)

    def __repr__(self) -> str:
        return f'ShutterSpeedValue(id={self.id!r}, value={self.value!r})'
