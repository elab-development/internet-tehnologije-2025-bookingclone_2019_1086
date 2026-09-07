from pydantic import BaseModel, EmailStr, Field, field_validator

from app.enums.role_enum import Role


class AuthUserDto(BaseModel):
    """The signed in user, as every auth route reports them."""

    id: int
    email: str
    name: str
    role: Role

class TokenResponse(BaseModel):
    """A fresh access token plus who it belongs to.

    The refresh token is deliberately absent: it goes back in an httponly
    cookie, never in the body, so no script can read it.
    """

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AuthUserDto

class RefreshResponse(BaseModel):
    """Same as a login, minus the user: whoever asks already knows who they are."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int

class StatusResponse(BaseModel):
    status: str

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=50)
    role: Role = Role.USER

    @field_validator("role")
    @classmethod
    def block_admin_self_registration(cls, value: Role) -> Role:
        if value == Role.ADMIN:
            raise ValueError("Role ADMIN cannot be assigned during registration")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) < 2:
            raise ValueError("Name must be at least 2 characters long")
        return stripped
