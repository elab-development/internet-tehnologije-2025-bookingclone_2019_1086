from __future__ import annotations

from pathlib import Path
from typing import Annotated, List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile
from sqlmodel import select, delete
from sqlmodel.ext.asyncio.session import AsyncSession

from app.shared.db import db
from app.shared.errors import bad_request, not_found
from app.shared.api_docs import error_responses
from app.models.apartment import Apartment
from app.models.apartment_photo import ApartmentPhoto

from app.features.auth.dependencies import Policy
from app.enums.role_enum import Role

from app.features.apartment_photos.schemas import (
    ApartmentPhotoItemDto,
    DeleteApartmentPhotosRequest,
)
from app.features.apartment_photos.service import apartment_belongs_to_host

router = APIRouter(
    prefix="/apartments/{apartment_id}/photos", tags=["apartments_photo"]
)
SessionDep = Annotated[AsyncSession, Depends(db.get_session)]

@router.get(
    "",
    response_model=list[ApartmentPhotoItemDto],
    summary="Sve slike jednog apartmana",
    responses=error_responses(404),
)
async def get_apartment_main_photo(
    apartment_id: int,
    session: SessionDep,
):
    """Vraća slike apartmana. Javno, jer se iste slike vide i na stranici apartmana."""
    apt = (
        await session.exec(
            select(Apartment)
            .where(Apartment.id == apartment_id)
            .where(Apartment.deleted_at.is_(None))
        )
    ).first()

    if not apt:
        raise not_found("apartment_not_found", "Apartment not found")

    photos = (
        await session.exec(
            select(ApartmentPhoto).where(ApartmentPhoto.apartment_id == apartment_id)
        )
    ).all()

    result: list[ApartmentPhotoItemDto] = []
    for item in photos:
        photo_dto = ApartmentPhotoItemDto(
            id=item.id, path=item.image_url, is_main=item.is_main
        )
        result.append(photo_dto)

    return result


UPLOAD_DIR = Path("static/images/apartments")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "",
    response_model=list[ApartmentPhotoItemDto],
    summary="Otpremanje slika apartmana",
    responses=error_responses(400, 401, 403, 404),
)
async def upload_apartment_photos(
    session: SessionDep,
    photos: List[UploadFile] = File(...),
    apartment: Apartment = Depends(apartment_belongs_to_host),
    allowed: bool = Depends(Policy({Role.HOST}).check_access),
):
    """Otprema jednu ili više slika za apartman.

    Svi fajlovi se prvo provere pa tek onda upisuju, da otpremanje ne
    ostavi pola slika na disku ako je poslednja pogrešnog tipa.
    """
    apartment_dir = UPLOAD_DIR / str(apartment.id)
    apartment_dir.mkdir(parents=True, exist_ok=True)

    created: list[ApartmentPhoto] = []

    for file in photos:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise bad_request(
                "not_an_image",
                f"Only image files are allowed. Invalid: {file.filename}",
                {"filename": file.filename},
            )

    for file in photos:
        ext = Path(file.filename).suffix.lower()
        filename = f"{uuid4().hex}{ext}"

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
        ApartmentPhotoItemDto(id=p.id, path=p.image_url, is_main=False) for p in created
    ]




@router.delete(
    "",
    status_code=204,
    summary="Brisanje slika apartmana",
    responses=error_responses(401, 403, 404),
)
async def delete_apartment_photos(
    apartment_id: int,
    session: SessionDep,
    delete_body: DeleteApartmentPhotosRequest,
    apartment: Apartment = Depends(apartment_belongs_to_host),
):
    """Briše slike po identifikatorima, i iz baze i sa diska.

    Prolaze samo slike koje stvarno pripadaju tom apartmanu, pa tuđi
    identifikator ne briše ništa.
    """
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
