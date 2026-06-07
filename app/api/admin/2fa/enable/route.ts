import { AuditAction } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBackupCode, hashBackupCode, verifyTotpToken } from "@/lib/two-factor";

const enableTwoFactorSchema = z.object({
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
  const currentUser = await requireAdmin();
  const body = await request.json().catch(() => null);
  const parsed = enableTwoFactorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: currentUser.id },
  });

  if (!admin || !admin.twoFactorSecret) {
    return NextResponse.json({ success: false, reason: "2FA setup is required first." }, { status: 400 });
  }

  const metadata = getRequestMetadata(request);
  const tokenMatches = await verifyTotpToken(parsed.data.token, admin.twoFactorSecret);

  if (!tokenMatches) {
    await prisma.adminAuditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.TWO_FACTOR_FAILED,
        entityType: "AdminUser",
        entityId: admin.id,
        summary: "2FA enable verification failed.",
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });

    return NextResponse.json({ success: false }, { status: 401 });
  }

  const backupCodes = Array.from({ length: 10 }, () => createBackupCode());
  const hashedBackupCodes = await Promise.all(
    backupCodes.map(async (code) => ({
      adminId: admin.id,
      codeHash: await hashBackupCode(code),
    })),
  );

  await prisma.$transaction([
    prisma.adminBackupCode.deleteMany({
      where: { adminId: admin.id },
    }),
    prisma.adminBackupCode.createMany({
      data: hashedBackupCodes,
    }),
    prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        twoFactorEnabled: true,
        twoFactorEnabledAt: new Date(),
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.TWO_FACTOR_ENABLED,
        entityType: "AdminUser",
        entityId: admin.id,
        summary: "2FA was enabled for admin user.",
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    backupCodes,
  });
}
