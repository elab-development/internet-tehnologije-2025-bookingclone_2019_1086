from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import select, delete
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import db
from app.models.apartment import Apartment
from sqlalchemy import func

from app.auth.authorization import Policy
from app.auth.current_user import get_current_user
from app.enums.role_enum import Role
from app.models.user import User


router = APIRouter(
    prefix="/apartments/{apartment_id}/photos", tags=["apartments_photo"]
)
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]


class ApartmentPhotoResponse(BaseModel):
    items: list[ApartmentPhotoDto] = []


class ApartmentPhotoDto(BaseModel):
    id: int
    path: str
    is_main: bool


from fastapi import Depends, HTTPException
from sqlmodel import select


async def apartment_belongs_to_host(
    apartment_id: int,
    session: SessionDep,
    current_user: User = Depends(get_current_user),
) -> Apartment:
    apt = (
        await session.exec(select(Apartment).where(Apartment.id == apartment_id))
    ).first()

    if not apt:
        raise HTTPException(status_code=404, detail="Apartment not found")

    if apt.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="This apartment is not yours")

    return apt


@router.get("", response_model=list[ApartmentPhotoDto])
async def get_apartment_main_photo(
    apartment_id: int,
    session: SessionDep,
):
    apt = (
        await session.exec(select(Apartment).where(Apartment.id == apartment_id))
    ).first()

    if not apt:
        raise HTTPException(status_code=404, detail="Apartment not found")

    photos = (
        await session.exec(
            select(ApartmentPhoto).where(ApartmentPhoto.apartment_id == apartment_id)
        )
    ).all()

    result: list[ApartmentPhotoDto] = []
    for item in photos:
        photo_dto = ApartmentPhotoDto(
            id=item.id, path=item.image_url, is_main=item.is_main
        )
        result.append(photo_dto)

    return result


from pathlib import Path
from fastapi import UploadFile, File
from fastapi.staticfiles import StaticFiles
from typing import Annotated, List
from uuid import uuid4
from app.models.apartment_photo import ApartmentPhoto


UPLOAD_DIR = Path("static/images/apartments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("", response_model=list[ApartmentPhotoDto])
async def upload_apartment_photos(
    session: SessionDep,
    photos: List[UploadFile] = File(...),
    apartment: Apartment = Depends(apartment_belongs_to_host),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    apartment_dir = UPLOAD_DIR / str(apartment.id)
    apartment_dir.mkdir(parents=True, exist_ok=True)

    created: list[ApartmentPhoto] = []

    for file in photos:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"Only image files are allowed. Invalid: {file.filename}",
            )

    for file in photos:
        ext = Path(file.filename).suffix.lower()
        # filename = f"{uuid4().hex}{ext}"
        filename = file.filename

        file_path = apartment_dir / filename
        url = f"/static/images/apartments/{apartment.id}/{filename}"

        with file_path.open("wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)

        photo = ApartmentPhoto(
            apartment_id=apartment.id,
            image_url=url,
            is_main=False,
        )
        session.add(photo)
        created.append(photo)

        await file.close()

    await session.commit()

    for p in created:
        await session.refresh(p)

    return [
        ApartmentPhotoDto(id=p.id, path=p.image_url, is_main=False) for p in created
    ]


from fastapi import Body


class DeleteApartmentPhotosRequest(BaseModel):
    apartment_photo_ids: List[int]


@router.delete("", status_code=204)
async def delete_appartment_photo(
    apartment_id: int,
    session: SessionDep,
    delete_body: DeleteApartmentPhotosRequest,
    apartment: Apartment = Depends(apartment_belongs_to_host),
):
    results = await session.exec(
        select(ApartmentPhoto).where(
            ApartmentPhoto.id.in_(delete_body.apartment_photo_ids),
            ApartmentPhoto.apartment_id == apartment_id,
        )
    )

    apartment_photos: list[ApartmentPhoto] = results.all()

    matched_ids = [p.id for p in apartment_photos]

    if not matched_ids:
        return

    await session.exec(delete(ApartmentPhoto).where(ApartmentPhoto.id.in_(matched_ids)))
    await session.commit()

    # delete files from disk
    apartment_dir = UPLOAD_DIR / str(apartment_id)

    for photo in apartment_photos:
        filename = Path(photo.image_url).name
        filepath = apartment_dir / filename

        if filepath.is_file():
            filepath.unlink()
