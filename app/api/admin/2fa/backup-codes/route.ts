import { AuditAction } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBackupCode, hashBackupCode } from "@/lib/two-factor";

function getRequestMetadata(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  };
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  const admin = await prisma.adminUser.findUnique({
    where: { id: user.id },
    select: { id: true, twoFactorEnabled: true },
  });

  if (!admin?.twoFactorEnabled) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const backupCodes = Array.from({ length: 10 }, () => createBackupCode());
  const hashedBackupCodes = await Promise.all(
    backupCodes.map(async (code) => ({
      adminId: admin.id,
      codeHash: await hashBackupCode(code),
    })),
  );
  const metadata = getRequestMetadata(request);

  await prisma.$transaction([
    prisma.adminBackupCode.deleteMany({
      where: { adminId: admin.id },
    }),
    prisma.adminBackupCode.createMany({
      data: hashedBackupCodes,
    }),
    prisma.adminAuditLog.create({
      data: {
        userId: admin.id,
        action: AuditAction.UPDATE,
        entityType: "AdminBackupCode",
        entityId: admin.id,
        summary: "2FA backup codes were regenerated.",
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    }),
  ]);

  return NextResponse.json({ success: true, backupCodes });
}
