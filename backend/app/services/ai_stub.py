from __future__ import annotations

from typing import Any, Dict, Optional


async def generate_text(input_text: str, params: Dict[str, Any]) -> str:
    # TODO(AI팀): 실제 모델/워터마킹 생성으로 교체
    wm = "wm:on" if params.get("watermark_enabled") else "wm:off"
    return f"[stub:{wm}] {input_text}"


async def attack_text(text: str, attack_type: str, intensity: float) -> str:
    # TODO(AI팀): 실제 공격 시뮬레이터로 교체
    return f"[attack:{attack_type}:{intensity}] {text}"


async def detect_text(text: str, watermark_key: Optional[str], params: Dict[str, Any]) -> Dict[str, Any]:
    # TODO(AI팀): 실제 SynthID 탐지로 교체
    # 최소 응답 규격만 맞춤.
    return {
        "is_watermarked": True if watermark_key else False,
        "z_score": 3.5 if watermark_key else 0.1,
        "p_value": 0.0004 if watermark_key else 0.9,
        "confidence": 0.95 if watermark_key else 0.1,
        "true_positive_rate": 0.94 if watermark_key else None,
        "false_positive_rate": 0.02 if watermark_key else None,
        "roc_auc": 0.96 if watermark_key else None,
        "bleu_score": None,
    }

