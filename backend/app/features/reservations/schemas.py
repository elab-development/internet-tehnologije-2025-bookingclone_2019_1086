from datetime import date, datetime, UTC
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.enums.reservation_status_enum import ReservationStatus
from app.shared.pagination import BasePaginationRequest


STATUS_CONFIRMED = ReservationStatus.CONFIRMED.value
STATUS_CANCELLED = ReservationStatus.CANCELLED.value


class ReservationApartmentDto(BaseModel):
    id: int
    title: str
    city: str
    country: str
    image_url: Optional[str]
    # A soft deleted apartment has no page left to open, so the card must know.
    is_deleted: bool

class ReservationReviewDto(BaseModel):
    id: int
    rating: int
    comment: Optional[str]


class ReservationDto(BaseModel):
    id: int
    apartment_id: int
    user_id: int
    check_in: date
    check_out: date
    nights: int
    guests_count: int
    total_price: Decimal
    status: str
    created_at: datetime
    apartment: Optional[ReservationApartmentDto]
    guest_name: Optional[str]
    review: Optional[ReservationReviewDto]
    # True once the stay is confirmed, over, and not rated yet.
    is_reviewable: bool

class ReservationLinkDto(BaseModel):
    """What the page behind a mail link shows."""

    reservation: ReservationDto
    # True only for the host's link, which is the one with the buttons.
    can_manage: bool

class ReservationCreateRequest(BaseModel):
    apartment_id: int
    check_in: date
    check_out: date
    guests_count: int = Field(ge=1)

    @model_validator(mode="after")
    def check_dates(self) -> "ReservationCreateRequest":
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")

        if self.check_in < datetime.now(UTC).date():
            raise ValueError("check_in cannot be in the past")

        return self

class ReservationStatusRequest(BaseModel):
    status: str

    @model_validator(mode="after")
    def check_status(self) -> "ReservationStatusRequest":
        if self.status not in (STATUS_CONFIRMED, STATUS_CANCELLED):
            raise ValueError("status must be 'confirmed' or 'cancelled'")

        return self

class ReservationFilter(BasePaginationRequest):
    status: Optional[str] = None

    # Period the stay has to touch. Either side can be sent on its own.
    date_from: Optional[date] = None
    date_to: Optional[date] = None

    apartment_id: Optional[int] = None
