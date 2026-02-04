from sqlmodel import SQLModel, Field


class ApartmentTag(SQLModel, table=True):
    __tablename__ = "apartment_tag"

    # Composite primary key prevents duplicates (same as unique(apartment_id, tag_id))
    apartment_id: int = Field(foreign_key="apartments.id", primary_key=True)
    tag_id: int = Field(foreign_key="tags.id", primary_key=True)
