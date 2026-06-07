import { AuditAction } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createQrCodeDataUrl, createTwoFactorSecret, encryptTwoFactorSecret } from "@/lib/two-factor";

function getRequestMetadata(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  };
}

export async function POST(request: NextRequest) {
  const currentUser = await requireAdmin();
  const admin = await prisma.adminUser.findUnique({
    where: { id: currentUser.id },
  });

  if (!admin || !admin.isActive) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  if (admin.twoFactorEnabled) {
    return NextResponse.json({ success: false, reason: "2FA is already enabled." }, { status: 409 });
  }

  const { secret, otpauthUrl } = createTwoFactorSecret(admin.email);
  const qrCode = await createQrCodeDataUrl(otpauthUrl);
  const metadata = getRequestMetadata(request);

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        twoFactorSecret: encryptTwoFactorSecret(secret),
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.TWO_FACTOR_ENABLE,
        entityType: "AdminUser",
        entityId: admin.id,
        summary: "2FA setup was started for admin user.",
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    qrCode,
    manualCode: secret,
  });
}
