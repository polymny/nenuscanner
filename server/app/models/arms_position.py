from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from ...sa_db import Base


class ArmsPosition(Base):
    __tablename__ = 'arms_position'

    id: Mapped[int] = mapped_column(primary_key=True)
    index: Mapped[int] = mapped_column(nullable=False, index=True)
    emoji_left: Mapped[str] = mapped_column(String(16), nullable=False)
    emoji_right: Mapped[str] = mapped_column(String(16), nullable=False)
    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    def __repr__(self) -> str:
        return (
            f'ArmsPosition(id={self.id!r}, index={self.index!r}, '
            f'emoji_left={self.emoji_left!r}, emoji_right={self.emoji_right!r})'
        )
