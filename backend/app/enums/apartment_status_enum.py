from enum import Enum


class ApartmentStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


# A host may move an apartment between these two, and nothing else.
SETTABLE_STATUSES = (
    ApartmentStatus.ACTIVE.value,
    ApartmentStatus.INACTIVE.value,
)
