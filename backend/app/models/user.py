
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from app.enums.role_enum import Role

if TYPE_CHECKING:
    from .apartment import Apartment
    from .reservation import Reservation
    from .user_session import UserSession


def utcnow() -> datetime:
    return datetime.utcnow()


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    role: Role = Field(index=True)   # stored as TEXT
    name: str = Field(max_length=255)
    email: str = Field(max_length=255, unique=True, index=True)
    password: str
    phone: Optional[str] = Field(default=None, max_length=50)

    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)

    apartments: List["Apartment"] = Relationship(back_populates="owner")
    reservations: List["Reservation"] = Relationship(back_populates="guest")
    sessions: List["UserSession"] = Relationship(back_populates="user")
