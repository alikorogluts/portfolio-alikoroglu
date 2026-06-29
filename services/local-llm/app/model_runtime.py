from __future__ import annotations

import json
import os
import time
import traceback
from pathlib import Path

import torch
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

from .prompt_builder import build_messages

BASE_MODEL_ID = "Qwen/Qwen3-4B-Instruct-2507"
DEFAULT_ADAPTER_DIR = (
    Path.home()
    / "Documents"
    / "ai-experiments"
    / "portfolio-assistant-bilingual-qlora-smoke-v1"
    / "adapter"
)


class ModelLoadError(RuntimeError):
    pass


class LocalModelRuntime:
    def __init__(self, adapter_dir: Path | None = None) -> None:
        self.adapter_dir = adapter_dir or Path(os.environ.get("PORTFOLIO_ASSISTANT_ADAPTER_DIR", DEFAULT_ADAPTER_DIR))
        self.tokenizer = None
        self.model = None
        self.adapter_loaded = False

    @property
    def model_loaded(self) -> bool:
        return self.model is not None and self.tokenizer is not None

    def validate_adapter(self) -> None:
        required = [
            "adapter_model.safetensors",
            "adapter_config.json",
        ]
        missing = [name for name in required if not (self.adapter_dir / name).is_file()]
        if missing:
            raise ModelLoadError(f"Missing adapter file(s): {', '.join(missing)}")

        adapter_model = self.adapter_dir / "adapter_model.safetensors"
        if adapter_model.stat().st_size <= 0:
            raise ModelLoadError("adapter_model.safetensors exists but is empty")

        config = json.loads((self.adapter_dir / "adapter_config.json").read_text())
        base_model = config.get("base_model_name_or_path")
        if base_model != BASE_MODEL_ID:
            raise ModelLoadError(f"Adapter base model mismatch: expected {BASE_MODEL_ID}, got {base_model}")

    def load(self) -> None:
        if self.model_loaded:
            return

        if not torch.backends.mps.is_built() or not torch.backends.mps.is_available():
            raise ModelLoadError("Apple Silicon MPS is required. CPU fallback is intentionally disabled.")

        try:
            self.validate_adapter()
            tokenizer_source = self.adapter_dir if (self.adapter_dir / "tokenizer.json").is_file() else BASE_MODEL_ID
            self.tokenizer = AutoTokenizer.from_pretrained(tokenizer_source, trust_remote_code=True)
            base_model = AutoModelForCausalLM.from_pretrained(
                BASE_MODEL_ID,
                torch_dtype=torch.float16,
                trust_remote_code=True,
                low_cpu_mem_usage=True,
            )
            self.model = PeftModel.from_pretrained(base_model, self.adapter_dir)
            self.model.to("mps")
            self.model.eval()
            self.adapter_loaded = True
        except ModelLoadError:
            raise
        except Exception as error:  # noqa: BLE001 - provide a concise friendly summary plus traceback.
            traceback.print_exc()
            raise ModelLoadError(f"Local model load failed: {error.__class__.__name__}: {error}") from error

    def generate(self, question: str, language: str, runtime_context: str) -> tuple[str, int]:
        self.load()
        assert self.model is not None
        assert self.tokenizer is not None

        started = time.perf_counter()
        messages = build_messages(question, language, runtime_context)
        prompt = self.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = self.tokenizer(prompt, return_tensors="pt").to("mps")

        with torch.inference_mode():
            output_ids = self.model.generate(
                **inputs,
                max_new_tokens=160,
                do_sample=False,
                pad_token_id=self.tokenizer.eos_token_id,
            )

        generated_ids = output_ids[0][inputs["input_ids"].shape[-1] :]
        answer = self.tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
        latency_ms = int((time.perf_counter() - started) * 1000)
        return answer, latency_ms


runtime = LocalModelRuntime()
