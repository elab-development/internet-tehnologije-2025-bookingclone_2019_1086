from fastapi import Depends, HTTPException

from app.models.user import User
from app.enums.role_enum import Role
from app.auth.current_user import get_current_user
from app.errors import forbidden


class Policy:
    def __init__(self, allowed_roles: set[Role]):
        self.allowed_roles = allowed_roles

    def check_access(self, user: User = Depends(get_current_user)) -> bool:
        if user.role == Role.ADMIN:
            return True

        if user.role not in self.allowed_roles:
            raise forbidden("forbidden", "Forbidden")

        return True
