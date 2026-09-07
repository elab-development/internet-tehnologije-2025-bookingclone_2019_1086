from typing import Annotated
from datetime import timedelta

from sqlalchemy.exc import IntegrityError

from fastapi import APIRouter, Depends, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.shared.db import db
from app.models.user import User
from app.models.user_session import UserSession
from app.features.auth.dependencies import get_auth_service
from app.features.auth.service import AuthHelper
from app.features.auth.dependencies import get_current_user
from app.shared.errors import conflict, unauthorized
from app.shared.api_docs import error_responses

from app.features.auth.schemas import (
    AuthUserDto,
    RefreshResponse,
    RegisterRequest,
    StatusResponse,
    TokenResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


@router.post(
    "/register",
    status_code=201,
    response_model=TokenResponse,
    summary="Registracija novog korisnika",
    responses=error_responses(409),
)
async def register(
    payload: RegisterRequest,
    response: Response,
    request: Request,
    session: SessionDep,
    auth: AuthHelper = Depends(get_auth_service),
):
    """Pravi nalog i odmah prijavljuje korisnika.

    Uloga se bira pri registraciji, ali **ADMIN** ne prolazi: administrator se
    ne dodeljuje sam sebi. Nalog i prva sesija se upisuju u istoj transakciji,
    pa registracija ne može da ostavi korisnika bez sesije.
    """
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
        raise conflict("email_taken", "Email already registered")
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


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Prijava i preuzimanje tokena",
    responses=error_responses(401),
)
async def login(
    response: Response,
    request: Request,
    session: SessionDep,
    form: OAuth2PasswordRequestForm = Depends(),
    auth: AuthHelper = Depends(get_auth_service),
):
    """Proverava lozinku i otvara novu sesiju.

    Telo je `application/x-www-form-urlencoded`, kako Swagger UI očekuje: polje
    `username` je zapravo email adresa. Pogrešna lozinka i nepostojeći nalog
    vraćaju istu grešku, da odgovor ne bi odao koje adrese postoje.
    """
    email = form.username.strip().lower()
    password = form.password

    q = await session.exec(select(User).where(User.email == email))
    user = q.first()

    if not user or not auth.verify_password(password, user.password):
        raise unauthorized("invalid_credentials", "Invalid credentials")

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
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
    }


@router.post(
    "/refresh",
    response_model=RefreshResponse,
    summary="Osvežavanje isteklog access tokena",
    responses=error_responses(401),
)
async def refresh(
    response: Response,
    request: Request,
    session: SessionDep,
    auth: AuthHelper = Depends(get_auth_service),
):
    """Menja refresh token iz kolačića za nov par tokena.

    Stari token se poništava u istom potezu, pa svaki vredi tačno jednom. Ako
    se isti token pojavi drugi put, sesija je ili istekla ili ukradena, i u oba
    slučaja odgovor je 401.
    """
    refresh_raw = request.cookies.get(auth.REFRESH_COOKIE_NAME)
    if not refresh_raw:
        raise unauthorized("refresh_missing", "Missing refresh token")

    refresh_hash = auth.hash_refresh_token(refresh_raw)

    q = await session.exec(
        select(UserSession).where(UserSession.refresh_token_hash == refresh_hash)
    )
    old = q.first()

    if not old:
        raise unauthorized("refresh_invalid", "Invalid refresh token")
    if old.revoked_at is not None:
        raise unauthorized("refresh_revoked", "Refresh token revoked")
    if auth.as_utc(old.expires_at) <= auth.utcnow():
        raise unauthorized("refresh_expired", "Refresh token expired")

    user = await session.get(User, old.user_id)
    if not user:
        raise unauthorized("user_not_found", "User not found")

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


@router.post(
    "/logout",
    response_model=StatusResponse,
    summary="Odjava i poništavanje refresh tokena",
)
async def logout(
    response: Response,
    request: Request,
    session: SessionDep,
    auth: AuthHelper = Depends(get_auth_service),
):
    """Poništava sesiju i briše kolačić.

    Odjava bez važećeg tokena nije greška: cilj je da korisnik na kraju bude
    odjavljen, a to je već ispunjeno.
    """
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


@router.get(
    "/me",
    response_model=AuthUserDto,
    summary="Podaci o prijavljenom korisniku",
    responses=error_responses(401),
)
async def me(current_user: User = Depends(get_current_user)):
    """Vraća prijavljenog korisnika, čime ujedno proverava da token još važi."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
    }
