from sqlmodel import select

from app.models.apartment import Apartment
from app.models.reservation import Reservation
from app.enums.reservation_status_enum import BLOCKING_STATUSES
from app.shared.errors import bad_request
from app.features.apartments.schemas import (
    ApartmentByIdDto,
    ApartmentDto,
    ApartmentFilter,
    ApartmentPhotoDto,
    ApartmentTagDto,
)


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

def map_apartment_to_list_dto_without_photos(apartment: Apartment) -> ApartmentDto:
    """The list shape for an apartment whose photos were never loaded.

    Built field by field on purpose. Assigning an empty list to `photos` would
    touch the relationship, and touching a relationship that was never loaded
    sends the async session after it mid-request.
    """
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
        photos=[],
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
            ApartmentTagDto(
                id=tag.id,
                name=tag.name,
                svg_icon=tag.svg_icon,
            )
            for tag in apartment.tags
        ],
    )

def apply_apartment_filters(query, q: ApartmentFilter):
    # A soft deleted apartment is gone as far as any list is concerned.
    query = query.where(Apartment.deleted_at.is_(None))

    if q.name:
        query = query.where(Apartment.title.ilike(f"%{q.name}%"))

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

    if q.check_in and q.check_out and q.check_out <= q.check_in:
        raise bad_request("checkout_before_checkin", "check_out must be after check_in")

    if q.has_date_range:
        # An apartment is taken when a blocking reservation overlaps the wanted
        # range: each side starts before the other one ends.
        taken = (
            select(Reservation.apartment_id)
            .where(Reservation.status.in_(BLOCKING_STATUSES))
            .where(Reservation.check_in < q.check_out)
            .where(Reservation.check_out > q.check_in)
        )

        query = query.where(Apartment.id.not_in(taken))

    return query
