
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Text, Numeric
from sqlmodel import SQLModel, Field, Relationship

from .apartment_tag import ApartmentTag

if TYPE_CHECKING:
    from .user import User
    from .apartment_photo import ApartmentPhoto
    from .reservation import Reservation
    from .tag import Tag


def utcnow() -> datetime:
    return datetime.utcnow()


class Apartment(SQLModel, table=True):
    __tablename__ = "apartments"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)  # host/owner

    title: str = Field(max_length=255)
    description: str = Field(sa_column=Column(Text))
    address: str = Field(max_length=255)
    city: str = Field(max_length=100)
    country: str = Field(max_length=100)

    price_per_night: Decimal = Field(sa_column=Column(Numeric(10, 2), nullable=False))
    max_guests: int = Field(nullable=False)

    status: str = Field(max_length=20, index=True)  # 'active','inactive'

    latitude: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(10, 6)))
    longitude: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(10, 6)))

    rating_average: Optional[Decimal] = Field(default=None, sa_column=Column(Numeric(3, 2)))
    reviews_count: int = Field(default=0)

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    owner: Optional["User"] = Relationship(back_populates="apartments")
    photos: List["ApartmentPhoto"] = Relationship(back_populates="apartment")
    reservations: List["Reservation"] = Relationship(back_populates="apartment")
    tags: List["Tag"] = Relationship(back_populates="apartments", link_model=ApartmentTag)
