from typing import Any, Optional

from fastapi import HTTPException


class AppError(HTTPException):
    """An error the frontend can translate.

    The English text still travels in `detail`, so the API stays readable on
    its own and in Swagger. What makes translation possible is `code`: a stable
    identifier the frontend maps to its own wording, in whichever language the
    user picked. Anything that varies inside a sentence goes in `params` so the
    translated string can interpolate it instead of gluing English fragments
    onto a Serbian sentence.
    """

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        params: Optional[dict[str, Any]] = None,
    ):
        super().__init__(status_code=status_code, detail=message)
        self.code = code
        self.params = params or {}


# --- 400 ---


def bad_request(code: str, message: str, params: Optional[dict] = None) -> AppError:
    return AppError(400, code, message, params)


# --- 401 / 403 ---


def unauthorized(code: str, message: str) -> AppError:
    return AppError(401, code, message)


def forbidden(code: str, message: str) -> AppError:
    return AppError(403, code, message)


# --- 404 / 409 / 410 ---


def not_found(code: str, message: str) -> AppError:
    return AppError(404, code, message)


def conflict(code: str, message: str) -> AppError:
    return AppError(409, code, message)


def gone(code: str, message: str) -> AppError:
    return AppError(410, code, message)
