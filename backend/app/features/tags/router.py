from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import func

from app.shared.db import db
from app.features.auth.dependencies import Policy
from app.features.auth.dependencies import get_current_user
from app.enums.role_enum import Role
from app.models.user import User
from app.models.tag import Tag
from app.shared.responses import BasePagedResponse
from app.shared.errors import not_found
from app.shared.api_docs import error_responses

from app.features.tags.schemas import (
    TagCreateRequest,
    TagDto,
    TagFilter,
    TagPatchRequest,
    TagUpdateRequest,
)
from app.features.tags.service import (
    _ensure_unique_on_create,
    _ensure_unique_on_update,
    map_tag_to_dto,
)

router = APIRouter(prefix="/tags", tags=["tags"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


# Endpoints
@router.get(
    "",
    response_model=BasePagedResponse[TagDto],
    summary="Lista oznaka",
    responses=error_responses(400),
)
async def list_tags(
    session: SessionDep,
    q: Annotated[TagFilter, Depends()],
):
    """Paginirana lista oznaka, uz pretragu po nazivu. Javno.
    """
    query = select(Tag)

    if q.name:
        query = query.where(Tag.name.ilike(f"%{q.name}%"))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.exec(count_query)).one()

    offset = (q.page_number - 1) * q.page_size
    query = query.order_by(Tag.name).offset(offset).limit(q.page_size)

    tags = (await session.exec(query)).all()

    return {
        "page_number": q.page_number,
        "page_size": q.page_size,
        "total": total,
        "items": [map_tag_to_dto(t) for t in tags],
    }


@router.get(
    "/{tag_id}",
    response_model=TagDto,
    summary="Jedna oznaka",
    responses=error_responses(404),
)
async def get_tag_by_id(tag_id: int, session: SessionDep):
    """Jedna oznaka sa ikonicom. Javno.
    """
    tag = (await session.exec(select(Tag).where(Tag.id == tag_id))).first()
    if not tag:
        raise not_found("tag_not_found", "Tag not found")
    return map_tag_to_dto(tag)


@router.post(
    "",
    status_code=201,
    response_model=TagDto,
    summary="Nova oznaka (ADMIN)",
    responses=error_responses(401, 403, 409),
)
async def create_tag(
    response: Response,
    session: SessionDep,
    request_body: TagCreateRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
    """Pravi novu oznaku.

    I naziv i `icon_key` moraju biti jedinstveni, pa se dve oznake nikad
    ne mogu naći sa istom ikonicom.
    """
    await _ensure_unique_on_create(session, request_body.name, request_body.icon_key)

    tag = Tag(
        name=request_body.name,
        icon_key=request_body.icon_key,
        svg_icon=request_body.svg_icon,
    )

    session.add(tag)
    await session.commit()
    await session.refresh(tag)

    response.headers["Location"] = f"/tags/{tag.id}"

    return map_tag_to_dto(tag)


@router.put(
    "/{tag_id}",
    response_model=TagDto,
    summary="Zamena oznake u celini (ADMIN)",
    responses=error_responses(401, 403, 404, 409),
)
async def update_tag(
    tag_id: int,
    session: SessionDep,
    request_body: TagUpdateRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
    """Menja oznaku u celini: sva polja se šalju, i sva se upisuju.
    """
    tag = (await session.exec(select(Tag).where(Tag.id == tag_id))).first()
    if not tag:
        raise not_found("tag_not_found", "Tag not found")

    await _ensure_unique_on_update(
        session, tag_id, request_body.name, request_body.icon_key
    )

    tag.name = request_body.name
    tag.icon_key = request_body.icon_key
    tag.svg_icon = request_body.svg_icon

    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return map_tag_to_dto(tag)


@router.patch(
    "/{tag_id}",
    response_model=TagDto,
    summary="Izmena pojedinih polja oznake (ADMIN)",
    responses=error_responses(401, 403, 404, 409),
)
async def patch_tag(
    tag_id: int,
    session: SessionDep,
    request_body: TagPatchRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
    """Menja samo poslata polja oznake, ostala ostaju kakva jesu.
    """
    tag = (await session.exec(select(Tag).where(Tag.id == tag_id))).first()
    if not tag:
        raise not_found("tag_not_found", "Tag not found")

    # ensure uniqueness only for fields provided
    await _ensure_unique_on_update(
        session, tag_id, request_body.name, request_body.icon_key
    )

    if request_body.name is not None:
        tag.name = request_body.name

    if request_body.icon_key is not None:
        tag.icon_key = request_body.icon_key

    tag.svg_icon = request_body.svg_icon

    session.add(tag)
    await session.commit()
    await session.refresh(tag)
    return map_tag_to_dto(tag)


@router.delete(
    "/{tag_id}",
    status_code=204,
    summary="Brisanje oznake (ADMIN)",
    responses=error_responses(401, 403, 404),
)
async def delete_tag(
    tag_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
    """Briše oznaku i skida je sa svih apartmana koji su je nosili.
    """
    tag = (await session.exec(select(Tag).where(Tag.id == tag_id))).first()
    if not tag:
        raise not_found("tag_not_found", "Tag not found")

    await session.delete(tag)
    await session.commit()
    return None
