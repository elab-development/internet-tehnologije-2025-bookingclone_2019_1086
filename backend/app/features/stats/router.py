from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.shared.db import db
from app.features.auth.dependencies import Policy
from app.features.auth.dependencies import get_current_user
from app.enums.role_enum import Role
from app.shared.api_docs import error_responses
from app.models.apartment import Apartment
from app.models.user import User

from app.features.stats.schemas import ApartmentShareDto, EarningsFilter, EarningsPointDto
from app.features.stats.service import (
    ZERO,
    build_period_range,
    empty_bucket,
    load_earning_reservations,
    money,
    period_key,
    sum_bucket,
    validate_filter,
)

router = APIRouter(prefix="/stats", tags=["stats"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]

@router.get(
    "/host/earnings",
    response_model=list[EarningsPointDto],
    summary="Zarada domaćina po mesecima ili godinama",
    responses=error_responses(400, 401, 403),
)
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


@router.get(
    "/host/by-apartment",
    response_model=list[ApartmentShareDto],
    summary="Udeo svakog apartmana u zaradi",
    responses=error_responses(400, 401, 403),
)
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
