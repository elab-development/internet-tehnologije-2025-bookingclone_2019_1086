from __future__ import annotations

import json
from typing import Any

from sqlmodel.ext.asyncio.session import AsyncSession

from app.enums.outbox_status_enum import OutboxStatus
from app.models.outbox_event import OutboxEvent


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
