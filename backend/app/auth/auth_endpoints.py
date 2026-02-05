from typing import Annotated
from datetime import timedelta

from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import db
from app.models.user import User
from app.models.user_session import UserSession
from app.auth.dependencies import get_auth_service
from app.auth.auth_helper import AuthHelper
from app.enums.role_enum import Role
from app.auth.current_user import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    role: Role = Role.USER


@router.post("/register", status_code=201)
async def register(
    payload: RegisterRequest,
    response: Response,
    request: Request,
    session: SessionDep,
    auth: AuthHelper = Depends(get_auth_service),
):
    refresh_raw = auth.create_refresh_token()
    refresh_hash = auth.hash_refresh_token(refresh_raw)

    try:
        user = User(
            role=payload.role,
            name=payload.name,
            email=payload.email,
            password=auth.hash_password(payload.password),
            phone=payload.phone,
            created_at=auth.utcnow(),
            updated_at=auth.utcnow(),
        )
        session.add(user)
        await session.flush()

        session.add(
            UserSession(
                user_id=user.id,
                refresh_token_hash=refresh_hash,
                user_agent=request.headers.get("user-agent"),
                ip_address=request.client.host if request.client else None,
                created_at=auth.utcnow(),
                expires_at=auth.utcnow() + timedelta(days=auth.REFRESH_TTL_DAYS),
                revoked_at=None,
            )
        )

        await session.commit()

    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    except Exception:
        await session.rollback()
        raise

    auth.set_refresh_cookie(response, refresh_raw)

    return {
        "access_token": auth.create_access_token(user),
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TTL_MIN * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
    }


@router.post("/login")
async def login(
    response: Response,
    request: Request,
    session: SessionDep,
    form: OAuth2PasswordRequestForm = Depends(),
    auth: AuthHelper = Depends(get_auth_service),
):
    email = form.username
    password = form.password

    q = await session.exec(select(User).where(User.email == email))
    user = q.first()

    if not user or not auth.verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    refresh_raw = auth.create_refresh_token()
    refresh_hash = auth.hash_refresh_token(refresh_raw)

    session.add(
        UserSession(
            user_id=user.id,
            refresh_token_hash=refresh_hash,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
            created_at=auth.utcnow(),
            expires_at=auth.utcnow() + timedelta(days=auth.REFRESH_TTL_DAYS),
            revoked_at=None,
        )
    )
    await session.commit()

    auth.set_refresh_cookie(response, refresh_raw)

    return {
        "access_token": auth.create_access_token(user),
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TTL_MIN * 60,
    }


@router.post("/refresh")
async def refresh(
    response: Response,
    request: Request,
    session: SessionDep,
    auth: AuthHelper = Depends(get_auth_service),
):
    refresh_raw = request.cookies.get(auth.REFRESH_COOKIE_NAME)
    if not refresh_raw:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    refresh_hash = auth.hash_refresh_token(refresh_raw)

    q = await session.exec(
        select(UserSession).where(UserSession.refresh_token_hash == refresh_hash)
    )
    old = q.first()

    if not old:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if old.revoked_at is not None:
        raise HTTPException(status_code=401, detail="Refresh token revoked")
    if old.expires_at <= auth.utcnow():
        raise HTTPException(status_code=401, detail="Refresh token expired")

    user = await session.get(User, old.user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    old.revoked_at = auth.utcnow()
    session.add(old)

    new_refresh_raw = auth.create_refresh_token()
    new_refresh_hash = auth.hash_refresh_token(new_refresh_raw)

    session.add(
        UserSession(
            user_id=user.id,
            refresh_token_hash=new_refresh_hash,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
            created_at=auth.utcnow(),
            expires_at=auth.utcnow() + timedelta(days=auth.REFRESH_TTL_DAYS),
            revoked_at=None,
        )
    )
    await session.commit()

    auth.set_refresh_cookie(response, new_refresh_raw)

    return {
        "access_token": auth.create_access_token(user),
        "token_type": "bearer",
        "expires_in": auth.ACCESS_TTL_MIN * 60,
    }


@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    session: SessionDep,
    auth: AuthHelper = Depends(get_auth_service),
):
    refresh_raw = request.cookies.get(auth.REFRESH_COOKIE_NAME)

    if refresh_raw:
        refresh_hash = auth.hash_refresh_token(refresh_raw)
        q = await session.exec(
            select(UserSession).where(UserSession.refresh_token_hash == refresh_hash)
        )
        us = q.first()
        if us and us.revoked_at is None:
            us.revoked_at = auth.utcnow()
            session.add(us)
            await session.commit()

    auth.clear_refresh_cookie(response)
    return {"status": "ok"}


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
    }
