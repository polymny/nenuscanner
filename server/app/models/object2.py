from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from ...sa_db import Base


class Object2(Base):
    __tablename__ = 'object2'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    def __repr__(self) -> str:
        return f'Object2(id={self.id!r}, name={self.name!r})'

