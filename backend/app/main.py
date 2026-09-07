# loading .env file
from app.shared.env_loader import load_env

load_env()


from typing import Annotated
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.shared.db import db
import app.models  # IMPORTANT: ensures SQLModel metadata is populated
from app.shared.seed import seed_database

from app.features.auth.router import router as auth_router
from app.features.apartments.router import router as apartments_router
from app.features.apartment_photos.router import (
    router as apartment_photo_router,
)
from app.features.tags.router import router as tag_router
from app.features.reservations.router import router as reservation_router
from app.features.stats.router import router as stats_router
from app.features.reviews.router import router as reviews_router
from app.shared.outbox.worker import OutboxWorker
from app.features.reservations.emails import build_message
from app.shared.exception_handlers import ExceptionHandlers
from app.shared.api_docs import (
    API_DESCRIPTION,
    API_TITLE,
    API_VERSION,
    TAGS_METADATA,
)


# Photos are uploaded by the photo router, which has its own copy of this path.
# The folder is still made here because StaticFiles refuses to mount a directory
# that does not exist, and on a fresh checkout nothing else has created it yet.
UPLOAD_DIR = Path("static/images/apartments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create tables
    await db.create_tables()

    # # seed roles
    async with db.session_factory() as session:
        await seed_database(session)
        await session.commit()

    # background delivery of everything sitting in the outbox table
    outbox_worker = OutboxWorker(db.session_factory, build_message)
    outbox_worker.start()

    yield

    await outbox_worker.stop()
    await db.engine.dispose()


app = FastAPI(
    lifespan=lifespan,
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    openapi_tags=TAGS_METADATA,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# One place decides what an error looks like on the wire.
ExceptionHandlers.register(app)


app.include_router(auth_router)
app.include_router(apartments_router)
app.include_router(apartment_photo_router)
app.include_router(tag_router)
app.include_router(reservation_router)
app.include_router(stats_router)
app.include_router(reviews_router)

# Serves ./static at /static
app.mount("/static", StaticFiles(directory="static"), name="static")


class HealthResponse(BaseModel):
    status: str


@app.get("/health", response_model=HealthResponse, tags=["health"])
async def health():
    """Says the application is up. Nothing behind it is checked."""
    return {"status": "ok"}
