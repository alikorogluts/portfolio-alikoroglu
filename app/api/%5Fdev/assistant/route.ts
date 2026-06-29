import { NextResponse, type NextRequest } from "next/server";

import { getAssistantContext } from "@/lib/ai/assistant-context";
import { formatAssistantRuntimeContext } from "@/lib/ai/assistant-context-format";

export const runtime = "nodejs";

const DEFAULT_LOCAL_LLM_SERVICE_URL = "http://127.0.0.1:8000";
const LOCAL_MODEL_TIMEOUT_MS = 120_000;
const SENSITIVE_PATTERN =
  /(@|(?:\+?\d[\s().-]*){10,}|DATABASE_URL|postgresql:\/\/|password|token|secret|api[_-]?key)/i;

type LocalModelResponse = {
  answer?: unknown;
  latencyMs?: unknown;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function readQuestion(body: unknown) {
  if (typeof body !== "object" || body === null || !("question" in body)) {
    return "";
  }

  return String((body as { question: unknown }).question).trim();
}

function methodNotAllowed() {
  if (process.env.NODE_ENV !== "development") {
    return jsonError("Not found", 404);
  }

  return jsonError("Method not allowed", 405);
}

function getLocalModelBaseUrl() {
  return (process.env.LOCAL_LLM_SERVICE_URL?.trim() || DEFAULT_LOCAL_LLM_SERVICE_URL).replace(/\/+$/, "");
}

async function postToLocalModel(question: string, language: string, runtimeContext: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LOCAL_MODEL_TIMEOUT_MS);

  try {
    const response = await fetch(`${getLocalModelBaseUrl()}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        language,
        runtimeContext,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error("Local model service returned an error");
    }

    return (await response.json()) as LocalModelResponse;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return jsonError("Not found", 404);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Geçersiz istek.", 400);
  }

  const question = readQuestion(body);

  if (!question) {
    return jsonError("Soru boş olamaz.", 400);
  }

  if (question.length > 500) {
    return jsonError("Soru 500 karakterden kısa olmalı.", 400);
  }

  try {
    const startedAt = Date.now();
    const context = await getAssistantContext(question);
    const runtimeContext = formatAssistantRuntimeContext(context);
    const modelResponse = await postToLocalModel(question, context.language, runtimeContext);
    const answer = typeof modelResponse.answer === "string" ? modelResponse.answer.trim() : "";

    if (!answer) {
      return jsonError("Yerel model şu anda cevap üretemedi.", 503);
    }

    if (SENSITIVE_PATTERN.test(answer)) {
      return jsonError("Bu cevabı güvenli şekilde gösteremiyorum.", 503);
    }

    return NextResponse.json({
      answer,
      language: context.language,
      latencyMs: typeof modelResponse.latencyMs === "number" ? modelResponse.latencyMs : Date.now() - startedAt,
    });
  } catch {
    return jsonError("Yerel model servisine ulaşılamıyor.", 503);
  }
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
