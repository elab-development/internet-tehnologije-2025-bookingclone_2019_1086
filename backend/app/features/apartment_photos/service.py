from typing import Annotated

from fastapi import Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.shared.db import db
from app.shared.errors import forbidden, not_found
from app.models.apartment import Apartment
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
