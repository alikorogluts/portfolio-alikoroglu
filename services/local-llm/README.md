# Local Mac Model Smoke Service

This service is only for a MacBook-local smoke test of the portfolio assistant LoRA adapter. It does not add a production endpoint, chat UI, Docker, Ollama, vLLM, external API, vector database, or RAG layer.

## Artifact Location

Model artifacts must stay outside the repository:

```text
~/Documents/ai-experiments/portfolio-assistant-bilingual-qlora-smoke-v1/adapter
```

Required files:

- `adapter_model.safetensors`
- `adapter_config.json`
- `tokenizer.json`
- `tokenizer_config.json`
- `chat_template.jinja`

The adapter is experimental smoke-test output and is not considered production-ready.

## Setup

```bash
python3 -m venv services/local-llm/.venv
source services/local-llm/.venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r services/local-llm/requirements-macos.txt
```

## Preflight

```bash
pnpm local-llm:preflight
```

This checks Apple Silicon, MPS, RAM, disk space, adapter files, adapter SHA-256 values, and the Hugging Face cache path. CPU fallback is intentionally not used.

## Run

Terminal 1:

```bash
pnpm dev
```

Terminal 2:

```bash
source services/local-llm/.venv/bin/activate
PYTORCH_ENABLE_MPS_FALLBACK=1 pnpm local-llm:serve
```

Terminal 3:

```bash
pnpm assistant:local-model:smoke
```

The service binds only to `127.0.0.1:8000`.

## Production Note

This is only a local smoke test. A production assistant would require a separate GPU serving plan, security review, latency and memory testing, monitoring, and deployment architecture.
