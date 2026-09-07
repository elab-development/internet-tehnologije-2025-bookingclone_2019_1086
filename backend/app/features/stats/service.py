from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.enums.reservation_status_enum import ReservationStatus
from app.models.apartment import Apartment
from app.models.reservation import Reservation
from app.shared.errors import bad_request
from app.features.stats.schemas import GROUP_BY_VALUES, GROUP_BY_YEAR, EarningsFilter


# Only a confirmed booking is money. A pending one is not earned yet and a
# cancelled one never will be.
EARNING_STATUS = ReservationStatus.CONFIRMED.value

ZERO = Decimal("0.00")

# A period left wide open on both sides would otherwise draw a bar for every
# month that ever existed. Nobody reads a chart that long anyway.
MAX_PERIODS = 600


def money(value: Decimal) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def validate_filter(q: EarningsFilter) -> None:
    if q.group_by not in GROUP_BY_VALUES:
        raise bad_request("bad_group_by", "group_by must be 'month' or 'year'")

    if q.date_from and q.date_to and q.date_to < q.date_from:
        raise bad_request("date_to_before_from", "date_to cannot be before date_from")

async def load_earning_reservations(
    session: AsyncSession,
    host_id: int,
    q: EarningsFilter,
) -> list[Reservation]:
    """Confirmed bookings of this host's apartments, inside the chosen period.

    A booking counts for the period of its check in, so a stay is money of the
    month it started in and never gets split across two bars.

    Soft deleted apartments stay in: the host really did earn that, and leaving
    them out would make the totals disagree with the reservation list.
    """
    owned = select(Apartment.id).where(Apartment.user_id == host_id)

    query = (
        select(Reservation)
        .where(Reservation.apartment_id.in_(owned))
        .where(Reservation.status == EARNING_STATUS)
    )

    if q.apartment_id is not None:
        # An apartment id belonging to somebody else simply matches nothing,
        # because the query is already fenced to the ones this host owns.
        query = query.where(Reservation.apartment_id == q.apartment_id)

    if q.date_from:
        query = query.where(Reservation.check_in >= q.date_from)

    if q.date_to:
        query = query.where(Reservation.check_in <= q.date_to)

    return list((await session.exec(query)).all())

def period_key(value: date, group_by: str) -> str:
    if group_by == GROUP_BY_YEAR:
        return f"{value.year:04d}"

    return f"{value.year:04d}-{value.month:02d}"

def next_period(key: str, group_by: str) -> str:
    if group_by == GROUP_BY_YEAR:
        return f"{int(key) + 1:04d}"

    year, month = key.split("-")
    year, month = int(year), int(month)

    if month == 12:
        return f"{year + 1:04d}-01"

    return f"{year:04d}-{month + 1:02d}"

def build_period_range(
    group_by: str,
    keys: list[str],
    date_from: Optional[date],
    date_to: Optional[date],
) -> list[str]:
    """Every period between the two ends, the ones that earned nothing included.

    A chart with the empty months dropped lies: three bars side by side read as
    three months in a row even when a whole dead season sits between them. The
    picked period wins over the data, so an empty stretch at either end shows
    as empty instead of being quietly cropped away.
    """
    first = period_key(date_from, group_by) if date_from else None
    last = period_key(date_to, group_by) if date_to else None

    if first is None:
        first = min(keys) if keys else None

    if last is None:
        last = max(keys) if keys else None

    if first is None or last is None or first > last:
        return sorted(keys)

    periods = []
    current = first

    while current <= last and len(periods) < MAX_PERIODS:
        periods.append(current)
        current = next_period(current, group_by)

    return periods

def sum_bucket(bucket: dict, reservation: Reservation) -> None:
    bucket["total"] += reservation.total_price
    bucket["nights"] += (reservation.check_out - reservation.check_in).days
    bucket["reservations"] += 1

def empty_bucket() -> dict:
    return {"total": ZERO, "nights": 0, "reservations": 0}
