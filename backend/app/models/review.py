from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import CheckConstraint, Column, Text
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .apartment import Apartment
    from .reservation import Reservation
    from .user import User


def utcnow() -> datetime:
    return datetime.utcnow()


class Review(SQLModel, table=True):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 10", name="ck_reviews_rating_range"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)

    # One review per stay: the unique key is what stops a guest from rating
    # the same reservation twice, and rating a stay they never had.
    reservation_id: int = Field(foreign_key="reservations.id", unique=True, index=True)

    apartment_id: int = Field(foreign_key="apartments.id", index=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    rating: int = Field(nullable=False, index=True)
    comment: Optional[str] = Field(default=None, sa_column=Column(Text))

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    reservation: Optional["Reservation"] = Relationship(back_populates="review")
    apartment: Optional["Apartment"] = Relationship(back_populates="reviews")
    author: Optional["User"] = Relationship(back_populates="reviews")
