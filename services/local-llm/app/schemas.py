from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    language: str = Field(pattern="^(tr|en)$")
    runtimeContext: str = Field(min_length=1, max_length=12000)


class GenerateResponse(BaseModel):
    answer: str
    model: str
    adapterLoaded: bool
    latencyMs: int


class HealthResponse(BaseModel):
    ok: bool
    modelLoaded: bool
    adapterLoaded: bool
    baseModel: str
    device: str
