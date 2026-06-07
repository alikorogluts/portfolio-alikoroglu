"use server";

import { AuditAction, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";
import { z } from "zod";

import { requireAdmin, SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(12, "New password must be at least 12 characters."),
    confirmPassword: z.string().min(1, "Please confirm the new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password confirmation does not match.",
    path: ["confirmPassword"],
  });

const emailChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newEmail: z.string().trim().toLowerCase().email("Enter a valid email address."),
});

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"),
    userAgent: headerStore.get("user-agent"),
  };
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function writeSessionAuditLog({
  userId,
  action,
  summary,
}: {
  userId: string;
  action?: AuditAction;
  summary: string;
}) {
  if (!action || !Object.values(AuditAction).includes(action)) {
    console.error("[security] Session audit log skipped because action is invalid.", {
      userId,
      action,
      summary,
    });
    return;
  }

  const metadata = await getRequestMetadata();

  await prisma.adminAuditLog.create({
    data: {
      userId,
      action,
      entityType: "AdminSession",
      summary,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });
}

async function writeAccountAuditLog({
  userId,
  action,
  summary,
  beforeJson,
  afterJson,
}: {
  userId: string;
  action: AuditAction;
  summary: string;
  beforeJson?: Prisma.InputJsonValue;
  afterJson?: Prisma.InputJsonValue;
}) {
  const metadata = await getRequestMetadata();

  await prisma.adminAuditLog.create({
    data: {
      userId,
      action,
      entityType: "AdminUser",
      entityId: userId,
      summary,
      beforeJson,
      afterJson,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithSecurityError(message: string): never {
  redirect(`/admin/security?error=${encodeURIComponent(message)}`);
}

async function verifyCurrentPassword(userId: string, currentPassword: string) {
  const admin = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      isActive: true,
    },
  });

  if (!admin || !admin.isActive) {
    return { ok: false as const, admin: null, message: "Admin account is not active." };
  }

  const passwordMatches = await bcrypt.compare(currentPassword, admin.passwordHash);

  if (!passwordMatches) {
    return { ok: false as const, admin, message: "Current password is incorrect." };
  }

  return { ok: true as const, admin };
}

export async function revokeOtherSessions() {
  const user = await requireAdmin();
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const currentTokenHash = currentToken ? hashSessionToken(currentToken) : null;
  const now = new Date();

  const result = await prisma.adminSession.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
      ...(currentTokenHash ? { tokenHash: { not: currentTokenHash } } : {}),
    },
    data: { revokedAt: now },
  });

  await writeSessionAuditLog({
    userId: user.id,
    action: AuditAction.SESSION_REVOKED,
    summary: `Revoked ${result.count} active admin session(s), keeping the current session.`,
  }).catch((error) => {
    console.error("[security] Failed to write session revoke audit log.", error);
  });

  revalidatePath("/admin/security");
  redirect("/admin/security?success=Other%20active%20sessions%20were%20revoked.");
}

export async function logoutFromAllDevices() {
  const user = await requireAdmin();
  const now = new Date();

  const result = await prisma.adminSession.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
    },
    data: { revokedAt: now },
  });

  await writeSessionAuditLog({
    userId: user.id,
    action: AuditAction.ALL_SESSIONS_REVOKED,
    summary: `Revoked ${result.count} active admin session(s), including the current session.`,
  }).catch((error) => {
    console.error("[security] Failed to write all-sessions revoke audit log.", error);
  });

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

export async function changePassword(formData: FormData) {
  const user = await requireAdmin();
  const parsed = passwordChangeSchema.safeParse({
    currentPassword: getString(formData, "currentPassword"),
    newPassword: getString(formData, "newPassword"),
    confirmPassword: getString(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    redirectWithSecurityError(parsed.error.issues[0]?.message ?? "Password could not be changed.");
  }

  const verified = await verifyCurrentPassword(user.id, parsed.data.currentPassword);

  if (!verified.ok) {
    redirectWithSecurityError(verified.message);
  }

  const samePassword = await bcrypt.compare(parsed.data.newPassword, verified.admin.passwordHash);

  if (samePassword) {
    redirectWithSecurityError("New password must be different from the current password.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const now = new Date();

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.adminSession.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: { revokedAt: now },
    }),
    prisma.adminAuditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.PASSWORD_CHANGED,
        entityType: "AdminUser",
        entityId: user.id,
        summary: "Admin password changed. All active sessions were revoked.",
      },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login?success=Password%20changed.%20Please%20sign%20in%20again.");
}

export async function changeEmail(formData: FormData) {
  const user = await requireAdmin();
  const parsed = emailChangeSchema.safeParse({
    currentPassword: getString(formData, "currentPassword"),
    newEmail: getString(formData, "newEmail"),
  });

  if (!parsed.success) {
    redirectWithSecurityError(parsed.error.issues[0]?.message ?? "Email could not be changed.");
  }

  const verified = await verifyCurrentPassword(user.id, parsed.data.currentPassword);

  if (!verified.ok) {
    redirectWithSecurityError(verified.message);
  }

  if (verified.admin.email === parsed.data.newEmail) {
    redirectWithSecurityError("New email must be different from the current email.");
  }

  const existingUser = await prisma.adminUser.findUnique({
    where: { email: parsed.data.newEmail },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== user.id) {
    redirectWithSecurityError("That email address is already used by another admin account.");
  }

  await prisma.adminUser.update({
    where: { id: user.id },
    data: { email: parsed.data.newEmail },
  });

  await writeAccountAuditLog({
    userId: user.id,
    action: AuditAction.EMAIL_CHANGED,
    summary: "Admin email address changed.",
    beforeJson: { email: verified.admin.email },
    afterJson: { email: parsed.data.newEmail },
  }).catch((error) => {
    console.error("[security] Failed to write email change audit log.", error);
  });

  revalidatePath("/admin/security");
  redirect("/admin/security?success=Email%20address%20updated.");
}
