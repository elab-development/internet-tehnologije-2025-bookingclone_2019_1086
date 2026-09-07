from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, Field

from app.shared.pagination import BasePaginationRequest


MIN_RATING = 1
MAX_RATING = 10


class ReviewDto(BaseModel):
    id: int
    reservation_id: int
    apartment_id: int
    user_id: int
    author_name: Optional[str]
    rating: int
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime


class ApartmentReviewsSummaryDto(BaseModel):
    rating_average: Optional[Decimal]
    reviews_count: int


class ReviewCreateRequest(BaseModel):
    reservation_id: int
    rating: int = Field(ge=MIN_RATING, le=MAX_RATING)
    comment: Optional[str] = Field(default=None, max_length=2000)


class ReviewFilter(BasePaginationRequest):
    pass
