from __future__ import annotations

import logging
from datetime import datetime, date, UTC, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.shared.db import db
from app.shared.responses import BasePagedResponse
from app.shared.errors import bad_request, forbidden, not_found
from app.shared.api_docs import error_responses
from app.shared.integrations.geocoding import geocode_osm_nominatim
from app.models.apartment import Apartment, utcnow
from app.models.reservation import Reservation
from app.models.tag import Tag
from app.models.user import User
from app.enums.role_enum import Role
from app.enums.apartment_status_enum import ApartmentStatus
from app.enums.reservation_status_enum import BLOCKING_STATUSES
from app.features.auth.dependencies import Policy, get_current_user

from app.features.apartments.schemas import (
    ApartmentByIdDto,
    ApartmentCreateRequest,
    ApartmentDto,
    ApartmentFilter,
    ApartmentUpdateRequest,
    RentedDayDto,
)
from app.features.apartments.service import (
    apply_apartment_filters,
    map_apartment_to_detail_dto,
    map_apartment_to_list_dto,
    map_apartment_to_list_dto_without_photos,
)

logger = logging.getLogger("app.apartments")

router = APIRouter(prefix="/apartments", tags=["apartments"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


@router.get(
    "",
    response_model=BasePagedResponse[ApartmentDto],
    summary="Pretraga apartmana",
    responses=error_responses(400),
)
async def get_apartments(
    session: SessionDep,
    q: Annotated[ApartmentFilter, Depends()],
):
    """Javna, paginirana lista aktivnih apartmana.

    Filteri se slažu jedan na drugi. Ako se pošalju oba datuma, u rezultatu
    ostaju samo apartmani slobodni za ceo taj raspon. Obrisani apartmani se ne
    prikazuju nigde.
    """
    # Only the public list hides inactive apartments. The host keeps seeing
    # them under /my, otherwise a paused listing could never be switched back on.
    query = apply_apartment_filters(
        select(Apartment).where(Apartment.status == ApartmentStatus.ACTIVE.value), q
    )


    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.exec(count_query)).one()

    offset = (q.page_number - 1) * q.page_size
    query = (
        query.options(selectinload(Apartment.photos)).offset(offset).limit(q.page_size)
    )

    items = (await session.exec(query)).all()
    dto_items = [map_apartment_to_list_dto(a) for a in items]

    return {
        "page_number": q.page_number,
        "page_size": q.page_size,
        "total": total,
        "items": dto_items,
    }


@router.get(
    "/my",
    response_model=BasePagedResponse[ApartmentDto],
    summary="Apartmani prijavljenog domaćina",
    responses=error_responses(401, 403),
)
async def get_my_apartments(
    session: SessionDep,
    q: Annotated[ApartmentFilter, Depends()],
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    """Apartmani prijavljenog domaćina, sa istim filterima kao javna lista.

    Za razliku od javne liste, ovde se vide i neaktivni apartmani —
    inače pauzirani oglas ne bi imao odakle da se vrati u promet.
    """
    query = apply_apartment_filters(
        select(Apartment).where(Apartment.user_id == current_user.id), q
    )


    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.exec(count_query)).one()

    offset = (q.page_number - 1) * q.page_size
    query = (
        query.options(selectinload(Apartment.photos)).offset(offset).limit(q.page_size)
    )

    items = (await session.exec(query)).all()
    dto_items = [map_apartment_to_list_dto(a) for a in items]

    return {
        "page_number": q.page_number,
        "page_size": q.page_size,
        "total": total,
        "items": dto_items,
    }


@router.post(
    "",
    status_code=201,
    response_model=ApartmentDto,
    summary="Kreiranje apartmana",
    responses=error_responses(400, 401, 403),
)
async def create_apartment(
    session: SessionDep,
    request_body: ApartmentCreateRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    """Pravi apartman i odmah ga postavlja kao aktivan.

    Adresa se pri upisu geokodira preko OpenStreetMap Nominatim servisa.
    Ako geokodiranje ne uspe, apartman se svejedno pravi, samo bez
    koordinata: nedostupan spoljni servis ne sme da obori kreiranje.

    Novi apartman nema slike, pa je lista `photos` prazna. Slike se
    dodaju posebno, preko `POST /apartments/{id}/photos`.
    """
    coords = None
    try:
        coords = await geocode_osm_nominatim(
            address=request_body.address,
            city=request_body.city,
            country=request_body.country,
        )
    except Exception as error:
        logger.warning("Geocoding failed on create: %s", error)

    apartment = Apartment(
        user_id=current_user.id,
        title=request_body.title,
        description=request_body.description,
        address=request_body.address,
        city=request_body.city,
        country=request_body.country,
        price_per_night=request_body.price_per_night,
        max_guests=request_body.max_guests,
        status=ApartmentStatus.ACTIVE.value,
        latitude=coords[0] if coords else None,
        longitude=coords[1] if coords else None,
    )

    if request_body.tag_ids:
        tags = (
            await session.exec(select(Tag).where(Tag.id.in_(request_body.tag_ids)))
        ).all()

        if len(tags) != len(set(request_body.tag_ids)):
            raise bad_request("tag_ids_invalid", "One or more tag_ids are invalid")

        apartment.tags = list(tags)

    session.add(apartment)
    await session.commit()
    await session.refresh(apartment)

    # A brand new apartment has no photos, so the list is empty by fact rather
    # than by omission. Saying so keeps it off a lazy load the async session
    # cannot serve anyway.
    return map_apartment_to_list_dto_without_photos(apartment)


@router.patch(
    "/{apartment_id}",
    response_model=ApartmentByIdDto,
    summary="Izmena apartmana",
    responses=error_responses(400, 401, 403, 404),
)
async def update_apartment(
    apartment_id: int,
    session: SessionDep,
    request_body: ApartmentUpdateRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    """Menja apartman. Šalje se samo ono što se menja.

    Promena adrese, grada ili države pokreće ponovno geokodiranje.
    Ako se pošalje `tag_ids`, oznake se zamenjuju u celini, a ne dodaju.
    """
    result = await session.exec(
        select(Apartment)
        .where(Apartment.id == apartment_id)
        .where(Apartment.deleted_at.is_(None))
        .options(
            selectinload(Apartment.photos),
            selectinload(Apartment.tags),
        )
    )
    apartment = result.first()

    if not apartment:
        raise not_found("apartment_not_found", "Apartment not found")

    if apartment.user_id != current_user.id:
        raise forbidden("not_allowed", "Not allowed")

    changes = request_body.model_dump(exclude_unset=True, exclude_none=True)
    tag_ids = changes.pop("tag_ids", None)

    for field, value in changes.items():
        setattr(apartment, field, value)

    # The pin on the map has to follow the address, so a moved apartment is
    # geocoded again. A failed lookup keeps the old coordinates rather than
    # blanking them, which is better than losing the pin over a flaky request.
    if {"address", "city", "country"} & changes.keys():
        try:
            coords = await geocode_osm_nominatim(
                address=apartment.address,
                city=apartment.city,
                country=apartment.country,
            )

            if coords:
                apartment.latitude, apartment.longitude = coords
        except Exception as error:
            logger.warning("Geocoding failed on update: %s", error)

    if tag_ids is not None:
        tags = (await session.exec(select(Tag).where(Tag.id.in_(tag_ids)))).all()

        if len(tags) != len(set(tag_ids)):
            raise bad_request("tag_ids_invalid", "One or more tag_ids are invalid")

        apartment.tags = list(tags)

    apartment.updated_at = utcnow()

    session.add(apartment)
    await session.commit()

    return map_apartment_to_detail_dto(apartment)


@router.get(
    "/{apartment_id}",
    response_model=ApartmentByIdDto,
    summary="Jedan apartman sa oznakama i slikama",
    responses=error_responses(404),
)
async def get_apartment_by_id(
    apartment_id: int,
    session: SessionDep,
):
    """Jedan apartman sa svojim oznakama i slikama.

    Obrisan apartman se ne vraća: za njega više ne postoji stranica.
    """
    result = await session.exec(
        select(Apartment)
        .where(Apartment.id == apartment_id)
        .where(Apartment.deleted_at.is_(None))
        .options(
            selectinload(Apartment.photos),
            selectinload(Apartment.tags),
        )
    )
    apartment = result.first()

    if not apartment:
        raise not_found("apartment_not_found", "Apartment not found")

    return map_apartment_to_detail_dto(apartment)


@router.get(
    "/{apartment_id}/rented-days",
    response_model=list[RentedDayDto],
    summary="Kalendar zauzetih dana za jedan mesec",
    responses=error_responses(400, 404),
)
async def get_rented_days(
    apartment_id: int,
    session: SessionDep,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
):
    """Dan po dan za traženi mesec, sa oznakom da li je zauzet.

    Zauzimaju i rezervacije na čekanju, ne samo potvrđene, da dva gosta
    ne bi tražila iste datume dok domaćin razmišlja. Prošli meseci se ne
    mogu tražiti, jer kalendar služi za rezervisanje unapred.
    """
    apartment_result = await session.exec(
        select(Apartment)
        .where(Apartment.id == apartment_id)
        .where(Apartment.deleted_at.is_(None))
    )
    apartment = apartment_result.first()
    if not apartment:
        raise not_found("apartment_not_found", "Invalid apartment")

    month_start = date(year, month, 1)

    now = datetime.now(UTC)
    current_month_start = date(now.year, now.month, 1)
    if month_start < current_month_start:
        raise bad_request("past_month", "You can't query previous dates")

    month_end_exclusive = (month_start.replace(day=28) + timedelta(days=4)).replace(
        day=1
    )

    query = (
        select(Reservation)
        .where(
            Reservation.apartment_id == apartment_id,
            Reservation.status.in_(BLOCKING_STATUSES),
        )
        .where(Reservation.check_in < month_end_exclusive)
        .where(Reservation.check_out > month_start)
    )
    res = await session.exec(query)
    reservations = res.all()

    rented_days: set[date] = set()

    for reservation in reservations:
        start = max(reservation.check_in, month_start)
        end = min(reservation.check_out, month_end_exclusive)

        d = start
        while d < end:
            rented_days.add(d)
            d += timedelta(days=1)

    result = []
    d = month_start
    while d < month_end_exclusive:
        result.append({"date": d.isoformat(), "rented": d in rented_days})
        d += timedelta(days=1)

    return result


@router.delete(
    "/{apartment_id}",
    status_code=204,
    summary="Meko brisanje apartmana",
    responses=error_responses(401, 403, 404),
)
async def delete_apartment(
    apartment_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    """Soft delete.

    The row and its photos stay in the database because reservations point at
    them: a guest still has to see where they stayed and the host still has to
    see what was booked. Setting deleted_at takes the apartment out of every
    list and makes it impossible to book again, which is all a delete has to do
    here.
    """
    result = await session.exec(
        select(Apartment)
        .where(Apartment.id == apartment_id)
        .where(Apartment.deleted_at.is_(None))
    )
    apartment = result.first()

    if not apartment:
        raise not_found("apartment_not_found", "Apartment not found")

    if apartment.user_id != current_user.id:
        raise forbidden("not_allowed", "Not allowed")

    apartment.deleted_at = utcnow()
    apartment.status = ApartmentStatus.INACTIVE.value
    apartment.updated_at = utcnow()

    session.add(apartment)
    await session.commit()

    return Response(status_code=204)
