import { NextResponse, type NextRequest } from "next/server";

import { disableTwoFactorForCurrentUser } from "@/lib/auth";

function getRequestMetadata(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  };
}

export async function POST(request: NextRequest) {
  const result = await disableTwoFactorForCurrentUser(getRequestMetadata(request));

  return NextResponse.json(result);
}
