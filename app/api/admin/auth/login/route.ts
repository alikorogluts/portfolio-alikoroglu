import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { login } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const result = await login(parsed.data.email, parsed.data.password, getRequestMetadata(request));

  return NextResponse.json(
    {
      success: result.success,
      twoFactorRequired: result.twoFactorRequired,
    },
    { status: result.success ? 200 : 401 },
  );
}
