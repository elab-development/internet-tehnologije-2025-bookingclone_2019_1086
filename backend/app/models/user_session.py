from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Column, Text
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .user import User


def utcnow() -> datetime:
    return datetime.utcnow()


class UserSession(SQLModel, table=True):
    __tablename__ = "user_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)

    refresh_token_hash: str = Field(
        sa_column=Column(
            Text,
            unique=True,
            index=True,
            nullable=False
        )
    )

    user_agent: Optional[str] = Field(default=None, max_length=255)
    ip_address: Optional[str] = Field(default=None, max_length=50)

    revoked_at: Optional[datetime] = Field(default=None)

    created_at: datetime = Field(default_factory=utcnow)
    expires_at: datetime

    user: Optional["User"] = Relationship(back_populates="sessions")
