from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Generation(Base):
    __tablename__ = "generations"

    generation_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    original_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("generations.generation_id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    output_text: Mapped[str] = mapped_column(Text, nullable=False)

    model: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    quantization: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    temperature: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    top_k: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    top_p: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    watermark_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)
    context_width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    tournament_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    g_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    watermark_key: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    attack_type: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    attack_intensity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    original: Mapped["Generation | None"] = relationship(
        "Generation",
        remote_side="Generation.generation_id",
        backref="variants",
    )


Index("ix_generations_created_at_generation_id", Generation.created_at, Generation.generation_id)

