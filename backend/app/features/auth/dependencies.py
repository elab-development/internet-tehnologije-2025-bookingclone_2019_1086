from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from app.shared.db import db
from app.shared.errors import forbidden, unauthorized
from app.models.user import User
from app.enums.role_enum import Role
from app.features.auth.service import AuthHelper


SessionDep = Annotated[AsyncSession, Depends(db.get_session)]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

_auth_service = AuthHelper()


def get_auth_service() -> AuthHelper:
    return _auth_service


async def get_current_user(
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    auth: AuthHelper = Depends(get_auth_service),
) -> User:
    payload = auth.decode_access_token(token)
    user_id = int(payload["sub"])

    user = await session.get(User, user_id)
    if not user:
        raise unauthorized("user_not_found", "User not found")

    return user


class Policy:
    def __init__(self, allowed_roles: set[Role]):
        self.allowed_roles = allowed_roles

    def check_access(self, user: User = Depends(get_current_user)) -> bool:
        if user.role == Role.ADMIN:
            return True

        if user.role not in self.allowed_roles:
            raise forbidden("forbidden", "Forbidden")

        return True
