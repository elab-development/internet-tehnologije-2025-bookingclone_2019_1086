from enum import Enum


class OutboxStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SENT = "sent"
    FAILED = "failed"


class OutboxEventType(str, Enum):
    # Guest books: the guest gets a receipt, the host gets a heads up.
    RESERVATION_CREATED = "reservation_created"
    RESERVATION_CREATED_HOST = "reservation_created_host"

    # Host answers: the guest is told it was confirmed or declined.
    RESERVATION_STATUS_CHANGED = "reservation_status_changed"


# Events in these statuses are finished and the worker never touches them again.
FINAL_STATUSES = (
    OutboxStatus.SENT.value,
    OutboxStatus.FAILED.value,
)
