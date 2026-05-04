from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from ...sa_db import Base


class Artifact(Base):
    __tablename__ = 'artifact'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def __repr__(self) -> str:
        return f'Artifact(id={self.id!r}, name={self.name!r})'
