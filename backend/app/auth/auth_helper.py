from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import secrets
import jwt
from fastapi import HTTPException, Response
from passlib.context import CryptContext
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.user import User


class AuthHelper:
    JWT_SECRET = "CHANGE_ME_TO_LONG_RANDOM_SECRET"
    JWT_ALG = "HS256"

    ACCESS_TTL_MIN = 1000
    REFRESH_TTL_DAYS = 14

    REFRESH_COOKIE_NAME = "refresh_token"
    REFRESH_COOKIE_PATH = "/auth/refresh"

    COOKIE_SECURE = False
    COOKIE_SAMESITE = "lax"

    REFRESH_HASH_PEPPER = "CHANGE_ME_PEPPER"

    def __init__(self):
        self._pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    # --- helpers ---
    def utcnow(self) -> datetime:
        return datetime.now(timezone.utc)

    def hash_password(self, password: str) -> str:
        return self._pwd_context.hash(password)

    def verify_password(self, plain: str, stored_hash: str) -> bool:
        return self._pwd_context.verify(plain, stored_hash)

    def hash_refresh_token(self, raw: str) -> str:
        return hmac.new(
            self.REFRESH_HASH_PEPPER.encode("utf-8"),
            raw.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def create_refresh_token(self) -> str:
        return secrets.token_urlsafe(48)

    def create_access_token(self, user: User) -> str:
        payload = {
            "sub": str(user.id),
            "role": user.role.value,
            "type": "access",
            "iat": self.utcnow(),
            "exp": self.utcnow() + timedelta(minutes=self.ACCESS_TTL_MIN),
        }
        return jwt.encode(payload, self.JWT_SECRET, algorithm=self.JWT_ALG)

    def decode_access_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, self.JWT_SECRET, algorithms=[self.JWT_ALG])
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Access token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid access token")

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")

        return payload

    def set_refresh_cookie(self, response: Response, raw_refresh: str) -> None:
        response.set_cookie(
            key=self.REFRESH_COOKIE_NAME,
            value=raw_refresh,
            httponly=True,
            secure=self.COOKIE_SECURE,
            samesite=self.COOKIE_SAMESITE,
            path=self.REFRESH_COOKIE_PATH,
            max_age=int(timedelta(days=self.REFRESH_TTL_DAYS).total_seconds()),
        )

    def clear_refresh_cookie(self, response: Response) -> None:
        response.delete_cookie(
            key=self.REFRESH_COOKIE_NAME, path=self.REFRESH_COOKIE_PATH
        )

    async def get_user_from_access_token(
        self, session: AsyncSession, token: str
    ) -> User:
        payload = self.decode_access_token(token)
        user_id = int(payload["sub"])

        user = await session.get(User, user_id)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return user
