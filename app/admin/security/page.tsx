import { ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "../admin-shell";
import { FieldDescription, SectionCard } from "../admin-ui";
import { AdminFeedback, ConfirmSubmitButton, SubmitButton } from "../form-controls";
import { changeEmail, changePassword, logoutFromAllDevices, revokeOtherSessions } from "./actions";
import { SecurityPanel } from "./security-panel";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

type SecurityPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  const user = await requireAdmin();
  const { success, error } = await searchParams;
  const [admin, sessions] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: user.id },
      select: {
        email: true,
        name: true,
        twoFactorEnabled: true,
        twoFactorEnabledAt: true,
      },
    }),
    prisma.adminSession.findMany({
      where: {
        userId: user.id,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <AdminShell title="Security" description="Manage account credentials, 2FA, backup codes and active sessions.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard>
          <div className="mb-5">
            <h2 className="text-lg font-medium">Change Password</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Enter your current password before setting a new one. All sessions will be revoked after this change.
            </p>
          </div>
          <form action={changePassword} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="password-current" className="text-white/65">Current Password</Label>
              <Input
                id="password-current"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
                placeholder="Current password"
              />
              <FieldDescription>Required to verify this account change.</FieldDescription>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white/65">New Password</Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
                  placeholder="At least 12 characters"
                />
                <FieldDescription>Use a unique password with at least 12 characters.</FieldDescription>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white/65">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                  className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
                  placeholder="Repeat new password"
                />
                <FieldDescription>You will be sent back to login after saving.</FieldDescription>
              </div>
            </div>
            <SubmitButton pendingLabel="Changing password..." className="justify-self-end">
              Change Password
            </SubmitButton>
          </form>
        </SectionCard>

        <SectionCard>
          <div className="mb-5">
            <h2 className="text-lg font-medium">Change Email</h2>
            <p className="mt-2 text-sm leading-6 text-white/45">
              Current admin email: <span className="text-white/75">{admin?.email ?? user.email}</span>
            </p>
          </div>
          <form action={changeEmail} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-current-password" className="text-white/65">Current Password</Label>
              <Input
                id="email-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
                className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
                placeholder="Current password"
              />
              <FieldDescription>Required before changing the login email.</FieldDescription>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email" className="text-white/65">New Email</Label>
              <Input
                id="new-email"
                name="newEmail"
                type="email"
                autoComplete="email"
                required
                className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
                placeholder="admin@example.com"
              />
              <FieldDescription>This becomes the email used for future admin login.</FieldDescription>
            </div>
            <ConfirmSubmitButton
              title="Change admin email?"
              description="Are you sure? Future admin login will use this new email address."
              confirmLabel="Change email"
              className="justify-self-end border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"
            >
              Change Email
            </ConfirmSubmitButton>
          </form>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SecurityPanel twoFactorEnabled={admin?.twoFactorEnabled ?? false} />
      </div>

      <SectionCard className="mt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-medium">Active Sessions</h2>
            <p className="mt-2 text-sm text-white/45">
              2FA enabled at: {admin?.twoFactorEnabledAt ? formatDate(admin.twoFactorEnabledAt) : "-"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <form action={revokeOtherSessions}>
              <ConfirmSubmitButton
                size="sm"
                title="Are you sure?"
                description="Are you sure? This will sign out all active sessions."
                confirmLabel="Revoke sessions"
                className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"
              >
                Revoke all sessions except this one
              </ConfirmSubmitButton>
            </form>
            <form action={logoutFromAllDevices}>
              <ConfirmSubmitButton
                size="sm"
                title="Are you sure?"
                description="Are you sure? This will sign out all active sessions."
                confirmLabel="Logout from all devices"
              >
                Logout from all devices
              </ConfirmSubmitButton>
            </form>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-md border border-white/10 bg-black/20 p-4 text-sm text-white/55">
              <p className="text-white/75">IP: {session.ipAddress ?? "-"}</p>
              <p className="mt-2">Created: {formatDate(session.createdAt)}</p>
              <p className="mt-1">Expires: {formatDate(session.expiresAt)}</p>
              <p className="mt-2 truncate text-xs text-white/35">User Agent: {session.userAgent ?? "-"}</p>
            </div>
          ))}
          {sessions.length === 0 ? (
            <div className="rounded-md border border-white/10 bg-black/20 p-5 text-sm text-white/45">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-white/40" />
                No active sessions found.
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </AdminShell>
  );
}
