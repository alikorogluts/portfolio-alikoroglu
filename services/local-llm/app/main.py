from fastapi import FastAPI, HTTPException

from .model_runtime import BASE_MODEL_ID, ModelLoadError, runtime
from .schemas import GenerateRequest, GenerateResponse, HealthResponse

app = FastAPI(title="Portfolio Assistant Local Smoke Service", docs_url=None, redoc_url=None)


@app.on_event("startup")
def load_model_on_startup() -> None:
    try:
        runtime.load()
    except ModelLoadError as error:
        print(f"[local-llm] Model is not loaded: {error}")


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        ok=True,
        modelLoaded=runtime.model_loaded,
        adapterLoaded=runtime.adapter_loaded,
        baseModel=BASE_MODEL_ID,
        device="mps",
    )


@app.post("/generate", response_model=GenerateResponse)
def generate(request: GenerateRequest) -> GenerateResponse:
    try:
        answer, latency_ms = runtime.generate(
            question=request.question.strip(),
            language=request.language,
            runtime_context=request.runtimeContext,
        )
    except ModelLoadError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    if not answer:
        raise HTTPException(status_code=500, detail="Model returned an empty answer")

    return GenerateResponse(
        answer=answer,
        model=BASE_MODEL_ID,
        adapterLoaded=runtime.adapter_loaded,
        latencyMs=latency_ms,
    )
