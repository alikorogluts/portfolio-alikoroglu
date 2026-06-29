import { NextResponse, type NextRequest } from "next/server";

import { getAssistantContext } from "@/lib/ai/assistant-context";
import { formatAssistantRuntimeContext } from "@/lib/ai/assistant-context-format";

export const runtime = "nodejs";

const SENSITIVE_PATTERN = /(@|\+90|DATABASE_URL|postgresql:\/\/|password|token)/i;

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const question = request.nextUrl.searchParams.get("question")?.trim() ?? "";

  if (!question) {
    return NextResponse.json({ message: "question is required" }, { status: 400 });
  }

  if (question.length > 500) {
    return NextResponse.json({ message: "question must be 500 characters or fewer" }, { status: 400 });
  }

  const context = await getAssistantContext(question);
  const formattedContext = formatAssistantRuntimeContext(context);
  const responseBody = {
    context,
    formattedContext,
  };

  if (SENSITIVE_PATTERN.test(JSON.stringify(responseBody))) {
    return NextResponse.json({ message: "Unsafe context was blocked" }, { status: 500 });
  }

  return NextResponse.json(responseBody);
}
