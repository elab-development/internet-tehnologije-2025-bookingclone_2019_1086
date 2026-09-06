from __future__ import annotations

import json
from typing import Any, Optional

from sqlmodel.ext.asyncio.session import AsyncSession

from app.enums.outbox_status_enum import OutboxStatus
from app.models.apartment import Apartment
from app.models.outbox_event import OutboxEvent
from app.models.reservation import Reservation
from app.models.user import User
from app.reservation.reservation_link import build_reservation_link


def enqueue_event(
    session: AsyncSession,
    event_type: str,
    payload: dict[str, Any],
) -> OutboxEvent:
    """Put an event in the session without committing.

    The caller commits it together with the data that caused it, which is the
    whole point: either both the reservation and its event are saved, or neither
    is. A mail can never be promised for a reservation that was rolled back.
    """
    event = OutboxEvent(
        event_type=event_type,
        payload=json.dumps(payload, ensure_ascii=False),
        status=OutboxStatus.PENDING.value,
    )

    session.add(event)

    return event


def build_reservation_payload(
    reservation: Reservation,
    apartment: Apartment,
    guest: User,
    host: Optional[User],
    recipient_name: str,
    recipient_email: str,
    link_role: str,
) -> dict[str, Any]:
    """Everything a reservation mail needs, copied out now.

    The worker reads no tables later, so the mail always describes the booking
    as it was when it happened. Who the mail goes to is part of the snapshot,
    which is what lets the same booking produce one mail for the guest and a
    different one for the host, each with its own link.
    """
    return {
        "recipient_name": recipient_name,
        "recipient_email": recipient_email,
        "reservation_link": build_reservation_link(reservation.id, link_role),
        "reservation_id": reservation.id,
        "guest_name": guest.name,
        "guest_email": guest.email,
        "host_name": host.name if host else "the host",
        "apartment_title": apartment.title,
        "apartment_address": apartment.address,
        "apartment_city": apartment.city,
        "apartment_country": apartment.country,
        "check_in": reservation.check_in.isoformat(),
        "check_out": reservation.check_out.isoformat(),
        "nights": (reservation.check_out - reservation.check_in).days,
        "guests_count": reservation.guests_count,
        "total_price": f"{reservation.total_price:.2f}",
        "status": reservation.status,
    }
