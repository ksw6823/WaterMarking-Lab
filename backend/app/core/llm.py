from __future__ import annotations

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, PreTrainedTokenizer, PreTrainedModel
from app.core.config import settings

class LLMManager:
    _models: dict[str, PreTrainedModel] = {}
    _tokenizers: dict[str, PreTrainedTokenizer] = {}

    @classmethod
    def load_model(cls, model_name: str):
        if model_name in cls._models:
            return cls._models[model_name], cls._tokenizers[model_name]

        print(f"Loading model: {model_name}...")
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                device_map="auto",
                torch_dtype=torch.float16,
            )
            cls._models[model_name] = model
            cls._tokenizers[model_name] = tokenizer
            print(f"Model {model_name} loaded.")
            return model, tokenizer
        except Exception as e:
            print(f"Error loading model {model_name}: {e}")
            raise e

    @classmethod
    def get_model(cls, model_name: str):
        if model_name not in cls._models:
            return cls.load_model(model_name)
        return cls._models[model_name], cls._tokenizers[model_name]

llm_manager = LLMManager()
