from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

AttackType = Literal["deletion", "substitution", "summarization"]


class AttackCreate(BaseModel):
    attack_type: AttackType
    attack_intensity: float = Field(ge=0.0, le=100.0)

