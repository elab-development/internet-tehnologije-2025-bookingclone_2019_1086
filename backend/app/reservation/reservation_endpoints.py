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
from app.enums.outbox_status_enum import OutboxEventType
from app.enums.apartment_status_enum import ApartmentStatus
from app.outbox.outbox_service import (
    build_reservation_payload,
    enqueue_event,
)
from app.reservation.reservation_link import (
    LINK_ROLE_GUEST,
    LINK_ROLE_HOST,
    decode_link_token,
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
    # A soft deleted apartment has no page left to open, so the card must know.
    is_deleted: bool


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


def apply_reservation_filters(query, q: ReservationFilter):
    if q.date_from and q.date_to and q.date_to < q.date_from:
        raise HTTPException(status_code=400, detail="date_to cannot be before date_from")

    if q.status:
        query = query.where(Reservation.status == q.status)

    # A stay belongs to the period when it overlaps it, not only when it fits
    # inside it, so a booking that started earlier still shows up.
    if q.date_from:
        query = query.where(Reservation.check_out >= q.date_from)

    if q.date_to:
        query = query.where(Reservation.check_in <= q.date_to)

    return query


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
            is_deleted=reservation.apartment.deleted_at is not None,
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
            select(Apartment)
            .where(Apartment.id == request_body.apartment_id)
            .where(Apartment.deleted_at.is_(None))
            .options(selectinload(Apartment.owner))
        )
    ).first()

    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    if apartment.status != ApartmentStatus.ACTIVE.value:
        raise HTTPException(status_code=400, detail="Apartment is not available")

    if apartment.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot book your own apartment")

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
        raise HTTPException(status_code=409, detail="Selected dates are already taken")

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

    # The id is needed for the mail, but the row must not be visible yet.
    await session.flush()

    # Written in the same transaction as the reservation, so the mails are
    # queued exactly when the booking really happened.
    host = apartment.owner

    enqueue_event(
        session,
        OutboxEventType.RESERVATION_CREATED.value,
        build_reservation_payload(
            reservation=reservation,
            apartment=apartment,
            guest=current_user,
            host=host,
            recipient_name=current_user.name,
            recipient_email=current_user.email,
            link_role=LINK_ROLE_GUEST,
        ),
    )

    if host:
        enqueue_event(
            session,
            OutboxEventType.RESERVATION_CREATED_HOST.value,
            build_reservation_payload(
                reservation=reservation,
                apartment=apartment,
                guest=current_user,
                host=host,
                recipient_name=host.name,
                recipient_email=host.email,
                link_role=LINK_ROLE_HOST,
            ),
        )

    await session.commit()

    return await get_reservation_by_id(reservation.id, session, current_user)


@router.get("", response_model=BasePagedResponse[ReservationDto])
async def get_my_reservations(
    session: SessionDep,
    q: Annotated[ReservationFilter, Depends()],
    current_user: User = Depends(get_current_user),
):
    query = apply_reservation_filters(
        select(Reservation).where(Reservation.user_id == current_user.id), q
    )

    return await paginate_reservations(session, query, q)


@router.get("/host", response_model=BasePagedResponse[ReservationDto])
async def get_reservations_for_my_apartments(
    session: SessionDep,
    q: Annotated[ReservationFilter, Depends()],
    current_user: User = Depends(get_current_user),
):
    owned = select(Apartment.id).where(Apartment.user_id == current_user.id)

    query = apply_reservation_filters(
        select(Reservation).where(Reservation.apartment_id.in_(owned)), q
    )

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
                selectinload(Reservation.apartment).selectinload(Apartment.owner),
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

    await apply_status_change(session, reservation, request_body.status, is_host)

    return map_reservation_to_dto(reservation)


async def apply_status_change(
    session: AsyncSession,
    reservation: Reservation,
    new_status: str,
    is_host: bool,
) -> None:
    """Move a reservation to a new status and queue the mail that goes with it.

    Shared by the normal endpoint and the one behind the mail link, so a booking
    confirmed from an email is handled exactly like one confirmed in the app.
    """
    if reservation.status == STATUS_CANCELLED:
        raise HTTPException(status_code=400, detail="Cancelled reservation cannot be changed")

    # Only the host decides whether a booking is accepted.
    if new_status == STATUS_CONFIRMED and not is_host:
        raise HTTPException(status_code=403, detail="Only the host can confirm a reservation")

    previous_status = reservation.status
    reservation.status = new_status
    session.add(reservation)

    # Only the host's answer is news to the guest. A guest cancelling their own
    # booking already knows, and nothing is queued when the status did not
    # actually move.
    if is_host and previous_status != reservation.status and reservation.guest:
        enqueue_event(
            session,
            OutboxEventType.RESERVATION_STATUS_CHANGED.value,
            build_reservation_payload(
                reservation=reservation,
                apartment=reservation.apartment,
                guest=reservation.guest,
                host=reservation.apartment.owner if reservation.apartment else None,
                recipient_name=reservation.guest.name,
                recipient_email=reservation.guest.email,
                link_role=LINK_ROLE_GUEST,
            ),
        )

    await session.commit()


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


# --- the links that go out in the mails ---------------------------------


async def load_reservation_with_relations(
    session: AsyncSession, reservation_id: int
) -> Reservation:
    reservation = (
        await session.exec(
            select(Reservation)
            .where(Reservation.id == reservation_id)
            .options(
                selectinload(Reservation.apartment).selectinload(Apartment.photos),
                selectinload(Reservation.apartment).selectinload(Apartment.owner),
                selectinload(Reservation.guest),
            )
        )
    ).first()

    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    return reservation


async def resolve_link_access(
    session: AsyncSession,
    reservation: Reservation,
    current_user: User,
) -> bool:
    """Decide what the signed in user may do with this reservation.

    The token only says which reservation the link points at. Who is allowed to
    see it comes from the login, not from the token, so both sides of the same
    booking can open any of its links and read the details. Returns True when
    the user is the host, which is the only one who gets to answer.

    A leaked link is still worth nothing: whoever opens it has to be signed in
    as the guest or as the host of that apartment.
    """
    is_host = await owns_apartment(
        session, reservation.apartment_id, current_user.id
    )

    if is_host or reservation.user_id == current_user.id:
        return is_host

    raise HTTPException(status_code=403, detail="This reservation belongs to a different account")


@router.get("/link/{token}", response_model=ReservationLinkDto)
async def get_reservation_by_link(
    token: str,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    payload = decode_link_token(token)

    reservation = await load_reservation_with_relations(
        session, payload["reservation_id"]
    )
    is_host = await resolve_link_access(session, reservation, current_user)

    return ReservationLinkDto(
        reservation=map_reservation_to_dto(reservation),
        can_manage=is_host,
    )


@router.patch("/link/{token}", response_model=ReservationLinkDto)
async def update_reservation_by_link(
    token: str,
    session: SessionDep,
    request_body: ReservationStatusRequest,
    current_user: User = Depends(get_current_user),
):
    payload = decode_link_token(token)

    reservation = await load_reservation_with_relations(
        session, payload["reservation_id"]
    )
    is_host = await resolve_link_access(session, reservation, current_user)

    # The guest opens the link to follow the booking, not to answer it.
    if not is_host:
        raise HTTPException(status_code=403, detail="Only the host can answer this reservation")

    await apply_status_change(session, reservation, request_body.status, is_host=True)

    return ReservationLinkDto(
        reservation=map_reservation_to_dto(reservation),
        can_manage=True,
    )
