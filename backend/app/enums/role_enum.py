from enum import Enum

class Role(str, Enum):
    USER = "USER"
    HOST = "HOST"
    ADMIN = "ADMIN"
