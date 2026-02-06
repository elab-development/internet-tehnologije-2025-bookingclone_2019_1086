# loading .env file
from app.env_loader import load_env

load_env()


from typing import Annotated, List
from contextlib import asynccontextmanager
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, UploadFile, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import db
import app.models  # IMPORTANT: ensures SQLModel metadata is populated
from app.seed import seed_database

from app.auth.auth_endpoints import router as auth_router
from app.apartment.apartments_endpoints import router as apartments_router
from app.apartment_photo.apartment_photo_endpoints import (
    router as apartment_photo_router,
)
from app.tag.tag_endpoints import router as tag_router


UPLOAD_DIR = Path("static/images/apartments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


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

app.include_router(auth_router)
app.include_router(apartments_router)
app.include_router(apartment_photo_router)
app.include_router(tag_router)

# Serves ./static at /static
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/pictures/{apartment_id}")
async def upload_apartment_images(
    apartment_id: int,
    files: List[UploadFile] = File(...),
):
    apartment_dir = UPLOAD_DIR / str(apartment_id)
    apartment_dir.mkdir(parents=True, exist_ok=True)

    # validate all first
    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Only image files are allowed. Invalid: {file.filename}",
            )

    saved = []
    for file in files:
        file_ext = Path(file.filename).suffix.lower()
        filename = f"{uuid4()}{file_ext}"
        file_path = apartment_dir / filename

        with file_path.open("wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                buffer.write(chunk)

        saved.append(
            {
                "original_name": file.filename,
                "filename": filename,
                "relative_path": f"images/apartments/{apartment_id}/{filename}",
                "url": f"/static/images/apartments/{apartment_id}/{filename}",
            }
        )

        await file.close()

    return {"apartment_id": apartment_id, "count": len(saved), "files": saved}
