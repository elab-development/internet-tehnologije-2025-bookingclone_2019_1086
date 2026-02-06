from __future__ import annotations

from typing import Annotated, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import db
from app.auth.authorization import Policy
from app.auth.current_user import get_current_user
from app.enums.role_enum import Role
from app.models.user import User
from app.models.tag import Tag


router = APIRouter(prefix="/tags", tags=["tags"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


# DTOs / Requests
class TagDto(BaseModel):
    id: int
    name: str
    icon_key: str
    svg_icon: Optional[str]


class TagCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon_key: str = Field(min_length=1, max_length=100)
    svg_icon: Optional[str] = None


class TagUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon_key: str = Field(min_length=1, max_length=100)
    svg_icon: Optional[str] = None


class TagPatchRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    icon_key: Optional[str] = Field(default=None, min_length=1, max_length=100)
    svg_icon: Optional[str] = None


def map_tag_to_dto(tag: Tag) -> TagDto:
    return TagDto(
        id=tag.id,
        name=tag.name,
        icon_key=tag.icon_key,
        svg_icon=tag.svg_icon,
    )


# Helpers
async def _ensure_unique_on_create(
    session: AsyncSession, name: str, icon_key: str
) -> None:
    existing_by_name = (await session.exec(select(Tag).where(Tag.name == name))).first()
    if existing_by_name:
        raise HTTPException(status_code=409, detail="Tag name already exists")

    existing_by_key = (
        await session.exec(select(Tag).where(Tag.icon_key == icon_key))
    ).first()
    if existing_by_key:
        raise HTTPException(status_code=409, detail="Tag icon_key already exists")


async def _ensure_unique_on_update(
    session: AsyncSession,
    tag_id: int,
    name: Optional[str],
    icon_key: Optional[str],
) -> None:
    if name is not None:
        existing_by_name = (
            await session.exec(select(Tag).where(Tag.name == name))
        ).first()
        if existing_by_name and existing_by_name.id != tag_id:
            raise HTTPException(status_code=409, detail="Tag name already exists")

    if icon_key is not None:
        existing_by_key = (
            await session.exec(select(Tag).where(Tag.icon_key == icon_key))
        ).first()
        if existing_by_key and existing_by_key.id != tag_id:
            raise HTTPException(status_code=409, detail="Tag icon_key already exists")


# Endpoints
@router.get("", response_model=List[TagDto])
async def list_tags(session: SessionDep):
    result = await session.exec(select(Tag).order_by(Tag.name))
    tags = result.all()
    return [map_tag_to_dto(t) for t in tags]


@router.get("/{tag_id}", response_model=TagDto)
async def get_tag_by_id(tag_id: int, session: SessionDep):
    tag = (await session.exec(select(Tag).where(Tag.id == tag_id))).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return map_tag_to_dto(tag)


@router.post("", status_code=201, response_model=TagDto)
async def create_tag(
    response: Response,
    session: SessionDep,
    request_body: TagCreateRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
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


@router.put("/{tag_id}", response_model=TagDto)
async def update_tag(
    tag_id: int,
    session: SessionDep,
    request_body: TagUpdateRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
    tag = (await session.exec(select(Tag).where(Tag.id == tag_id))).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

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


@router.patch("/{tag_id}", response_model=TagDto)
async def patch_tag(
    tag_id: int,
    session: SessionDep,
    request_body: TagPatchRequest,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
    tag = (await session.exec(select(Tag).where(Tag.id == tag_id))).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

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


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tag_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
    allowed: bool = Depends(Policy({Role.ADMIN}).check_access),
):
    tag = (await session.exec(select(Tag).where(Tag.id == tag_id))).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    await session.delete(tag)
    await session.commit()
    return None
