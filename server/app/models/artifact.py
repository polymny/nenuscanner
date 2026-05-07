from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ...sa_db import Base


class Artifact(Base):
    __tablename__ = 'artifact'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
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

    def __repr__(self) -> str:
        return f'Artifact(id={self.id!r}, name={self.name!r})'
