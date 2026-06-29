from __future__ import annotations

import hashlib
import json
import platform
import shutil
import subprocess
import sys
from pathlib import Path

BASE_MODEL_ID = "Qwen/Qwen3-4B-Instruct-2507"
ADAPTER_DIR = (
    Path.home()
    / "Documents"
    / "ai-experiments"
    / "portfolio-assistant-bilingual-qlora-smoke-v1"
    / "adapter"
)
REQUIRED_FILES = [
    "adapter_model.safetensors",
    "adapter_config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "chat_template.jinja",
]


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def get_total_ram_gb() -> float | None:
    if platform.system() == "Darwin":
        output = subprocess.check_output(["sysctl", "-n", "hw.memsize"], text=True).strip()
        return int(output) / 1024**3
    return None


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    machine = platform.machine()
    disk_free_gb = shutil.disk_usage(Path.home()).free / 1024**3
    ram_gb = get_total_ram_gb()
    hf_cache = Path.home() / ".cache" / "huggingface"

    print(f"python={sys.version.split()[0]}")
    print(f"machine={machine}")
    print(f"adapterDir={ADAPTER_DIR}")
    print(f"huggingFaceCache={hf_cache}")
    print(f"diskFreeGb={disk_free_gb:.2f}")
    if ram_gb is not None:
        print(f"physicalRamGb={ram_gb:.2f}")
        if ram_gb < 16:
            warnings.append("Physical RAM is below 16 GB; Qwen3-4B + LoRA smoke may be unreliable.")

    if machine != "arm64":
        errors.append("Apple Silicon arm64 is required for this local MPS smoke path.")

    if disk_free_gb < 25:
        warnings.append("Free disk space is below 25 GB; model download/cache may fail.")

    try:
        import torch

        print(f"torch={torch.__version__}")
        print(f"mpsBuilt={torch.backends.mps.is_built()}")
        print(f"mpsAvailable={torch.backends.mps.is_available()}")
        if not torch.backends.mps.is_built() or not torch.backends.mps.is_available():
            errors.append("PyTorch MPS is not available. CPU fallback is intentionally disabled.")
    except Exception as error:  # noqa: BLE001 - preflight should summarize missing deps.
        errors.append(f"Could not import torch or inspect MPS: {error}")

    if not ADAPTER_DIR.is_dir():
        errors.append(f"Adapter directory is missing: {ADAPTER_DIR}")
    else:
        for name in REQUIRED_FILES:
            path = ADAPTER_DIR / name
            if not path.is_file():
                errors.append(f"Missing adapter file: {name}")
                continue
            size = path.stat().st_size
            print(f"artifact {name} size={size} sha256={sha256_file(path)}")
            if name == "adapter_model.safetensors" and size <= 0:
                errors.append("adapter_model.safetensors exists but is empty.")

        config_path = ADAPTER_DIR / "adapter_config.json"
        if config_path.is_file():
            config = json.loads(config_path.read_text())
            base_model = config.get("base_model_name_or_path")
            print(f"adapterBaseModel={base_model}")
            if base_model != BASE_MODEL_ID:
                errors.append(f"Adapter base model mismatch: expected {BASE_MODEL_ID}, got {base_model}")

    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
