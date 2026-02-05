from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import db
from app.models.user import User
from app.auth.dependencies import get_auth_service
from app.auth.auth_helper import AuthHelper

SessionDep = Annotated[AsyncSession, Depends(db.get_session)]
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    session: SessionDep,
    token: str = Depends(oauth2_scheme),
    auth: AuthHelper = Depends(get_auth_service),
) -> User:
    payload = auth.decode_access_token(token)
    user_id = int(payload["sub"])

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
