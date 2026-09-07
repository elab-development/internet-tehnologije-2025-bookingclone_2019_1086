from typing import Annotated

from fastapi import Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.shared.db import db
from app.shared.errors import forbidden, not_found
from app.models.apartment import Apartment
from app.models.apartment_photo import ApartmentPhoto
from app.models.user import User
from app.features.auth.dependencies import get_current_user


SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


async def apartment_belongs_to_host(
    apartment_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Apartment:
    apt = (
        await session.exec(
            select(Apartment)
            .where(Apartment.id == apartment_id)
            .where(Apartment.deleted_at.is_(None))
        )
    ).first()

    if not apt:
        raise not_found("apartment_not_found", "Apartment not found")

    if apt.user_id != current_user.id:
        raise forbidden("apartment_not_yours", "This apartment is not yours")

    return apt


async def get_photos_of(
    session: AsyncSession, apartment_id: int
) -> list[ApartmentPhoto]:
    query = (
        select(ApartmentPhoto)
        .where(ApartmentPhoto.apartment_id == apartment_id)
        .order_by(ApartmentPhoto.id)
    )

    return list((await session.exec(query)).all())


async def mark_photo_as_main(
    session: AsyncSession, apartment_id: int, photo_id: int
) -> ApartmentPhoto:
    photos = await get_photos_of(session, apartment_id)

    chosen = next((photo for photo in photos if photo.id == photo_id), None)

    if not chosen:
        raise not_found("photo_not_found", "Photo not found on this apartment")

    for photo in photos:
        should_be_main = photo.id == photo_id

        if photo.is_main != should_be_main:
            photo.is_main = should_be_main
            session.add(photo)

    return chosen


async def ensure_apartment_has_main_photo(
    session: AsyncSession, apartment_id: int
) -> None:
    photos = await get_photos_of(session, apartment_id)

    if not photos or any(photo.is_main for photo in photos):
        return

    photos[0].is_main = True
    session.add(photos[0])
