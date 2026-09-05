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
    {
        "name": "Kitchen",
        "icon_key": "kitchen",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 11h16"/>
  <path d="M6 11v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6"/>
  <path d="M9 7V5"/>
  <path d="M12 7V4"/>
  <path d="M15 7V5"/>
</svg>
""",
    },
    {
        "name": "Washing machine",
        "icon_key": "washing_machine",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="3" width="16" height="18" rx="2"/>
  <circle cx="12" cy="13" r="4"/>
  <path d="M8 6h.01"/>
  <path d="M11 6h.01"/>
</svg>
""",
    },
    {
        "name": "Pets allowed",
        "icon_key": "pets",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="9" cy="7" r="1.8"/>
  <circle cx="15" cy="7" r="1.8"/>
  <circle cx="5" cy="12" r="1.6"/>
  <circle cx="19" cy="12" r="1.6"/>
  <path d="M12 12c-2.4 0-4.3 2-4.3 4.1 0 1.6 1.1 2.6 2.6 2.6.9 0 1.3-.4 1.7-.4s.8.4 1.7.4c1.5 0 2.6-1 2.6-2.6C16.3 14 14.4 12 12 12z"/>
</svg>
""",
    },
    {
        "name": "Balcony",
        "icon_key": "balcony",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 10l9-6 9 6"/>
  <path d="M4 10v10"/>
  <path d="M20 10v10"/>
  <path d="M4 20h16"/>
  <path d="M4 14h16"/>
  <path d="M8 14v6"/>
  <path d="M12 14v6"/>
  <path d="M16 14v6"/>
</svg>
""",
    },
    {
        "name": "Elevator",
        "icon_key": "elevator",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="3" width="16" height="18" rx="2"/>
  <path d="M10.5 10L12 8l1.5 2"/>
  <path d="M10.5 14L12 16l1.5-2"/>
</svg>
""",
    },
    {
        "name": "Non-smoking",
        "icon_key": "non_smoking",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <path d="M5.6 5.6l12.8 12.8"/>
  <path d="M7 12h7"/>
</svg>
""",
    },
    {
        "name": "Breakfast included",
        "icon_key": "breakfast",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 8h13v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z"/>
  <path d="M17 9h2a2 2 0 0 1 0 4h-2"/>
  <path d="M7 3v2"/>
  <path d="M11 3v2"/>
</svg>
""",
    },
    {
        "name": "Gym",
        "icon_key": "gym",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 8v8"/>
  <path d="M3 10v4"/>
  <path d="M18 8v8"/>
  <path d="M21 10v4"/>
  <path d="M6 12h12"/>
</svg>
""",
    },
    {
        "name": "Sea view",
        "icon_key": "sea_view",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="17" cy="6" r="3"/>
  <path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>
  <path d="M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/>
</svg>
""",
    },
    {
        "name": "Workspace",
        "icon_key": "workspace",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="5" width="16" height="10" rx="1"/>
  <path d="M2 19h20"/>
</svg>
""",
    },
    {
        "name": "Bathtub",
        "icon_key": "bathtub",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3z"/>
  <path d="M6 12V6a2 2 0 0 1 4 0"/>
  <path d="M7 19v2"/>
  <path d="M17 19v2"/>
</svg>
""",
    },
    {
        "name": "Baby crib",
        "icon_key": "baby_crib",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 8v11"/>
  <path d="M21 8v11"/>
  <path d="M3 19h18"/>
  <path d="M3 11h18"/>
  <path d="M8 11v8"/>
  <path d="M12 11v8"/>
  <path d="M16 11v8"/>
</svg>
""",
    },
    {
        "name": "Garden",
        "icon_key": "garden",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="9" r="6"/>
  <path d="M12 15v6"/>
  <path d="M9 21h6"/>
</svg>
""",
    },
    {
        "name": "Barbecue",
        "icon_key": "barbecue",
        "SVG_ICON": """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 6h14a7 7 0 0 1-7 7 7 7 0 0 1-7-7z"/>
  <path d="M9 13l-2 8"/>
  <path d="M15 13l2 8"/>
  <path d="M8 18h8"/>
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
