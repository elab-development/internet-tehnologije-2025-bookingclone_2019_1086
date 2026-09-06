from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import HTTPException

from app.auth.auth_helper import AuthHelper
from app.errors import gone, not_found


# The link only says which reservation it points at and which side it was
# written for. It proves nothing about who is holding it, so the endpoints
# still require a logged in user whose identity matches.
TOKEN_TYPE = "reservation_link"

LINK_ROLE_GUEST = "guest"
LINK_ROLE_HOST = "host"


def link_ttl_days() -> int:
    raw = (os.getenv("RESERVATION_LINK_TTL_DAYS") or "").strip()

    try:
        return int(raw)
    except ValueError:
        return 30


def app_base_url() -> str:
    return (os.getenv("APP_BASE_URL") or "http://localhost:3000").rstrip("/")


def create_link_token(reservation_id: int, link_role: str) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "reservation_id": reservation_id,
        "link_role": link_role,
        "type": TOKEN_TYPE,
        "iat": now,
        "exp": now + timedelta(days=link_ttl_days()),
    }

    return jwt.encode(payload, AuthHelper.JWT_SECRET, algorithm=AuthHelper.JWT_ALG)


def decode_link_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, AuthHelper.JWT_SECRET, algorithms=[AuthHelper.JWT_ALG]
        )
    except jwt.ExpiredSignatureError:
        raise gone("link_expired", "This link has expired")
    except jwt.InvalidTokenError:
        raise not_found("invalid_link", "Invalid link")

    if payload.get("type") != TOKEN_TYPE:
        raise not_found("invalid_link", "Invalid link")

    if payload.get("link_role") not in (LINK_ROLE_GUEST, LINK_ROLE_HOST):
        raise not_found("invalid_link", "Invalid link")

    return payload


def build_reservation_link(reservation_id: int, link_role: str) -> str:
    token = create_link_token(reservation_id, link_role)

    return f"{app_base_url()}/reservations/link/{token}"
