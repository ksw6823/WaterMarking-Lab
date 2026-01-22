from __future__ import annotations

from typing import Any, Dict, Optional
import asyncio

# Default Constants
DEFAULT_NGRAM_LEN = 5
DEFAULT_SAMPLING_TABLE_SIZE = 65536
DEFAULT_SAMPLING_TABLE_SEED = 0
DEFAULT_CONTEXT_HISTORY_SIZE = 1024
DEFAULT_DEPTH = 3 

async def generate_text(input_text: str, params: Dict[str, Any]) -> str:
    """
    Mock implementation of generate_text for local testing.
    """
    model_name = params.get("model", "mock-model")
    await asyncio.sleep(1) # Simulate delay
    return f"[MOCK GENERATION] Output for: {input_text} (Model: {model_name})"

async def attack_text(text: str, attack_type: str, intensity: float) -> str:
    """
    Mock implementation of attack_text for local testing.
    """
    if not attack_type:
        return text
    
    await asyncio.sleep(0.5) # Simulate delay
    return f"[MOCK ATTACK: {attack_type} (Intensity: {intensity})] {text}"

async def detect_text(text: str, watermark_key: Optional[str], params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mock implementation of detect_text for local testing.
    """
    await asyncio.sleep(0.5) # Simulate delay
    
    # Deterministic mock result based on text length
    is_watermarked = "watermark" in text.lower() or len(text) % 2 == 0
    z_score = 4.5 if is_watermarked else 0.2
    p_value = 0.0001 if is_watermarked else 0.4
    confidence = 0.99 if is_watermarked else 0.1
    
    return {
        "is_watermarked": is_watermarked,
        "z_score": z_score,
        "p_value": p_value,
        "confidence": confidence,
        "true_positive_rate": 0.95,
        "false_positive_rate": 0.05,
        "roc_auc": 0.98,
        "bleu_score": 0.85,
    }
