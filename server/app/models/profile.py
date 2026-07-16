from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from ...db import Base


class Profile(Base):
    __tablename__ = 'profile'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    employer: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact: Mapped[str | None] = mapped_column(String(255), nullable=True)
    project: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    def __repr__(self) -> str:
        return (
            f'Profile(id={self.id!r}, name={self.name!r}, '
            f'is_active={self.is_active!r})'
        )
