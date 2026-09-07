from __future__ import annotations

from decimal import Decimal
from typing import Optional, Tuple

import httpx


NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search"


async def geocode_osm_nominatim(
    address: str,
    city: str,
    country: str,
) -> Optional[Tuple[Decimal, Decimal]]:
    """
    Returns (lat, lon) as Decimals, or None if not found.

    Notes:
    - Nominatim requires a valid User-Agent identifying your app.
    - You should add caching + rate limiting in production.
    """
    query = ", ".join(
        [part for part in [address, city, country] if part and part.strip()]
    )

    params = {
        "q": query,
        "format": "jsonv2",
        "limit": 1,
        "addressdetails": 0,
    }

    headers = {
        "User-Agent": "booking-clone/1.0 (contact: sp2019@student.fon.bg.ac.rs)",
        "Accept": "application/json",
    }

    timeout = httpx.Timeout(10.0, connect=5.0)

    async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
        r = await client.get(NOMINATIM_SEARCH_URL, params=params)
        r.raise_for_status()

        data = r.json()
        if not data:
            return None

        lat_str = data[0].get("lat")
        lon_str = data[0].get("lon")
        if not lat_str or not lon_str:
            return None

        # DB columns are Numeric(10,6) to round on 6 decimals
        lat = Decimal(lat_str).quantize(Decimal("0.000001"))
        lon = Decimal(lon_str).quantize(Decimal("0.000001"))
        return lat, lon
