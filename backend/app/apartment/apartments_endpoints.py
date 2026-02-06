from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.db import db
from app.models.apartment import Apartment
from app.models.tag import Tag
from app.models.user import User
from app.auth.authorization import Policy
from app.auth.current_user import get_current_user
from app.enums.role_enum import Role
from app.base_pagination_request import BasePaginationRequest
from app.base_response import BasePagedResponse
from app.services.geocoding import geocode_osm_nominatim

from datetime import datetime, date, UTC, timedelta
from app.models.reservation import Reservation


router = APIRouter(prefix="/apartments", tags=["apartments"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


# Filters
class ApartmentFilter(BasePaginationRequest):
    name: Optional[str] = Field(default=None, max_length=255)
    address: Optional[str] = Field(default=None, max_length=255)
    city: Optional[str] = Field(default=None, max_length=100)
    country: Optional[str] = Field(default=None, max_length=100)

    price_per_night_min: Optional[Decimal] = None
    price_per_night_max: Optional[Decimal] = None

    max_guests: Optional[int] = Field(default=None, ge=1)
    rating_average_min: Optional[int] = Field(default=None, ge=0, le=5)
    rating_average_max: Optional[int] = Field(default=None, ge=0, le=5)


# DTOs
class ApartmentPhotoDto(BaseModel):
    id: int
    image_url: str
    is_main: bool


class ApartmentDto(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    address: str
    city: str
    country: str
    price_per_night: Decimal
    max_guests: int
    status: str
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    rating_average: Optional[Decimal]
    reviews_count: int
    photos: List[ApartmentPhotoDto]


class TagDto(BaseModel):
    id: int
    name: str
    svg_icon: Optional[str]


class ApartmentByIdDto(BaseModel):
    id: int
    user_id: int
    title: str
    description: str
    address: str
    city: str
    country: str
    price_per_night: Decimal
    max_guests: int
    status: str
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    rating_average: Optional[Decimal]
    reviews_count: int
    photos: List[ApartmentPhotoDto]
    tags: List[TagDto]


# Mappers
def map_apartment_to_list_dto(apartment: Apartment) -> ApartmentDto:
    return ApartmentDto(
        id=apartment.id,
        user_id=apartment.user_id,
        title=apartment.title,
        description=apartment.description,
        address=apartment.address,
        city=apartment.city,
        country=apartment.country,
        price_per_night=apartment.price_per_night,
        max_guests=apartment.max_guests,
        status=apartment.status,
        latitude=apartment.latitude,
        longitude=apartment.longitude,
        rating_average=apartment.rating_average,
        reviews_count=apartment.reviews_count,
        photos=[
            ApartmentPhotoDto(
                id=photo.id,
                image_url=photo.image_url,
                is_main=photo.is_main,
            )
            for photo in apartment.photos
        ],
    )


def map_apartment_to_detail_dto(apartment: Apartment) -> ApartmentByIdDto:
    return ApartmentByIdDto(
        id=apartment.id,
        user_id=apartment.user_id,
        title=apartment.title,
        description=apartment.description,
        address=apartment.address,
        city=apartment.city,
        country=apartment.country,
        price_per_night=apartment.price_per_night,
        max_guests=apartment.max_guests,
        status=apartment.status,
        latitude=apartment.latitude,
        longitude=apartment.longitude,
        rating_average=apartment.rating_average,
        reviews_count=apartment.reviews_count,
        photos=[
            ApartmentPhotoDto(
                id=photo.id,
                image_url=photo.image_url,
                is_main=photo.is_main,
            )
            for photo in apartment.photos
        ],
        tags=[
            TagDto(
                id=tag.id,
                name=tag.name,
                svg_icon=tag.svg_icon,
            )
            for tag in apartment.tags
        ],
    )


@router.get("", response_model=BasePagedResponse[ApartmentDto])
async def get_apartments(
    session: SessionDep,
    q: Annotated[ApartmentFilter, Depends()],
):
    query = select(Apartment)

    # filters
    if q.name:
        query = query.where(Apartment.name.ilike(f"%{q.name}%"))

    if q.address:
        query = query.where(Apartment.address.ilike(f"%{q.address}%"))

    if q.city:
        query = query.where(Apartment.city.ilike(f"%{q.city}%"))

    if q.country:
        query = query.where(Apartment.country.ilike(f"%{q.country}%"))

    if q.price_per_night_min is not None:
        query = query.where(Apartment.price_per_night >= q.price_per_night_min)

    if q.price_per_night_max is not None:
        query = query.where(Apartment.price_per_night <= q.price_per_night_max)

    if q.max_guests is not None:
        query = query.where(Apartment.max_guests >= q.max_guests)

    if q.rating_average_min is not None:
        query = query.where(Apartment.rating_average >= q.rating_average_min)

    if q.rating_average_max is not None:
        query = query.where(Apartment.rating_average <= q.rating_average_max)

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


class ApartmentCreateRequest(BaseModel):
    title: str = Field(max_length=255)
    description: str = Field(max_length=5000)
    address: str = Field(max_length=255)
    city: str = Field(max_length=100)
    country: str = Field(max_length=100)

    price_per_night: Decimal = Field(gt=0)
    max_guests: int = Field(ge=1)

    tag_ids: list[int] = Field(default_factory=list)


@router.post("", status_code=201)
async def create_apartment(
    session: SessionDep,
    request_body: ApartmentCreateRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    coords = None
    try:
        coords = await geocode_osm_nominatim(
            address=request_body.address,
            city=request_body.city,
            country=request_body.country,
        )
    except Exception as e:
        print(f"Unexpected error: {e}")

    apartment = Apartment(
        user_id=current_user.id,
        title=request_body.title,
        description=request_body.description,
        address=request_body.address,
        city=request_body.city,
        country=request_body.country,
        price_per_night=request_body.price_per_night,
        max_guests=request_body.max_guests,
        status="active",
        latitude=coords[0] if coords else None,
        longitude=coords[1] if coords else None,
    )

    if request_body.tag_ids:
        tags = (
            await session.exec(select(Tag).where(Tag.id.in_(request_body.tag_ids)))
        ).all()

        if len(tags) != len(set(request_body.tag_ids)):
            raise HTTPException(
                status_code=400, detail="One or more tag_ids are invalid"
            )

        apartment.tags = list(tags)

    session.add(apartment)
    await session.commit()
    await session.refresh(apartment)

    return apartment


@router.get("/{apartment_id}", response_model=ApartmentByIdDto)
async def get_apartment_by_id(
    apartment_id: int,
    session: SessionDep,
):
    result = await session.exec(
        select(Apartment)
        .where(Apartment.id == apartment_id)
        .options(
            selectinload(Apartment.photos),
            selectinload(Apartment.tags),
        )
    )
    apartment = result.first()

    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    return map_apartment_to_detail_dto(apartment)


@router.get("/{apartment_id}/rented-days")
async def get_rented_days(
    apartment_id: int,
    session: SessionDep,
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
):
    apartment_result = await session.exec(
        select(Apartment).where(Apartment.id == apartment_id)
    )
    apartment = apartment_result.first()
    if not apartment:
        raise HTTPException(404, "Invalid apartment")

    month_start = date(year, month, 1)

    now = datetime.now(UTC)
    current_month_start = date(now.year, now.month, 1)
    if month_start < current_month_start:
        raise HTTPException(400, "You can't query previous dates")

    month_end_exclusive = (month_start.replace(day=28) + timedelta(days=4)).replace(
        day=1
    )

    query = (
        select(Reservation)
        .where(
            Reservation.apartment_id == apartment_id, Reservation.status == "confirmed"
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
