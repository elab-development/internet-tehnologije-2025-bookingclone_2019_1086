from pydantic import BaseModel, Field


class BasePaginationRequest(BaseModel):
    page_number: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=50)