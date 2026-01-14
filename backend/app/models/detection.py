from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Detection(Base):
    __tablename__ = "detections"

    detection_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    generation_id: Mapped[int] = mapped_column(
        ForeignKey("generations.generation_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    input_text: Mapped[str] = mapped_column(Text, nullable=False)
    is_watermarked: Mapped[bool] = mapped_column(Boolean, nullable=False, index=True)

    z_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    p_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True, index=True)

    true_positive_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    false_positive_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    roc_auc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    bleu_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    generation = relationship("Generation")


Index("ix_detections_created_at_detection_id", Detection.created_at, Detection.detection_id)

