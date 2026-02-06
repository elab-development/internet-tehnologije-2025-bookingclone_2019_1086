from fastapi import FastAPI, Depends
from typing import Annotated
from app.db import db
import app.models
from app.seed import seed_database
from sqlmodel import Session
from sqlmodel.ext.asyncio.session import AsyncSession
from contextlib import asynccontextmanager
from app.apartment.apartments_endpoints import router as apartments_router
from app.auth.auth_endpoints import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # create tables
    await db.create_tables()

    # seed roles
    async with db.session_factory() as session:
        await seed_database(session)
        await session.commit()

    yield

    await db.engine.dispose()


# Create a FastAPI instance. The 'app' variable is the main point of interaction to create your API.
app = FastAPI(lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

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

SessionDep = Annotated[AsyncSession, Depends(db.get_session)]

app.include_router(auth_router)
app.include_router(apartments_router)

@app.get("/health")
async def health():
    return {"status": "ok"}
