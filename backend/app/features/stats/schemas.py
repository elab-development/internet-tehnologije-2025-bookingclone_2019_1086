from datetime import date
from typing import Optional

from decimal import Decimal

from pydantic import BaseModel


GROUP_BY_MONTH = "month"
GROUP_BY_YEAR = "year"
GROUP_BY_VALUES = (GROUP_BY_MONTH, GROUP_BY_YEAR)


class EarningsFilter(BaseModel):
    """The period the host picked, plus an optional single apartment."""

    group_by: str = GROUP_BY_MONTH
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    apartment_id: Optional[int] = None

class EarningsPointDto(BaseModel):
    period: str  # 'YYYY-MM' when grouped by month, 'YYYY' when by year
    total: Decimal
    nights: int
    reservations: int

class ApartmentShareDto(BaseModel):
    apartment_id: int
    title: str
    total: Decimal
    nights: int
    reservations: int
    share_percent: Decimal
    # A soft deleted apartment still earned its money, but has no page left.
    is_deleted: bool
