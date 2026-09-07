from datetime import date
from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.models.apartment import Apartment
from app.models.reservation import Reservation
from app.models.user import User
from app.enums.reservation_status_enum import BLOCKING_STATUSES, ReservationStatus
from app.enums.outbox_status_enum import OutboxEventType
from app.shared.errors import bad_request, forbidden, not_found
from app.shared.outbox.queue import enqueue_event
from app.features.reservations.payloads import build_reservation_payload
from app.features.reservations.links import LINK_ROLE_GUEST
from app.features.reservations.schemas import (
    ReservationApartmentDto,
    ReservationDto,
    ReservationFilter,
)


STATUS_CONFIRMED = ReservationStatus.CONFIRMED.value
STATUS_CANCELLED = ReservationStatus.CANCELLED.value


def apply_reservation_filters(query, q: ReservationFilter):
    if q.date_from and q.date_to and q.date_to < q.date_from:
        raise bad_request("date_to_before_from", "date_to cannot be before date_from")

    if q.status:
        query = query.where(Reservation.status == q.status)

    if q.apartment_id is not None:
        query = query.where(Reservation.apartment_id == q.apartment_id)

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
        raise bad_request("reservation_cancelled", "Cancelled reservation cannot be changed")

    # Only the host decides whether a booking is accepted.
    if new_status == STATUS_CONFIRMED and not is_host:
        raise forbidden("only_host_confirms", "Only the host can confirm a reservation")

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

    raise forbidden("not_allowed", "Not allowed")

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
        raise not_found("reservation_not_found", "Reservation not found")

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

    raise forbidden("reservation_other_account", "This reservation belongs to a different account")
