from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DetectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    detection_id: int
    generation_id: int
    created_at: datetime

    input_text: str
    is_watermarked: bool

    z_score: Optional[float] = None
    p_value: Optional[float] = None
    confidence: Optional[float] = None
    true_positive_rate: Optional[float] = None
    false_positive_rate: Optional[float] = None
    roc_auc: Optional[float] = None
    bleu_score: Optional[float] = None


class DetectionListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    detection_id: int
    generation_id: int
    created_at: datetime

    input_text_preview: str
    is_watermarked: bool
    z_score: Optional[float] = None
    confidence: Optional[float] = None

