import Link from "next/link";
import { Activity, ArrowRight, FolderKanban, KeyRound, Mail, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "./admin-shell";
import { MiniBarChart, SectionCard, StatCard, StatusBadge } from "./admin-ui";

function formatDate(date: Date | null) {
  if (!date) {
    return "None yet";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getLastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date;
  });
}

export default async function AdminDashboardPage() {
  const user = await requireAdmin();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    projectCount,
    publishedProjectCount,
    messageCount,
    unreadMessageCount,
    failedLoginCount,
    currentAdmin,
    recentAuditLogs,
    recentLoginLogs,
    loginActivity,
  ] = await Promise.all([
    prisma.portfolioProject.count(),
    prisma.portfolioProject.count({ where: { isPublished: true } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.adminLoginLog.count({
      where: {
        status: { in: ["FAILED", "TWO_FACTOR_FAILED", "LOCKED"] },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.adminUser.findUnique({
      where: { id: user.id },
      select: { lastLoginAt: true, twoFactorEnabled: true },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { email: true } } },
    }),
    prisma.adminLoginLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.adminLoginLog.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  const loginChart = getLastSevenDays().map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    return {
      label: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(day),
      value: loginActivity.filter((log) => log.createdAt >= day && log.createdAt < nextDay).length,
    };
  });

  return (
    <AdminShell title="Dashboard" description={`${user.email} signed in with ${user.role.toLowerCase()} access.`}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={projectCount.toString()}
          description={`${publishedProjectCount} projects published`}
          icon={FolderKanban}
          tone="neutral"
        />
        <StatCard
          label="Total Messages"
          value={messageCount.toString()}
          description={`${unreadMessageCount} unread messages`}
          icon={Mail}
          tone={unreadMessageCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Failed Attempts"
          value={failedLoginCount.toString()}
          description="Risky attempts in the last 24 hours"
          icon={ShieldAlert}
          tone={failedLoginCount > 0 ? "danger" : "success"}
        />
        <StatCard
          label="Last Login"
          value={formatDate(currentAdmin?.lastLoginAt ?? null)}
          description="Last successful admin session"
          icon={KeyRound}
          tone="neutral"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-medium">Login Activity</h2>
              <p className="mt-1 text-sm text-white/45">Admin login activity over the last 7 days</p>
            </div>
            <StatusBadge tone="neutral">7 days</StatusBadge>
          </div>
          <div className="mt-6">
            <MiniBarChart values={loginChart} tone="success" />
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="text-lg font-medium">Message / Project Summary</h2>
          <p className="mt-1 text-sm text-white/45">Content volume and inbox overview</p>
          <div className="mt-6">
            <MiniBarChart
              values={[
                { label: "Projects", value: projectCount },
                { label: "Published", value: publishedProjectCount },
                { label: "Messages", value: messageCount },
                { label: "New", value: unreadMessageCount },
              ]}
              tone="neutral"
            />
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <SectionCard className="xl:col-span-1">
          <h2 className="text-lg font-medium">Security Status</h2>
          <div className="mt-4 flex items-center justify-between rounded-md border border-white/10 bg-black/20 p-4">
            <div>
              <p className="text-sm text-white/45">Google Authenticator</p>
              <p className="mt-1 text-base text-white">{currentAdmin?.twoFactorEnabled ? "2FA active" : "2FA disabled"}</p>
            </div>
            <StatusBadge tone={currentAdmin?.twoFactorEnabled ? "success" : "warning"}>
              {currentAdmin?.twoFactorEnabled ? "Secure" : "Recommended"}
            </StatusBadge>
          </div>
          <Button asChild className="mt-4 w-full bg-white text-black hover:bg-white/85">
            <Link href="/admin/security">
              Manage Security
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </SectionCard>

        <SectionCard>
          <h2 className="text-lg font-medium">Recent Login Attempts</h2>
          <div className="mt-4 grid gap-3">
            {recentLoginLogs.map((log) => (
              <div key={log.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm text-white/75">{log.email}</p>
                  <StatusBadge tone={log.status === "SUCCESS" ? "success" : log.status === "TWO_FACTOR_REQUIRED" ? "warning" : "danger"}>
                    {log.status}
                  </StatusBadge>
                </div>
                <p className="mt-2 text-xs text-white/35">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="text-lg font-medium">Recent Audit Logs</h2>
          <div className="mt-4 grid gap-3">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/75">{log.action}</p>
                  <Activity className="h-4 w-4 text-white/35" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/45">{log.summary}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium">Quick Actions</h2>
            <p className="mt-1 text-sm text-white/45">Frequently used admin actions</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
              <Link href="/admin/projects/new">New Project</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
              <Link href="/admin/messages">Open Messages</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
              <Link href="/admin/audit-logs">View Logs</Link>
            </Button>
          </div>
        </div>
      </SectionCard>
    </AdminShell>
  );
}
