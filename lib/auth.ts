import "server-only";

import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { AuditAction, type AdminRole, LoginStatus } from "@prisma/client";

import { isTransientDatabaseError, prisma, readWithRetry } from "@/lib/prisma";
import { compareBackupCode, verifyTotpToken } from "@/lib/two-factor";

const SESSION_COOKIE_NAME = "admin_session";
const PENDING_2FA_COOKIE_NAME = "admin_pending_2fa";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PENDING_2FA_TTL_SECONDS = 60 * 5;

type AdminSessionPayload = {
  userId: string;
  role: AdminRole;
};

type PendingTwoFactorPayload = AdminSessionPayload & {
  purpose: "admin_2fa";
};

type RequestMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

type CurrentAdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  }

  return new TextEncoder().encode(secret);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function signToken(payload: AdminSessionPayload | PendingTwoFactorPayload, ttlSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(getAuthSecret());
}

async function signSessionToken(payload: AdminSessionPayload) {
  return signToken(payload, SESSION_TTL_SECONDS);
}

async function signPendingTwoFactorToken(payload: PendingTwoFactorPayload) {
  return signToken(payload, PENDING_2FA_TTL_SECONDS);
}

async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());

  if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
    return null;
  }

  return {
    userId: payload.userId,
    role: payload.role as AdminRole,
  };
}

async function verifyPendingTwoFactorToken(token: string) {
  const { payload } = await jwtVerify(token, getAuthSecret());

  if (
    payload.purpose !== "admin_2fa" ||
    typeof payload.userId !== "string" ||
    typeof payload.role !== "string"
  ) {
    return null;
  }

  return {
    userId: payload.userId,
    role: payload.role as AdminRole,
  };
}

async function writeLoginLog({
  userId,
  email,
  status,
  reason,
  metadata,
}: {
  userId?: string | null;
  email: string;
  status: LoginStatus;
  reason?: string;
  metadata?: RequestMetadata;
}) {
  await prisma.adminLoginLog.create({
    data: {
      userId,
      email,
      status,
      reason,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
    },
  });
}

async function writeAuditLog({
  userId,
  action,
  summary,
  metadata,
}: {
  userId: string;
  action: AuditAction;
  summary: string;
  metadata?: RequestMetadata;
}) {
  await prisma.adminAuditLog.create({
    data: {
      userId,
      action,
      entityType: "AdminUser",
      entityId: userId,
      summary,
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
    },
  });
}

async function createAdminSession({
  userId,
  role,
  email,
  metadata,
}: {
  userId: string;
  role: AdminRole;
  email: string;
  metadata?: RequestMetadata;
}) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const token = await signSessionToken({ userId, role });
  const tokenHash = hashSessionToken(token);

  await prisma.$transaction([
    prisma.adminSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
      },
    }),
    prisma.adminUser.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    }),
    prisma.adminLoginLog.create({
      data: {
        userId,
        email,
        status: LoginStatus.SUCCESS,
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        userId,
        action: AuditAction.LOGIN,
        entityType: "AdminUser",
        entityId: userId,
        summary: "Admin user signed in.",
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
      },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

async function createPendingTwoFactorSession(userId: string, role: AdminRole) {
  const expiresAt = new Date(Date.now() + PENDING_2FA_TTL_SECONDS * 1000);
  const token = await signPendingTwoFactorToken({ userId, role, purpose: "admin_2fa" });
  const cookieStore = await cookies();

  cookieStore.set(PENDING_2FA_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function login(email: string, password: string, metadata?: RequestMetadata) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !user.isActive) {
    await writeLoginLog({
      userId: user?.id ?? null,
      email: normalizedEmail,
      status: LoginStatus.FAILED,
      reason: user ? "Admin user is inactive." : "Admin user was not found.",
      metadata,
    });

    return { success: false, twoFactorRequired: false };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    await writeLoginLog({
      userId: user.id,
      email: normalizedEmail,
      status: LoginStatus.FAILED,
      reason: "Invalid password.",
      metadata,
    });

    return { success: false, twoFactorRequired: false };
  }

  if (user.twoFactorEnabled) {
    if (!user.twoFactorSecret) {
      await writeLoginLog({
        userId: user.id,
        email: normalizedEmail,
        status: LoginStatus.TWO_FACTOR_FAILED,
        reason: "2FA is enabled but no secret is configured.",
        metadata,
      });

      return { success: false, twoFactorRequired: false };
    }

    await createPendingTwoFactorSession(user.id, user.role);
    await writeLoginLog({
      userId: user.id,
      email: normalizedEmail,
      status: LoginStatus.TWO_FACTOR_REQUIRED,
      reason: "Password accepted; 2FA verification required.",
      metadata,
    });

    return { success: true, twoFactorRequired: true };
  }

  await createAdminSession({
    userId: user.id,
    role: user.role,
    email: normalizedEmail,
    metadata,
  });

  return { success: true, twoFactorRequired: false };
}

export async function verifyTwoFactorLogin(token: string, metadata?: RequestMetadata) {
  const cookieStore = await cookies();
  const pendingToken = cookieStore.get(PENDING_2FA_COOKIE_NAME)?.value;

  if (!pendingToken) {
    return { success: false };
  }

  const pendingPayload = await verifyPendingTwoFactorToken(pendingToken).catch(() => null);

  if (!pendingPayload) {
    cookieStore.delete(PENDING_2FA_COOKIE_NAME);
    return { success: false };
  }

  const user = await prisma.adminUser.findUnique({
    where: { id: pendingPayload.userId },
    include: { backupCodes: { where: { usedAt: null } } },
  });

  if (!user || !user.isActive || !user.twoFactorEnabled || !user.twoFactorSecret) {
    cookieStore.delete(PENDING_2FA_COOKIE_NAME);
    return { success: false };
  }

  const totpMatches = await verifyTotpToken(token, user.twoFactorSecret);
  let backupCodeId: string | null = null;

  if (!totpMatches) {
    for (const backupCode of user.backupCodes) {
      const matches = await compareBackupCode(token, backupCode.codeHash);

      if (matches) {
        backupCodeId = backupCode.id;
        break;
      }
    }
  }

  if (!totpMatches && !backupCodeId) {
    await prisma.$transaction([
      prisma.adminLoginLog.create({
        data: {
          userId: user.id,
          email: user.email,
          status: LoginStatus.TWO_FACTOR_FAILED,
          reason: "Invalid 2FA token or backup code.",
          ipAddress: metadata?.ipAddress ?? null,
          userAgent: metadata?.userAgent ?? null,
        },
      }),
      prisma.adminAuditLog.create({
        data: {
          userId: user.id,
          action: AuditAction.TWO_FACTOR_FAILED,
          entityType: "AdminUser",
          entityId: user.id,
          summary: "2FA verification failed during login.",
          ipAddress: metadata?.ipAddress ?? null,
          userAgent: metadata?.userAgent ?? null,
        },
      }),
    ]);

    return { success: false };
  }

  if (backupCodeId) {
    await prisma.adminBackupCode.update({
      where: { id: backupCodeId },
      data: { usedAt: new Date() },
    });
  }

  await prisma.adminAuditLog.create({
    data: {
      userId: user.id,
      action: backupCodeId ? AuditAction.BACKUP_CODE_USED : AuditAction.TWO_FACTOR_SUCCESS,
      entityType: "AdminUser",
      entityId: user.id,
      summary: backupCodeId ? "Backup code used during admin login." : "2FA verification succeeded during login.",
      ipAddress: metadata?.ipAddress ?? null,
      userAgent: metadata?.userAgent ?? null,
    },
  });

  await createAdminSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    metadata,
  });

  cookieStore.delete(PENDING_2FA_COOKIE_NAME);

  return { success: true };
}

export async function disableTwoFactorForCurrentUser(metadata?: RequestMetadata) {
  const user = await requireAdmin();

  await prisma.$transaction([
    prisma.adminUser.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorEnabledAt: null,
      },
    }),
    prisma.adminBackupCode.deleteMany({
      where: { adminId: user.id },
    }),
    prisma.adminAuditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.TWO_FACTOR_DISABLED,
        entityType: "AdminUser",
        entityId: user.id,
        summary: "2FA was disabled for admin user.",
        ipAddress: metadata?.ipAddress ?? null,
        userAgent: metadata?.userAgent ?? null,
      },
    }),
  ]);

  return { success: true };
}

export async function logout(metadata?: RequestMetadata) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    const session = await prisma.adminSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (session && !session.revokedAt) {
      await prisma.$transaction([
        prisma.adminSession.update({
          where: { id: session.id },
          data: { revokedAt: new Date() },
        }),
        prisma.adminAuditLog.create({
          data: {
            userId: session.userId,
            action: AuditAction.LOGOUT,
            entityType: "AdminUser",
            entityId: session.userId,
            summary: "Admin user signed out.",
            ipAddress: metadata?.ipAddress ?? session.ipAddress,
            userAgent: metadata?.userAgent ?? session.userAgent,
          },
        }),
      ]);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);

  return { success: true };
}

export async function getCurrentUser(): Promise<CurrentAdminUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token).catch(() => null);

  if (!payload) {
    return null;
  }

  const session = await readWithRetry(
    () =>
      prisma.adminSession.findUnique({
        where: { tokenHash: hashSessionToken(token) },
        include: { user: true },
      }),
    "admin session lookup",
  ).catch((error) => {
    if (isTransientDatabaseError(error)) {
      console.error("[auth] Admin session lookup failed after retry.", error);
      return null;
    }

    console.error("[auth] Admin session lookup failed.", error);
    return null;
  });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.user.isActive ||
    session.userId !== payload.userId
  ) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

export { PENDING_2FA_COOKIE_NAME, SESSION_COOKIE_NAME };
