from enum import Enum


class ReservationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


# Dates held by these statuses are not available to anyone else.
BLOCKING_STATUSES = (
    ReservationStatus.PENDING.value,
    ReservationStatus.CONFIRMED.value,
)
