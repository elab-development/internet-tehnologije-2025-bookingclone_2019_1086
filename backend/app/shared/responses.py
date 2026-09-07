from typing import Generic, TypeVar, List
from pydantic.generics import GenericModel

T = TypeVar("T")


class BasePagedResponse(GenericModel, Generic[T]):
    page_number: int
    page_size: int
    total: int
    items: List[T]