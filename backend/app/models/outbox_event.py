from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Text
from sqlmodel import SQLModel, Field


def utcnow() -> datetime:
    return datetime.utcnow()


class OutboxEvent(SQLModel, table=True):
    """One thing that happened in the app and still has to be delivered somewhere.

    The row is written in the same transaction as the data that caused it, so an
    event can never exist without its reservation and a reservation can never be
    saved without its event. A background worker picks the rows up later and does
    the slow part (sending the mail), retrying the ones that failed.
    """

    __tablename__ = "outbox_events"

    id: Optional[int] = Field(default=None, primary_key=True)

    event_type: str = Field(max_length=50, index=True)  # 'reservation_created'

    # JSON snapshot of everything the mail needs, so the worker does not depend
    # on rows that may have changed since.
    payload: str = Field(sa_column=Column(Text, nullable=False))

    status: str = Field(
        max_length=20, index=True
    )  # 'pending','processing','sent','failed'

    attempts: int = Field(default=0)
    last_error: Optional[str] = Field(default=None, sa_column=Column(Text))

    # The worker ignores the event until this moment, which is how retries back off.
    available_at: datetime = Field(default_factory=utcnow, index=True)

    created_at: datetime = Field(default_factory=utcnow)
    processed_at: Optional[datetime] = Field(default=None)
