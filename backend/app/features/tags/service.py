from typing import Optional

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.tag import Tag
from app.shared.errors import conflict
from app.features.tags.schemas import TagDto


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
        raise conflict("tag_name_taken", "Tag name already exists")

    existing_by_key = (
        await session.exec(select(Tag).where(Tag.icon_key == icon_key))
    ).first()
    if existing_by_key:
        raise conflict("tag_icon_taken", "Tag icon_key already exists")

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
            raise conflict("tag_name_taken", "Tag name already exists")

    if icon_key is not None:
        existing_by_key = (
            await session.exec(select(Tag).where(Tag.icon_key == icon_key))
        ).first()
        if existing_by_key and existing_by_key.id != tag_id:
            raise conflict("tag_icon_taken", "Tag icon_key already exists")
