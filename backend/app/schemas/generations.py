from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GenerationCreate(BaseModel):
    input_text: str = Field(min_length=1)
    model: str = Field(min_length=1)

    quantization: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_k: Optional[int] = Field(default=None, ge=1)
    top_p: Optional[float] = Field(default=0.9, ge=0.0, le=1.0)
    max_tokens: int = Field(default=200, ge=1, le=4096)

    watermark_enabled: bool = True
    context_width: Optional[int] = Field(default=None, ge=1, le=5)
    tournament_size: Optional[int] = Field(default=None, ge=1)
    g_value: Optional[float] = Field(default=None, ge=0.0)
    watermark_key: Optional[str] = None


class GenerationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    generation_id: int
    original_id: Optional[int] = None
    created_at: datetime

    input_text: str
    output_text: str

    model: str
    quantization: Optional[str] = None
    temperature: Optional[float] = None
    top_k: Optional[int] = None
    top_p: Optional[float] = None
    max_tokens: Optional[int] = None

    watermark_enabled: bool
    context_width: Optional[int] = None
    tournament_size: Optional[int] = None
    g_value: Optional[float] = None
    watermark_key: Optional[str] = None

    attack_type: Optional[str] = None
    attack_intensity: Optional[float] = None


class GenerationListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    generation_id: int
    original_id: Optional[int] = None
    created_at: datetime

    input_text: str
    model: str
    watermark_enabled: bool
    attack_type: Optional[str] = None
    attack_intensity: Optional[float] = None

