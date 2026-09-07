from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import selectinload

from app.shared.db import db
from app.features.auth.dependencies import get_current_user
from app.shared.responses import BasePagedResponse
from app.models.apartment import Apartment
from app.models.reservation import Reservation
from app.models.user import User
from app.enums.reservation_status_enum import ReservationStatus
from app.shared.errors import bad_request, conflict, forbidden, not_found
from app.shared.api_docs import error_responses
from app.enums.outbox_status_enum import OutboxEventType
from app.enums.apartment_status_enum import ApartmentStatus
from app.shared.outbox.queue import enqueue_event
from app.features.reservations.payloads import build_reservation_payload
from app.features.reservations.links import (
    LINK_ROLE_GUEST,
    LINK_ROLE_HOST,
    decode_link_token,
)

from app.features.reservations.schemas import ReservationCreateRequest, ReservationDto, ReservationFilter, ReservationLinkDto, ReservationStatusRequest
from app.features.reservations.service import (
    apply_reservation_filters,
    apply_status_change,
    count_nights,
    ensure_can_see,
    find_overlapping,
    load_reservation_with_relations,
    map_reservation_to_dto,
    owns_apartment,
    paginate_reservations,
    resolve_link_access,
)

router = APIRouter(prefix="/reservations", tags=["reservations"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]

STATUS_PENDING = ReservationStatus.PENDING.value
STATUS_CONFIRMED = ReservationStatus.CONFIRMED.value
STATUS_CANCELLED = ReservationStatus.CANCELLED.value


@router.post(
    "",
    status_code=201,
    response_model=ReservationDto,
    summary="Nova rezervacija",
    responses=error_responses(400, 401, 404, 409),
)
async def create_reservation(
    session: SessionDep,
    request_body: ReservationCreateRequest,
    current_user: User = Depends(get_current_user),
):
    """Gost traži termin; rezervacija kreće u stanju `pending`.

    Odbija se ako se datumi preklapaju sa postojećom rezervacijom, ako
    je gostiju više nego što apartman prima, i ako gost pokuša da
    rezerviše sopstveni apartman.

    Mejlovi gostu i domaćinu se upisuju u outbox u istoj transakciji kao
    i rezervacija, pa mejl ne može biti obećan za rezervaciju koja nije
    prošla. Samo slanje ide kasnije, u pozadini.
    """
    apartment = (
        await session.exec(
            select(Apartment)
            .where(Apartment.id == request_body.apartment_id)
            .where(Apartment.deleted_at.is_(None))
            .options(selectinload(Apartment.owner))
        )
    ).first()

    if not apartment:
        raise not_found("apartment_not_found", "Apartment not found")

    if apartment.status != ApartmentStatus.ACTIVE.value:
        raise bad_request("apartment_inactive", "Apartment is not available")

    if apartment.user_id == current_user.id:
        raise bad_request("own_apartment", "You cannot book your own apartment")

    if request_body.guests_count > apartment.max_guests:
        raise bad_request(
            "too_many_guests",
            f"This apartment allows at most {apartment.max_guests} guests",
            {"max_guests": apartment.max_guests},
        )

    overlapping = await find_overlapping(
        session,
        apartment.id,
        request_body.check_in,
        request_body.check_out,
    )

    if overlapping:
        raise conflict("dates_taken", "Selected dates are already taken")

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


@router.get(
    "",
    response_model=BasePagedResponse[ReservationDto],
    summary="Moje rezervacije (kao gost)",
    responses=error_responses(400, 401),
)
async def get_my_reservations(
    session: SessionDep,
    q: Annotated[ReservationFilter, Depends()],
    current_user: User = Depends(get_current_user),
):
    """Rezervacije koje je prijavljeni korisnik napravio kao gost.

    Filter po periodu hvata boravke koji ga dodiruju, ne samo one koji
    celi staju unutra, pa se vidi i boravak započet ranije.
    """
    query = apply_reservation_filters(
        select(Reservation).where(Reservation.user_id == current_user.id), q
    )

    return await paginate_reservations(session, query, q)


@router.get(
    "/host",
    response_model=BasePagedResponse[ReservationDto],
    summary="Rezervacije na mojim apartmanima (kao domaćin)",
    responses=error_responses(400, 401),
)
async def get_reservations_for_my_apartments(
    session: SessionDep,
    q: Annotated[ReservationFilter, Depends()],
    current_user: User = Depends(get_current_user),
):
    """Rezervacije na apartmanima prijavljenog domaćina.

    Isti filteri kao na gostinskoj listi, uz `apartment_id` kad domaćin
    hoće da vidi samo jedan apartman.
    """
    owned = select(Apartment.id).where(Apartment.user_id == current_user.id)

    query = apply_reservation_filters(
        select(Reservation).where(Reservation.apartment_id.in_(owned)), q
    )

    return await paginate_reservations(session, query, q)


@router.get(
    "/{reservation_id}",
    response_model=ReservationDto,
    summary="Jedna rezervacija",
    responses=error_responses(401, 403, 404),
)
async def get_reservation_by_id(
    reservation_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    """Jedna rezervacija. Vide je samo gost koji ju je napravio i domaćin
    apartmana na kom stoji.
    """
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
        raise not_found("reservation_not_found", "Reservation not found")

    await ensure_can_see(session, reservation, current_user)

    return map_reservation_to_dto(reservation)


@router.patch(
    "/{reservation_id}",
    response_model=ReservationDto,
    summary="Potvrda ili otkazivanje rezervacije",
    responses=error_responses(400, 401, 403, 404),
)
async def update_reservation_status(
    reservation_id: int,
    session: SessionDep,
    request_body: ReservationStatusRequest,
    current_user: User = Depends(get_current_user),
):
    """Potvrda ili otkazivanje.

    Potvrditi može samo domaćin. Otkazati mogu obojica, ali otkazana
    rezervacija se posle ne vraća ni u jedno drugo stanje.

    Odgovor domaćina gostu ide mejlom; gost koji otkaže sam sebi ne
    šalje ništa, jer to već zna.
    """
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

    is_guest = reservation.user_id == current_user.id
    is_host = await owns_apartment(session, reservation.apartment_id, current_user.id)

    if not is_guest and not is_host:
        raise forbidden("not_allowed", "Not allowed")

    await apply_status_change(session, reservation, request_body.status, is_host)

    return map_reservation_to_dto(reservation)


# --- the links that go out in the mails ---------------------------------


@router.get(
    "/link/{token}",
    response_model=ReservationLinkDto,
    summary="Rezervacija otvorena linkom iz mejla",
    responses=error_responses(401, 403, 404, 410),
)
async def get_reservation_by_link(
    token: str,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
):
    """Rezervacija otvorena linkom iz mejla.

    Token kaže samo o kojoj je rezervaciji reč. Ko sme da je vidi odlučuje
    prijava, pa ukraden link sam po sebi ne vredi ništa: onaj ko ga otvori
    mora biti prijavljen kao taj gost ili kao domaćin tog apartmana.
    """
    payload = decode_link_token(token)

    reservation = await load_reservation_with_relations(
        session, payload["reservation_id"]
    )
    is_host = await resolve_link_access(session, reservation, current_user)

    return ReservationLinkDto(
        reservation=map_reservation_to_dto(reservation),
        can_manage=is_host,
    )


@router.patch(
    "/link/{token}",
    response_model=ReservationLinkDto,
    summary="Odgovor domaćina sa linka iz mejla",
    responses=error_responses(400, 401, 403, 404, 410),
)
async def update_reservation_by_link(
    token: str,
    session: SessionDep,
    request_body: ReservationStatusRequest,
    current_user: User = Depends(get_current_user),
):
    """Domaćin odgovara na rezervaciju pravo iz mejla.

    Ista provera kao pri čitanju linka, uz jedno više: gost otvara link da
    prati rezervaciju, ne da na nju odgovori.
    """
    payload = decode_link_token(token)

    reservation = await load_reservation_with_relations(
        session, payload["reservation_id"]
    )
    is_host = await resolve_link_access(session, reservation, current_user)

    # The guest opens the link to follow the booking, not to answer it.
    if not is_host:
        raise forbidden("only_host_answers", "Only the host can answer this reservation")

    await apply_status_change(session, reservation, request_body.status, is_host=True)

    return ReservationLinkDto(
        reservation=map_reservation_to_dto(reservation),
        can_manage=True,
    )
