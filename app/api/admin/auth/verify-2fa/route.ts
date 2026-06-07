import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { verifyTwoFactorLogin } from "@/lib/auth";

const verifyTwoFactorSchema = z.object({
  token: z.string().min(6),
});

function getRequestMetadata(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  };
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = verifyTwoFactorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const result = await verifyTwoFactorLogin(parsed.data.token, getRequestMetadata(request));

  return NextResponse.json({ success: result.success }, { status: result.success ? 200 : 401 });
}
