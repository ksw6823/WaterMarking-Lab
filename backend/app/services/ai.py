from __future__ import annotations

from typing import Any, Dict, Optional, Sequence
import torch
import numpy as np
from transformers import LogitsProcessorList
from synthid_text import logits_processing

from app.core.llm import llm_manager

# Default Constants
DEFAULT_NGRAM_LEN = 5
DEFAULT_SAMPLING_TABLE_SIZE = 65536 * 4  # Increased to 262144 to safely cover Llama-3 vocab (128k)
DEFAULT_SAMPLING_TABLE_SEED = 0
DEFAULT_CONTEXT_HISTORY_SIZE = 1024
DEFAULT_DEPTH = 3 

def _get_keys(key_seed: int, depth: int) -> Sequence[int]:
    """Generate reproducible keys based on a seed."""
    rng = np.random.RandomState(key_seed)
    # Generate arbitrary 64-bit integers as keys
    # ensure they are python ints
    return [int(x) for x in rng.randint(0, 2**30, size=depth).tolist()] # Using 30 to stay safe? logits_processor takes Sequence[int] and converts to tensor.

async def generate_text(input_text: str, params: Dict[str, Any]) -> str:
    raw_model_name = params.get("model", "google/gemma-2b-it")
    
    # Model Name Mapping (Frontend shortname -> HuggingFace ID)
    MODEL_MAPPING = {
        "Llama-3-8B": "meta-llama/Meta-Llama-3-8B-Instruct",
        "Gemma-2-2B": "google/gemma-2b-it",
    }
    model_name = MODEL_MAPPING.get(raw_model_name, raw_model_name)
    
    # Load Model
    model, tokenizer = llm_manager.get_model(model_name)
    device = model.device
    
    # Prepare Inputs
    # Use Chat Template for Llama-3-Instruct or compatible models
    # Added "gemma" and "it" to cover Gemma-2-2B-IT
    if any(keyword in model_name.lower() for keyword in ["instruct", "chat", "llama-3", "gemma", "it"]):
        messages = [
            {"role": "user", "content": f"다음 질문에 대해 반드시 한국어로 답변해줘: {input_text}"},
        ]
        # Some models don't support system prompts well in their template, so we force it in the user prompt for Gemma/Others
        if "llama-3" in model_name.lower():
             messages = [
                {"role": "system", "content": "You are a helpful assistant. Please always answer in Korean."},
                {"role": "user", "content": input_text},
            ]
        
        input_ids = tokenizer.apply_chat_template(
            messages, 
            add_generation_prompt=True, 
            return_tensors="pt"
        ).to(device)
    else:
        # Fallback: append Korean instruction to raw text
        prompt = f"{input_text}\n\n(한국어로 답변해주세요)"
        input_ids = tokenizer.encode(prompt, return_tensors="pt").to(device)

    # Attention Mask (Important for Llama 3)
    attention_mask = torch.ones_like(input_ids).to(device)
    
    # Generation Config
    max_tokens = params.get("max_tokens") or 100
    temperature = params.get("temperature") or 0.7
    top_k = params.get("top_k") or 40
    top_p = params.get("top_p") or 0.9

    # Define terminators for Llama 3
    terminators = [tokenizer.eos_token_id]
    
    # Llama 3 uses <|eot_id|> to end turns
    eot_id = tokenizer.convert_tokens_to_ids("<|eot_id|>")
    if isinstance(eot_id, int):
        terminators.append(eot_id)
    
    gen_kwargs = {
        "max_new_tokens": max_tokens,
        "temperature": temperature,
        "do_sample": True,
        "pad_token_id": tokenizer.eos_token_id,
        "eos_token_id": terminators,
        "attention_mask": attention_mask,
    }
    if top_k: gen_kwargs["top_k"] = top_k
    if top_p: gen_kwargs["top_p"] = top_p
    
    # Watermark Setup
    watermark_enabled = params.get("watermark_enabled", False)
    logits_processor_list = LogitsProcessorList()
    
    if watermark_enabled:
        # SynthID Config
        wm_key_str = params.get("watermark_key") or "12345"
        # simple hash to int
        wm_key_int = int(sum(ord(c) for c in wm_key_str)) 
        
        # Use fixed depth (layers)
        keys = _get_keys(wm_key_int, depth=DEFAULT_DEPTH)
        
        # Custom wrapper to match HuggingFace LogitsProcessor API
        class HFWrapper(logits_processing.SynthIDLogitsProcessor):
            def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor) -> torch.FloatTensor:
                # Cast to float32 for stability during watermark calculation
                original_dtype = scores.dtype
                scores_f32 = scores.to(torch.float32)
                
                # watermarked_call logic (SynthID)
                updated_scores_top_k, top_k_indices, _ = self.watermarked_call(input_ids, scores_f32)
                
                # We need to scatter these back to the full vocabulary scores.
                # Initialize with -inf so that only the top_k indices are selectable
                new_scores = torch.full_like(scores_f32, -float('inf'))
                new_scores.scatter_(1, top_k_indices, updated_scores_top_k)
                
                # Cast back to original dtype (e.g., float16)
                return new_scores.to(original_dtype)

        processor = HFWrapper(
            ngram_len=DEFAULT_NGRAM_LEN,
            keys=keys,
            sampling_table_size=DEFAULT_SAMPLING_TABLE_SIZE,
            sampling_table_seed=DEFAULT_SAMPLING_TABLE_SEED,
            context_history_size=DEFAULT_CONTEXT_HISTORY_SIZE,
            temperature=1.0, # Pass 1.0 to avoid double temperature scaling if SynthID applies it internally
            top_k=int(top_k),
            device=device,
        )
        logits_processor_list.append(processor)

    # Generate
    with torch.no_grad():
        outputs = model.generate(
            input_ids,
            logits_processor=logits_processor_list,
            **gen_kwargs
        )
    
    # Decode (skip input prompt)
    generated_ids = outputs[0][len(input_ids[0]):]
    output_text = tokenizer.decode(generated_ids, skip_special_tokens=True)
    
    return output_text


async def attack_text(text: str, attack_type: str, intensity: float) -> str:
    # Basic Stub for attacks
    if not attack_type:
        return text

    if attack_type == "deletion":
        # Simulate deleting % of characters
        length = len(text)
        num_delete = int(length * intensity)
        if num_delete > 0:
            import random
            indices = set(random.sample(range(length), num_delete))
            return "".join([c for i, c in enumerate(text) if i not in indices])
    
    elif attack_type == "substitution":
        # Simulate substitution
        import random
        import string
        length = len(text)
        num_sub = int(length * intensity)
        chars = list(text)
        for _ in range(num_sub):
            idx = random.randint(0, length - 1)
            chars[idx] = random.choice(string.ascii_letters)
        return "".join(chars)
        
    return text


async def detect_text(text: str, watermark_key: Optional[str], params: Dict[str, Any]) -> Dict[str, Any]:
    raw_model_name = params.get("model", "google/gemma-2b-it")
    
    # Model Name Mapping (Frontend shortname -> HuggingFace ID)
    MODEL_MAPPING = {
        "Llama-3-8B": "meta-llama/Meta-Llama-3-8B-Instruct",
        "Gemma-2-2B": "google/gemma-2b-it",
    }
    model_name = MODEL_MAPPING.get(raw_model_name, raw_model_name)

    model, tokenizer = llm_manager.get_model(model_name)
    device = model.device
    
    wm_key_str = watermark_key or "12345"
    wm_key_int = int(sum(ord(c) for c in wm_key_str)) 
    keys = _get_keys(wm_key_int, depth=DEFAULT_DEPTH)
    
    # We instantiate the processor JUST to use its helper computation methods.
    # The temp/top_k here don't affect compute_g_values, but are required for init.
    processor = logits_processing.SynthIDLogitsProcessor(
        ngram_len=DEFAULT_NGRAM_LEN,
        keys=keys,
        sampling_table_size=DEFAULT_SAMPLING_TABLE_SIZE,
        sampling_table_seed=DEFAULT_SAMPLING_TABLE_SEED,
        context_history_size=DEFAULT_CONTEXT_HISTORY_SIZE,
        temperature=1.0, 
        top_k=40,
        device=device,
    )
    
    # Encode text
    # Note: Detector usually runs on the FULL text (including prompt? or just generation?)
    # Usually just generation. But context matters for ngram.
    # If we only have the output text, we treat it as the sequence.
    input_ids = tokenizer.encode(text, return_tensors="pt").to(device)
    
    if input_ids.shape[1] < DEFAULT_NGRAM_LEN:
        return {
            "is_watermarked": False,
            "z_score": 0.0,
            "confidence": 0.0
        }

    # Compute masks and g-values
    # g_values shape: [batch_size, seq_len - (ngram_len - 1), depth]
    g_values = processor.compute_g_values(input_ids)
    
    # Compute relevant masks
    context_repetition_mask = processor.compute_context_repetition_mask(input_ids)
    # eos_mask usually to ignore padding/eos. Since we have raw text, maybe just rely on tokenization.
    # But compute_eos_token_mask requires eos_token_id.
    eos_token_mask = processor.compute_eos_token_mask(input_ids, tokenizer.eos_token_id)
    # Truncate eos mask to match g_values shape which is shorter by ngram_len-1
    eos_token_mask = eos_token_mask[:, DEFAULT_NGRAM_LEN - 1 :]
    
    # Combine masks: we want tokens that are NOT repetition and NOT eos
    # context_repetition_mask matches g_values shape
    combined_mask = context_repetition_mask * eos_token_mask
    
    # Calculate Mean Score
    # We masked out invalid g-values.
    # g_values is 0 or 1.
    
    # Flatten everything valid
    mask_bool = combined_mask.bool()
    valid_g_values = g_values[mask_bool.unsqueeze(-1).expand_as(g_values)] 
    # This flattening might be tricky if depth > 1. 
    # We want mean across depth too? 
    # Yes, SynthID mean score usually averages across depth too for the simplest scalar score.
    
    if valid_g_values.numel() == 0:
        return {
            "is_watermarked": False,
            "z_score": 0.0,
            "confidence": 0.0
        }
        
    mean_score = valid_g_values.float().mean().item()
    count = valid_g_values.numel()
    
    # Z-Score Calculation (assuming unwatermarked mean is 0.5)
    # Standard Error = 0.5 / sqrt(N)
    # Z = (Mean - 0.5) / SE
    std_error = 0.5 / np.sqrt(count)
    z_score = (mean_score - 0.5) / std_error
    
    # Simple p-value (one-sided)
    import scipy.stats
    p_value = scipy.stats.norm.sf(z_score)
    
    is_watermarked = z_score > 3.0 # Threshold
    
    return {
        "is_watermarked": bool(is_watermarked),
        "z_score": float(z_score),
        "p_value": float(p_value),
        "confidence": float(1.0 - p_value), # rough proxy
        "true_positive_rate": None,
        "false_positive_rate": None,
        "roc_auc": None,
        "bleu_score": None,
    }
