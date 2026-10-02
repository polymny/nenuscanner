from __future__ import annotations

from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from ...db import Base


class IsoValue(Base):
    __tablename__ = 'iso_value'

    id: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[float] = mapped_column(Float, nullable=False, unique=True)
    api_key: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)

    def __repr__(self) -> str:
        return (
            f'IsoValue(id={self.id!r}, value={self.value!r}, '
            f'api_key={self.api_key!r})'
        )
