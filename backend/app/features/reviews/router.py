from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from app.shared.db import db
from app.shared.errors import not_found
from app.shared.responses import BasePagedResponse
from app.shared.api_docs import error_responses
from app.models.review import Review
from app.models.user import User
from app.enums.role_enum import Role
from app.features.auth.dependencies import Policy, get_current_user

from app.features.reviews.schemas import (
    ReviewCreateRequest,
    ReviewDto,
    ReviewFilter,
)
from app.features.reviews.service import (
    load_apartment_for_reviews,
    load_reviewable_reservation,
    map_review_to_dto,
    recalculate_apartment_rating,
    upsert_review,
)


router = APIRouter(tags=["reviews"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


@router.post(
    "/reviews",
    response_model=ReviewDto,
    status_code=201,
    summary="Ocenjivanje boravka",
    responses=error_responses(400, 401, 403, 404),
)
async def create_or_update_review(
    session: SessionDep,
    request_body: ReviewCreateRequest,
    current_user: User = Depends(get_current_user),
):
    """Upisuje ocenu boravka, od 1 do 10, uz opcioni komentar.

    Ocenjuje gost sa te rezervacije, i to tek pošto se boravak završio.
    Ponovno slanje menja postojeću ocenu umesto da pravi novu, jer po
    boravku ide tačno jedna.

    Posle upisa se prosečna ocena apartmana i broj ocena preračunavaju u
    istoj transakciji, pa lista apartmana i pretraga po oceni odmah vide
    novo stanje.
    """
    reservation = await load_reviewable_reservation(
        session, request_body.reservation_id, current_user
    )

    review = await upsert_review(
        session, reservation, request_body.rating, request_body.comment
    )

    await session.flush()
    await recalculate_apartment_rating(session, reservation.apartment_id)
    await session.commit()
    await session.refresh(review)

    return map_review_to_dto(review, current_user.name)


@router.get(
    "/apartments/{apartment_id}/reviews",
    response_model=BasePagedResponse[ReviewDto],
    summary="Ocene jednog apartmana",
    responses=error_responses(404),
)
async def get_apartment_reviews(
    apartment_id: int,
    session: SessionDep,
    q: Annotated[ReviewFilter, Depends()],
):
    """Javna lista ocena apartmana, najnovije prvo."""
    await load_apartment_for_reviews(session, apartment_id)

    base = select(Review).where(Review.apartment_id == apartment_id)

    total = (
        await session.exec(select(func.count()).select_from(base.subquery()))
    ).one()

    offset = (q.page_number - 1) * q.page_size

    query = (
        base.options(selectinload(Review.author))
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(q.page_size)
    )

    reviews = (await session.exec(query)).all()

    return {
        "page_number": q.page_number,
        "page_size": q.page_size,
        "total": total,
        "items": [
            map_review_to_dto(r, r.author.name if r.author else None) for r in reviews
        ],
    }


@router.delete(
    "/reviews/{review_id}",
    status_code=204,
    summary="Brisanje ocene",
    responses=error_responses(401, 403, 404),
)
async def delete_review(
    review_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
    """Uklanja ocenu. Sme samo administrator, kao mera protiv zloupotrebe.

    Gost svoju ocenu može da izmeni, ali ne i da je obriše, da se ne bi
    ocenjivanje koristilo kao pretnja domaćinu.
    """
    review = await session.get(Review, review_id)

    if not review:
        raise not_found("review_not_found", "Review not found")

    apartment_id = review.apartment_id

    await session.delete(review)
    await session.flush()
    await recalculate_apartment_rating(session, apartment_id)
    await session.commit()
