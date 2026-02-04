from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .apartment import Apartment


def utcnow() -> datetime:
    return datetime.utcnow()


class ApartmentPhoto(SQLModel, table=True):
    __tablename__ = "apartment_photos"

    id: Optional[int] = Field(default=None, primary_key=True)
    apartment_id: int = Field(foreign_key="apartments.id", index=True)

    image_url: str = Field(max_length=500)
    is_main: bool = Field(default=False)

    created_at: datetime = Field(default_factory=utcnow)

    apartment: Optional["Apartment"] = Relationship(back_populates="photos")
