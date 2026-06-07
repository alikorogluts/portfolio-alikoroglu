import { ShieldCheck } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "../admin-shell";
import { SectionCard } from "../admin-ui";
import { SecurityPanel } from "./security-panel";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function SecurityPage() {
  const user = await requireAdmin();
  const [admin, sessions] = await Promise.all([
    prisma.adminUser.findUnique({
      where: { id: user.id },
      select: {
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
    <AdminShell title="Security" description="Manage 2FA, backup codes and active sessions.">
      <SecurityPanel twoFactorEnabled={admin?.twoFactorEnabled ?? false} />

      <SectionCard className="mt-6">
        <h2 className="text-lg font-medium">Active Sessions</h2>
        <p className="mt-2 text-sm text-white/45">
          2FA aktif tarihi: {admin?.twoFactorEnabledAt ? formatDate(admin.twoFactorEnabledAt) : "-"}
        </p>
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
