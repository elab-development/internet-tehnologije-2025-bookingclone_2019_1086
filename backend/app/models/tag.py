
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Column, Text
from sqlmodel import SQLModel, Field, Relationship

from .apartment_tag import ApartmentTag

if TYPE_CHECKING:
    from .apartment import Apartment


class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True, unique=True)  # 'Wi-Fi'
    icon_key: str = Field(max_length=100, index=True)           # 'wifi'
    svg_icon: Optional[str] = Field(default=None, sa_column=Column(Text))

    apartments: list["Apartment"] = Relationship(back_populates="tags", link_model=ApartmentTag)
