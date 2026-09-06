from __future__ import annotations

import asyncio
import json
import logging
import os
from datetime import datetime, timedelta
from typing import Any, Optional

from sqlalchemy import update
from sqlmodel import select

from app.enums.outbox_status_enum import OutboxStatus
from app.models.outbox_event import OutboxEvent
from app.services.mailer import is_mail_enabled, send_email
from app.services.reservation_email import build_message


logger = logging.getLogger("app.outbox")

MAX_ERROR_LENGTH = 1000
MAX_BACKOFF_SECONDS = 60 * 60


def utcnow() -> datetime:
    return datetime.utcnow()


def read_int_setting(name: str, default: int) -> int:
    raw = (os.getenv(name) or "").strip()

    if not raw:
        return default

    try:
        return int(raw)
    except ValueError:
        return default


def next_delay_seconds(attempts: int) -> int:
    """Wait longer after every failure: 30s, 60s, 120s, 240s ... up to an hour."""
    base = read_int_setting("OUTBOX_RETRY_BASE_SECONDS", 30)
    delay = base * (2 ** (attempts - 1))

    return min(delay, MAX_BACKOFF_SECONDS)


class OutboxWorker:
    """Walks the outbox table and delivers whatever is waiting there.

    Runs next to the API in the same process. Every pass takes a small batch of
    pending events, marks them as being worked on, and sends them one by one.
    Anything that fails goes back to pending with a later available_at, so the
    next pass tries again until it either succeeds or runs out of attempts.
    """

    def __init__(self, session_factory):
        self.session_factory = session_factory
        self.task: Optional[asyncio.Task] = None
        self.stopping = asyncio.Event()

    def start(self) -> None:
        self.stopping.clear()
        self.task = asyncio.create_task(self.run(), name="outbox-worker")

    async def stop(self) -> None:
        self.stopping.set()

        if not self.task:
            return

        try:
            await asyncio.wait_for(self.task, timeout=10)
        except (asyncio.TimeoutError, asyncio.CancelledError):
            self.task.cancel()

        self.task = None

    async def run(self) -> None:
        poll_seconds = read_int_setting("OUTBOX_POLL_SECONDS", 15)

        await self.release_stuck_events()

        while not self.stopping.is_set():
            try:
                await self.process_batch()
            except Exception:
                # A broken pass must not kill the worker for the rest of the run.
                logger.exception("Outbox pass failed")

            try:
                await asyncio.wait_for(self.stopping.wait(), timeout=poll_seconds)
            except asyncio.TimeoutError:
                pass

    async def release_stuck_events(self) -> None:
        """Events left as 'processing' by a crash would sit there forever."""
        async with self.session_factory() as session:
            await session.exec(
                update(OutboxEvent)
                .where(OutboxEvent.status == OutboxStatus.PROCESSING.value)
                .values(status=OutboxStatus.PENDING.value)
            )
            await session.commit()

    async def process_batch(self) -> None:
        events = await self.claim_events()

        for event in events:
            if self.stopping.is_set():
                return

            await self.deliver(event)

    async def claim_events(self) -> list[OutboxEvent]:
        """Take a batch and mark it, so a second pass cannot send it twice."""
        batch_size = read_int_setting("OUTBOX_BATCH_SIZE", 10)

        async with self.session_factory() as session:
            query = (
                select(OutboxEvent)
                .where(OutboxEvent.status == OutboxStatus.PENDING.value)
                .where(OutboxEvent.available_at <= utcnow())
                .order_by(OutboxEvent.available_at)
                .limit(batch_size)
            )

            events = list((await session.exec(query)).all())

            if not events:
                return []

            await session.exec(
                update(OutboxEvent)
                .where(OutboxEvent.id.in_([event.id for event in events]))
                .values(status=OutboxStatus.PROCESSING.value)
            )
            await session.commit()

            return events

    async def deliver(self, event: OutboxEvent) -> None:
        try:
            await self.handle(event)
        except Exception as error:
            logger.warning("Outbox event %s failed: %s", event.id, error)
            await self.reschedule(event, error)
            return

        await self.mark_sent(event)

    async def handle(self, event: OutboxEvent) -> None:
        payload: dict[str, Any] = json.loads(event.payload)

        # Raises on an event type nothing knows how to write, which lands in
        # last_error instead of being quietly dropped.
        subject, text_body, html_body = build_message(event.event_type, payload)

        if not is_mail_enabled():
            logger.info(
                "Mail disabled, skipping event %s for %s",
                event.id,
                payload.get("recipient_email"),
            )
            return

        # smtplib blocks, so it goes to a thread instead of stalling the API.
        await asyncio.to_thread(
            send_email,
            to_email=payload["recipient_email"],
            to_name=payload["recipient_name"],
            subject=subject,
            text_body=text_body,
            html_body=html_body,
        )

        logger.info(
            "Sent %s mail to %s", event.event_type, payload["recipient_email"]
        )

    async def mark_sent(self, event: OutboxEvent) -> None:
        async with self.session_factory() as session:
            await session.exec(
                update(OutboxEvent)
                .where(OutboxEvent.id == event.id)
                .values(
                    status=OutboxStatus.SENT.value,
                    attempts=event.attempts + 1,
                    processed_at=utcnow(),
                    last_error=None,
                )
            )
            await session.commit()

    async def reschedule(self, event: OutboxEvent, error: Exception) -> None:
        max_attempts = read_int_setting("OUTBOX_MAX_ATTEMPTS", 5)
        attempts = event.attempts + 1
        message = f"{type(error).__name__}: {error}"[:MAX_ERROR_LENGTH]

        if attempts >= max_attempts:
            # Out of tries: leave it as failed so it can be looked at by hand.
            values = {
                "status": OutboxStatus.FAILED.value,
                "attempts": attempts,
                "last_error": message,
                "processed_at": utcnow(),
            }
        else:
            values = {
                "status": OutboxStatus.PENDING.value,
                "attempts": attempts,
                "last_error": message,
                "available_at": utcnow()
                + timedelta(seconds=next_delay_seconds(attempts)),
            }

        async with self.session_factory() as session:
            await session.exec(
                update(OutboxEvent).where(OutboxEvent.id == event.id).values(**values)
            )
            await session.commit()
