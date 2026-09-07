from typing import Optional

from pydantic import BaseModel, Field

from app.shared.pagination import BasePaginationRequest


# Filters
class TagFilter(BasePaginationRequest):
    name: Optional[str] = Field(default=None, max_length=100)

# DTOs / Requests
class TagDto(BaseModel):
    id: int
    name: str
    icon_key: str
    svg_icon: Optional[str]

class TagCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon_key: str = Field(min_length=1, max_length=100)
    svg_icon: Optional[str] = None

class TagUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon_key: str = Field(min_length=1, max_length=100)
    svg_icon: Optional[str] = None

class TagPatchRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    icon_key: Optional[str] = Field(default=None, min_length=1, max_length=100)
    svg_icon: Optional[str] = None
