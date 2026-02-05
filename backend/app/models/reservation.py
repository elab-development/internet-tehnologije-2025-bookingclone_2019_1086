from datetime import date, datetime
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Column, Numeric
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .apartment import Apartment
    from .user import User


def utcnow() -> datetime:
    return datetime.utcnow()


class Reservation(SQLModel, table=True):
    __tablename__ = "reservations"

    id: Optional[int] = Field(default=None, primary_key=True)

    apartment_id: int = Field(foreign_key="apartments.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)  # guest

    check_in: date
    check_out: date
    guests_count: int = Field(nullable=False)

    total_price: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    status: str = Field(max_length=20, index=True)  # 'pending','confirmed','cancelled'

    created_at: datetime = Field(default_factory=utcnow)

    apartment: Optional["Apartment"] = Relationship(back_populates="reservations")
    guest: Optional["User"] = Relationship(back_populates="reservations")
