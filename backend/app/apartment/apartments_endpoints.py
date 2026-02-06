from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Optional, List

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.db import db
from app.models.apartment import Apartment

from app.base_pagination_request import BasePaginationRequest
from app.base_response import BasePagedResponse



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

