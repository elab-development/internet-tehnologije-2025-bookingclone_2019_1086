from typing import Any, Optional

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.shared.errors import AppError


class ExceptionHandlers:
    """Turns every failure into one JSON shape the frontend can translate.

    All three handlers answer with the same envelope:

        {"detail": "<english sentence>", "code": "<stable code>", "params": {}}

    Only this class knows what that envelope looks like, so changing it is a
    change in one place. The endpoints stay out of it: they raise an AppError
    and never build a response themselves.
    """

    # FastAPI raises a few of these on its own, never through AppError.
    FRAMEWORK_ERROR_CODES = {
        "Not authenticated": "not_authenticated",
        "Not Found": "route_not_found",
        "Method Not Allowed": "method_not_allowed",
    }

    VALIDATION_CODE = "validation_failed"
    VALIDATION_MESSAGE = "Validation failed"

    @staticmethod
    def build_response(
        status_code: int,
        detail: str,
        code: str,
        params: Optional[dict[str, Any]] = None,
        headers: Optional[dict[str, str]] = None,
        extra: Optional[dict[str, Any]] = None,
    ) -> JSONResponse:
        content: dict[str, Any] = {
            "detail": detail,
            "code": code,
            "params": params or {},
        }

        if extra:
            content.update(extra)

        return JSONResponse(status_code=status_code, content=content, headers=headers)

    @classmethod
    async def handle_app_error(cls, request, exc: AppError) -> JSONResponse:
        """Our own errors already carry everything the frontend needs."""
        return cls.build_response(
            status_code=exc.status_code,
            detail=str(exc.detail),
            code=exc.code,
            params=exc.params,
        )

    @classmethod
    async def handle_http_error(
        cls, request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """Give a code to the errors the framework raises by itself."""
        message = str(exc.detail)

        return cls.build_response(
            status_code=exc.status_code,
            detail=message,
            code=cls.FRAMEWORK_ERROR_CODES.get(message, f"http_{exc.status_code}"),
            headers=getattr(exc, "headers", None),
        )

    @classmethod
    async def handle_validation_error(
        cls, request, exc: RequestValidationError
    ) -> JSONResponse:
        """Pydantic rejects with a field list, not a sentence.

        The list is kept under `errors` for whoever is debugging, while the
        code gives the user one translated sentence instead of raw validation
        output.
        """
        return cls.build_response(
            status_code=422,
            detail=cls.VALIDATION_MESSAGE,
            code=cls.VALIDATION_CODE,
            extra={
                "errors": [
                    {
                        "field": ".".join(str(part) for part in error.get("loc", [])[1:]),
                        "message": error.get("msg", ""),
                    }
                    for error in exc.errors()
                ]
            },
        )

    @classmethod
    def register(cls, app: FastAPI) -> None:
        """Hook the handlers onto the app. Called once, from main."""
        app.add_exception_handler(AppError, cls.handle_app_error)
        app.add_exception_handler(StarletteHTTPException, cls.handle_http_error)
        app.add_exception_handler(RequestValidationError, cls.handle_validation_error)
