from typing import List

from pydantic import BaseModel


class ApartmentPhotoItemDto(BaseModel):
    """One stored photo. `path` is a url under /static, not a disk path."""

    id: int
    path: str
    is_main: bool

class DeleteApartmentPhotosRequest(BaseModel):
    apartment_photo_ids: List[int]


class SetMainPhotoRequest(BaseModel):
    apartment_photo_id: int
