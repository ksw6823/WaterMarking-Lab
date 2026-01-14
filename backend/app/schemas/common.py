from __future__ import annotations

from typing import Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=200)
    items: List[T]


class NotFoundDetail(BaseModel):
    detail: str


class Message(BaseModel):
    message: str


def make_preview(text: str, limit: int = 100) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "..."

