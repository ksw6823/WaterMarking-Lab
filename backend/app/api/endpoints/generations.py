from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.models.generation import Generation
from app.models.detection import Detection
from app.schemas.attacks import AttackCreate
from app.schemas.common import Page
from app.schemas.detections import DetectionOut
from app.schemas.generations import GenerationCreate, GenerationListItem, GenerationOut
from app.services.ai import attack_text, detect_text, generate_text
import sacrebleu

router = APIRouter()


@router.post("", response_model=GenerationOut)
async def create_generation(payload: GenerationCreate, db: Session = Depends(get_db)) -> Generation:
    output = await generate_text(payload.input_text, payload.model_dump())

    row = Generation(
        original_id=None,
        input_text=payload.input_text,
        output_text=output,
        model=payload.model,
        quantization=payload.quantization,
        temperature=payload.temperature,
        top_k=payload.top_k,
        top_p=payload.top_p,
        max_tokens=payload.max_tokens,
        watermark_enabled=payload.watermark_enabled,
        context_width=payload.context_width,
        tournament_size=payload.tournament_size,
        g_value=payload.g_value,
        watermark_key=payload.watermark_key,
        attack_type=None,
        attack_intensity=None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=Page[GenerationListItem])
def list_generations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=200),
    model: Optional[str] = Query(default=None),
    watermark_enabled: Optional[bool] = Query(default=None),
    attack_type: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    stmt = select(Generation)
    if model is not None:
        stmt = stmt.where(Generation.model == model)
    if watermark_enabled is not None:
        stmt = stmt.where(Generation.watermark_enabled == watermark_enabled)
    if attack_type is not None:
        stmt = stmt.where(Generation.attack_type == attack_type)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar_one()

    stmt = (
        stmt.order_by(Generation.created_at.desc(), Generation.generation_id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = db.execute(stmt).scalars().all()

    items = [
        GenerationListItem(
            generation_id=r.generation_id,
            original_id=r.original_id,
            created_at=r.created_at,
            input_text=r.input_text,
            model=r.model,
            watermark_enabled=r.watermark_enabled,
            attack_type=r.attack_type,
            attack_intensity=r.attack_intensity,
        )
        for r in rows
    ]
    return Page(total=total, page=page, page_size=page_size, items=items)


@router.get("/{generation_id}", response_model=GenerationOut)
def get_generation(generation_id: int, db: Session = Depends(get_db)) -> Generation:
    row = db.get(Generation, generation_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Generation not found")
    return row


@router.post("/{generation_id}/attacks", response_model=GenerationOut)
async def create_attack_generation(generation_id: int, payload: AttackCreate, db: Session = Depends(get_db)) -> Generation:
    original = db.get(Generation, generation_id)
    if original is None:
        raise HTTPException(status_code=404, detail="Generation not found")

    attacked = await attack_text(original.output_text, payload.attack_type, payload.attack_intensity)

    row = Generation(
        original_id=original.generation_id,
        input_text=original.input_text,
        output_text=attacked,
        model=original.model,
        quantization=original.quantization,
        temperature=original.temperature,
        top_k=original.top_k,
        top_p=original.top_p,
        max_tokens=original.max_tokens,
        watermark_enabled=original.watermark_enabled,
        context_width=original.context_width,
        tournament_size=original.tournament_size,
        g_value=original.g_value,
        watermark_key=original.watermark_key,
        attack_type=payload.attack_type,
        attack_intensity=payload.attack_intensity,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.post("/{generation_id}/detections", response_model=DetectionOut)
async def create_detection(generation_id: int, db: Session = Depends(get_db)) -> Detection:
    gen = db.get(Generation, generation_id)
    if gen is None:
        raise HTTPException(status_code=404, detail="Generation not found")

    # Calculate BLEU if this is an attacked/modified text
    bleu_score = None
    if gen.original_id:
        original = db.get(Generation, gen.original_id)
        if original:
             # BLEU expects a list of reference strings
            bleu_score = sacrebleu.sentence_bleu(gen.output_text, [original.output_text]).score

    result = await detect_text(
        gen.output_text,
        gen.watermark_key,
        {
            "model": gen.model,
            "g_value": gen.g_value,
            "tournament_size": gen.tournament_size,
        }
    )

    row = Detection(
        generation_id=gen.generation_id,
        input_text=gen.output_text,
        is_watermarked=bool(result.get("is_watermarked")),
        z_score=result.get("z_score"),
        p_value=result.get("p_value"),
        confidence=result.get("confidence"),
        true_positive_rate=result.get("true_positive_rate"),
        false_positive_rate=result.get("false_positive_rate"),
        roc_auc=result.get("roc_auc"),
        bleu_score=bleu_score,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

