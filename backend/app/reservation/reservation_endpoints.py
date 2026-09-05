from __future__ import annotations

from datetime import date, datetime, UTC
from decimal import Decimal
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, model_validator
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.db import db
from app.auth.current_user import get_current_user
from app.base_pagination_request import BasePaginationRequest
from app.base_response import BasePagedResponse
from app.models.apartment import Apartment
from app.models.reservation import Reservation
from app.models.user import User
from app.enums.reservation_status_enum import (
    BLOCKING_STATUSES,
    ReservationStatus,
)


router = APIRouter(prefix="/reservations", tags=["reservations"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]

STATUS_PENDING = ReservationStatus.PENDING.value
STATUS_CONFIRMED = ReservationStatus.CONFIRMED.value
STATUS_CANCELLED = ReservationStatus.CANCELLED.value


class ReservationApartmentDto(BaseModel):
    id: int
    title: str
    city: str
    country: str
    image_url: Optional[str]


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


def count_nights(check_in: date, check_out: date) -> int:
    return (check_out - check_in).days


def map_reservation_to_dto(reservation: Reservation) -> ReservationDto:
    apartment_dto = None

    if reservation.apartment:
        main_photo = None

        for photo in reservation.apartment.photos:
            if main_photo is None or photo.is_main:
                main_photo = photo

        apartment_dto = ReservationApartmentDto(
            id=reservation.apartment.id,
            title=reservation.apartment.title,
            city=reservation.apartment.city,
            country=reservation.apartment.country,
            image_url=main_photo.image_url if main_photo else None,
        )

    return ReservationDto(
        id=reservation.id,
        apartment_id=reservation.apartment_id,
        user_id=reservation.user_id,
        check_in=reservation.check_in,
        check_out=reservation.check_out,
        nights=count_nights(reservation.check_in, reservation.check_out),
        guests_count=reservation.guests_count,
        total_price=reservation.total_price,
        status=reservation.status,
        created_at=reservation.created_at,
        apartment=apartment_dto,
        guest_name=reservation.guest.name if reservation.guest else None,
    )


async def find_overlapping(
    session: AsyncSession,
    apartment_id: int,
    check_in: date,
    check_out: date,
    ignore_reservation_id: Optional[int] = None,
) -> Optional[Reservation]:
    """Two ranges overlap when each starts before the other one ends."""
    query = (
        select(Reservation)
        .where(Reservation.apartment_id == apartment_id)
        .where(Reservation.status.in_(BLOCKING_STATUSES))
        .where(Reservation.check_in < check_out)
        .where(Reservation.check_out > check_in)
    )

    if ignore_reservation_id is not None:
        query = query.where(Reservation.id != ignore_reservation_id)

    return (await session.exec(query)).first()


@router.post("", status_code=201, response_model=ReservationDto)
async def create_reservation(
    session: SessionDep,
    request_body: ReservationCreateRequest,
    current_user: User = Depends(get_current_user),
):
    apartment = (
        await session.exec(
            select(Apartment).where(Apartment.id == request_body.apartment_id)
        )
    ).first()

    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    if apartment.status != "active":
        raise HTTPException(status_code=400, detail="Apartment is not available")

    if apartment.user_id == current_user.id:
        raise HTTPException(
            status_code=400, detail="You cannot book your own apartment"
        )

    if request_body.guests_count > apartment.max_guests:
        raise HTTPException(
            status_code=400,
            detail=f"This apartment allows at most {apartment.max_guests} guests",
        )

    overlapping = await find_overlapping(
        session,
        apartment.id,
        request_body.check_in,
        request_body.check_out,
    )

    if overlapping:
        raise HTTPException(
            status_code=409, detail="Selected dates are already taken"
        )

    nights = count_nights(request_body.check_in, request_body.check_out)

    reservation = Reservation(
        apartment_id=apartment.id,
        user_id=current_user.id,
        check_in=request_body.check_in,
        check_out=request_body.check_out,
        guests_count=request_body.guests_count,
        total_price=apartment.price_per_night * nights,
        status=STATUS_PENDING,
    )

    session.add(reservation)
    await session.commit()

    return await get_reservation_by_id(reservation.id, session, current_user)


@router.get("", response_model=BasePagedResponse[ReservationDto])
async def get_my_reservations(
    session: SessionDep,
    q: Annotated[ReservationFilter, Depends()],
    current_user: User = Depends(get_current_user),
):
    query = select(Reservation).where(Reservation.user_id == current_user.id)

    if q.status:
        query = query.where(Reservation.status == q.status)

    return await paginate_reservations(session, query, q)


@router.get("/host", response_model=BasePagedResponse[ReservationDto])
async def get_reservations_for_my_apartments(
    session: SessionDep,
    q: Annotated[ReservationFilter, Depends()],
    current_user: User = Depends(get_current_user),
):
    owned = select(Apartment.id).where(Apartment.user_id == current_user.id)

    query = select(Reservation).where(Reservation.apartment_id.in_(owned))

    if q.status:
        query = query.where(Reservation.status == q.status)

    return await paginate_reservations(session, query, q)


async def paginate_reservations(
    session: AsyncSession,
    query,
    q: ReservationFilter,
):
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.exec(count_query)).one()

    offset = (q.page_number - 1) * q.page_size

    query = (
        query.options(
            selectinload(Reservation.apartment).selectinload(Apartment.photos),
            selectinload(Reservation.guest),
        )
        .order_by(Reservation.check_in.desc())
        .offset(offset)
        .limit(q.page_size)
    )

    items = (await session.exec(query)).all()

    return {
        "page_number": q.page_number,
        "page_size": q.page_size,
        "total": total,
        "items": [map_reservation_to_dto(r) for r in items],
    }


@router.get("/{reservation_id}", response_model=ReservationDto)
async def get_reservation_by_id(
    reservation_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    reservation = (
        await session.exec(
            select(Reservation)
            .where(Reservation.id == reservation_id)
            .options(
                selectinload(Reservation.apartment).selectinload(Apartment.photos),
                selectinload(Reservation.guest),
            )
        )
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    await ensure_can_see(session, reservation, current_user)

    return map_reservation_to_dto(reservation)


@router.patch("/{reservation_id}", response_model=ReservationDto)
async def update_reservation_status(
    reservation_id: int,
    session: SessionDep,
    request_body: ReservationStatusRequest,
    current_user: User = Depends(get_current_user),
):
    reservation = (
        await session.exec(
            select(Reservation)
            .where(Reservation.id == reservation_id)
            .options(
                selectinload(Reservation.apartment).selectinload(Apartment.photos),
                selectinload(Reservation.guest),
            )
        )
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    is_guest = reservation.user_id == current_user.id
    is_host = await owns_apartment(session, reservation.apartment_id, current_user.id)

    if not is_guest and not is_host:
        raise HTTPException(status_code=403, detail="Not allowed")

    if reservation.status == STATUS_CANCELLED:
        raise HTTPException(
            status_code=400, detail="Cancelled reservation cannot be changed"
        )

    # Only the host decides whether a booking is accepted.
    if request_body.status == STATUS_CONFIRMED and not is_host:
        raise HTTPException(
            status_code=403, detail="Only the host can confirm a reservation"
        )

    reservation.status = request_body.status
    session.add(reservation)
    await session.commit()
    await session.refresh(reservation)

    return map_reservation_to_dto(reservation)


async def owns_apartment(
    session: AsyncSession, apartment_id: int, user_id: int
) -> bool:
    apartment = (
        await session.exec(select(Apartment).where(Apartment.id == apartment_id))
    ).first()

    return apartment is not None and apartment.user_id == user_id


async def ensure_can_see(
    session: AsyncSession, reservation: Reservation, current_user: User
) -> None:
    if reservation.user_id == current_user.id:
        return

    if await owns_apartment(session, reservation.apartment_id, current_user.id):
        return

    raise HTTPException(status_code=403, detail="Not allowed")
