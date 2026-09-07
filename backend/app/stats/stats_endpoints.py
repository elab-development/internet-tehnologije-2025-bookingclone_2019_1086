from __future__ import annotations

from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import db
from app.auth.authorization import Policy
from app.auth.current_user import get_current_user
from app.enums.role_enum import Role
from app.enums.reservation_status_enum import ReservationStatus
from app.errors import bad_request
from app.models.apartment import Apartment
from app.models.reservation import Reservation
from app.models.user import User


router = APIRouter(prefix="/stats", tags=["stats"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]

# Only a confirmed booking is money. A pending one is not earned yet and a
# cancelled one never will be.
EARNING_STATUS = ReservationStatus.CONFIRMED.value

GROUP_BY_MONTH = "month"
GROUP_BY_YEAR = "year"
GROUP_BY_VALUES = (GROUP_BY_MONTH, GROUP_BY_YEAR)

ZERO = Decimal("0.00")

# A period left wide open on both sides would otherwise draw a bar for every
# month that ever existed. Nobody reads a chart that long anyway.
MAX_PERIODS = 600


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


@router.get("/host/earnings", response_model=list[EarningsPointDto])
async def get_host_earnings(
    session: SessionDep,
    q: Annotated[EarningsFilter, Depends()],
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    """Earnings of the signed in host, one row per month or per year.

    The adding up happens in Python on purpose. Grouping by month in SQL means
    `strftime` on SQLite and `date_trunc` on Postgres, so the query would have
    to be rewritten the day the database changes. For the number of bookings a
    single host has, reading them and summing them here costs nothing.
    """
    validate_filter(q)

    reservations = await load_earning_reservations(session, current_user.id, q)

    buckets: dict[str, dict] = {}

    for reservation in reservations:
        key = period_key(reservation.check_in, q.group_by)
        sum_bucket(buckets.setdefault(key, empty_bucket()), reservation)

    periods = build_period_range(
        q.group_by, list(buckets.keys()), q.date_from, q.date_to
    )

    result = []

    for key in periods:
        bucket = buckets.get(key) or empty_bucket()

        result.append(
            EarningsPointDto(
                period=key,
                total=money(bucket["total"]),
                nights=bucket["nights"],
                reservations=bucket["reservations"],
            )
        )

    return result


@router.get("/host/by-apartment", response_model=list[ApartmentShareDto])
async def get_host_earnings_by_apartment(
    session: SessionDep,
    q: Annotated[EarningsFilter, Depends()],
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    """How the same money splits over the host's apartments, with percentages.

    An apartment that earned nothing in the period is left out: a slice of zero
    is not a slice, it is only a name taking up room in the legend.
    """
    validate_filter(q)

    reservations = await load_earning_reservations(session, current_user.id, q)

    buckets: dict[int, dict] = {}

    for reservation in reservations:
        sum_bucket(
            buckets.setdefault(reservation.apartment_id, empty_bucket()),
            reservation,
        )

    if not buckets:
        return []

    apartments = (
        await session.exec(
            select(Apartment).where(Apartment.id.in_(list(buckets.keys())))
        )
    ).all()

    by_id = {apartment.id: apartment for apartment in apartments}

    grand_total = sum((bucket["total"] for bucket in buckets.values()), ZERO)

    items = []

    for apartment_id, bucket in buckets.items():
        apartment = by_id.get(apartment_id)

        # Every confirmed booking is in the same total, so a share really is a
        # percentage of the whole and the slices add up to a hundred.
        if grand_total > 0:
            share = money((bucket["total"] / grand_total) * 100)
        else:
            share = ZERO

        items.append(
            ApartmentShareDto(
                apartment_id=apartment_id,
                title=apartment.title if apartment else f"#{apartment_id}",
                total=money(bucket["total"]),
                nights=bucket["nights"],
                reservations=bucket["reservations"],
                share_percent=share,
                is_deleted=apartment is not None and apartment.deleted_at is not None,
            )
        )

    items.sort(key=lambda item: item.total, reverse=True)

    return items
