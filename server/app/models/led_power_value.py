from sqlalchemy import Float
from sqlalchemy.orm import Mapped, mapped_column

from ...sa_db import Base


class LedPowerValue(Base):
    __tablename__ = 'led_power_value'

    id: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[float] = mapped_column(Float, nullable=False, unique=True)

    def __repr__(self) -> str:
        return f'LedPowerValue(id={self.id!r}, value={self.value!r})'
