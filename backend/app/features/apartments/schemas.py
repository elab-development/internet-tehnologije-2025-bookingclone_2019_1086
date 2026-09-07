from decimal import Decimal
from datetime import date
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator

from app.enums.apartment_status_enum import SETTABLE_STATUSES
from app.shared.pagination import BasePaginationRequest


# Filters
class ApartmentFilter(BasePaginationRequest):
    name: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)

    price_per_night_min: Optional[Decimal] = None
    price_per_night_max: Optional[Decimal] = None

    max_guests: Optional[int] = Field(default=None, ge=1)
    rating_average_min: Optional[int] = Field(default=None, ge=0, le=5)
    rating_average_max: Optional[int] = Field(default=None, ge=0, le=5)

    # Free between these two dates. Both have to be sent for the filter to apply.
    check_in: Optional[date] = None
    check_out: Optional[date] = None

    @property
    def has_date_range(self) -> bool:
        return self.check_in is not None and self.check_out is not None

# DTOs
class ApartmentPhotoDto(BaseModel):
    id: int
    image_url: str
    is_main: bool

class ApartmentDto(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    address: str
    city: str
    country: str
    price_per_night: Decimal
    max_guests: int
    status: str
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    rating_average: Optional[Decimal]
    reviews_count: int
    photos: List[ApartmentPhotoDto]

class RentedDayDto(BaseModel):
    """One day of the asked month and whether anything is holding it."""

    date: date
    rented: bool

class ApartmentTagDto(BaseModel):
    """A tag as it hangs off an apartment, without the icon key."""

    id: int
    name: str
    svg_icon: Optional[str]

class ApartmentByIdDto(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    address: str
    city: str
    country: str
    price_per_night: Decimal
    max_guests: int
    status: str
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    rating_average: Optional[Decimal]
    reviews_count: int
    photos: List[ApartmentPhotoDto]
    tags: List[ApartmentTagDto]

class ApartmentCreateRequest(BaseModel):
    title: str = Field(max_length=255)
    description: str = Field(max_length=5000)
    address: str = Field(max_length=255)
    city: str = Field(max_length=100)
    country: str = Field(max_length=100)

    price_per_night: Decimal = Field(gt=0)
    max_guests: int = Field(ge=1)

    tag_ids: list[int] = Field(default_factory=list)

class ApartmentUpdateRequest(BaseModel):
    """Every field is optional: only what is sent gets changed."""

    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=5000)
    address: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)

    price_per_night: Optional[Decimal] = Field(default=None, gt=0)
    max_guests: Optional[int] = Field(default=None, ge=1)

    status: Optional[str] = None
    tag_ids: Optional[list[int]] = None

    @field_validator("status")
    @classmethod
    def check_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in SETTABLE_STATUSES:
            raise ValueError("status must be 'active' or 'inactive'")

        return value
