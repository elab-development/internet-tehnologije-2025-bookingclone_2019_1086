from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.tag import Tag


BOOKING_TAGS = [
    {
        "name": "Wi-Fi",
        "icon_key": "wifi",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 12.55a11 11 0 0 1 14 0"/>
  <path d="M8.5 16a6 6 0 0 1 7 0"/>
  <path d="M12 20h.01"/>
</svg>
""",
    },
    {
        "name": "Free parking",
        "icon_key": "parking",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2">
  <rect x="4" y="3" width="16" height="18" rx="2"/>
  <path d="M9 8h4a3 3 0 0 1 0 6H9z"/>
</svg>
""",
    },
    {
        "name": "Air conditioning",
        "icon_key": "air_conditioning",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2">
  <path d="M4 8h16"/>
  <path d="M4 12h16"/>
  <path d="M4 16h16"/>
</svg>
""",
    },
    {
        "name": "Heating",
        "icon_key": "heating",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2">
  <path d="M12 2v20"/>
  <path d="M8 6c0 4 4 4 4 8"/>
</svg>
""",
    },
    {
        "name": "TV",
        "icon_key": "tv",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2">
  <rect x="3" y="7" width="18" height="12" rx="2"/>
  <path d="M8 3l4 4 4-4"/>
</svg>
""",
    },
    {
        "name": "Swimming pool",
        "icon_key": "pool",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2">
  <path d="M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>
  <path d="M12 4v8"/>
</svg>
""",
    },
]


async def seed_database(session: AsyncSession) -> None:
    result = await session.exec(select(Tag.icon_key))
    existing_keys = set(result.all())

    to_create: list[Tag] = []

    for tag in BOOKING_TAGS:
        if tag["icon_key"] in existing_keys:
            continue

        to_create.append(
            Tag(
                name=tag["name"],
                icon_key=tag["icon_key"],
                svg_icon=tag["SVG_ICON"],
            )
        )

    if not to_create:
        return

    session.add_all(to_create)
    await session.commit()
