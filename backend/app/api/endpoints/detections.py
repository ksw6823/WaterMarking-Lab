from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.detection import Detection
from app.schemas.common import Page, make_preview
from app.schemas.detections import DetectionListItem, DetectionOut

router = APIRouter()


@router.get("", response_model=Page[DetectionListItem])
def list_detections(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    is_watermarked: Optional[bool] = Query(default=None),
    min_confidence: Optional[float] = Query(default=None, ge=0.0, le=1.0),
    db: Session = Depends(get_db),
):
    stmt = select(Detection)
    if is_watermarked is not None:
        stmt = stmt.where(Detection.is_watermarked == is_watermarked)
    if min_confidence is not None:
        stmt = stmt.where(Detection.confidence >= min_confidence)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()

    stmt = (
        stmt.order_by(Detection.created_at.desc(), Detection.detection_id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = db.execute(stmt).scalars().all()

    items = [
        DetectionListItem(
            detection_id=r.detection_id,
            generation_id=r.generation_id,
            created_at=r.created_at,
            input_text_preview=make_preview(r.input_text, 100),
            is_watermarked=r.is_watermarked,
            z_score=r.z_score,
            confidence=r.confidence,
        )
        for r in rows
    ]
    return Page(total=total, page=page, page_size=page_size, items=items)


@router.get("/{detection_id}", response_model=DetectionOut)
def get_detection(detection_id: int, db: Session = Depends(get_db)) -> Detection:
    row = db.get(Detection, detection_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Detection not found")
    return row

