import Link from "next/link";
import { Activity } from "lucide-react";
import type { AuditAction } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "../admin-shell";
import { EmptyState, SectionCard, StatusBadge } from "../admin-ui";

const PAGE_SIZE = 100;

type AuditLogsPageProps = {
  searchParams: Promise<{ page?: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function getActionTone(action: AuditAction) {
  if (["DELETE", "TWO_FACTOR_FAILED", "TWO_FACTOR_DISABLED"].includes(action)) {
    return "danger" as const;
  }

  if (["TWO_FACTOR_ENABLED", "TWO_FACTOR_SUCCESS", "LOGIN", "BACKUP_CODE_USED"].includes(action)) {
    return "success" as const;
  }

  if (["UPDATE", "TWO_FACTOR_ENABLE", "TWO_FACTOR_DISABLE"].includes(action)) {
    return "warning" as const;
  }

  return "neutral" as const;
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  await requireAdmin();
  const { page: pageValue } = await searchParams;
  const page = Math.max(Number(pageValue ?? "1") || 1, 1);
  const [logs, totalCount] = await Promise.all([
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: {
          select: { email: true },
        },
      },
    }),
    prisma.adminAuditLog.count(),
  ]);
  const hasNextPage = page * PAGE_SIZE < totalCount;
  const previousHref = `/admin/audit-logs?page=${Math.max(page - 1, 1)}`;
  const nextHref = `/admin/audit-logs?page=${page + 1}`;

  return (
    <AdminShell title="Audit Logs" description="View recent admin actions and security events.">
      {logs.length === 0 ? (
        <EmptyState icon={Activity} title="No audit logs" description="Recent admin actions will appear here." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-white/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {logs.map((log) => (
                  <tr key={log.id} className="bg-white/[0.015] text-white/60 transition hover:bg-white/[0.04]">
                    <td className="px-4 py-4 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={getActionTone(log.action)}>{log.action}</StatusBadge>
                    </td>
                    <td className="px-4 py-4">{log.user?.email ?? "-"}</td>
                    <td className="px-4 py-4">{log.entityType}</td>
                    <td className="px-4 py-4 text-white/72">{log.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {logs.map((log) => (
              <SectionCard key={log.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-white/45">{formatDate(log.createdAt)}</p>
                    <h2 className="mt-2 text-base font-medium text-white">{log.entityType}</h2>
                  </div>
                  <StatusBadge tone={getActionTone(log.action)}>{log.action}</StatusBadge>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/65">{log.summary}</p>
                <p className="mt-3 truncate text-xs text-white/35">{log.user?.email ?? "-"}</p>
              </SectionCard>
            ))}
          </div>
        </>
      )}

      <SectionCard className="mt-5">
        <div className="flex flex-col gap-3 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Page {page} · Total {totalCount}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
                <Link href={previousHref}>Previous</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled className="border-white/10 bg-white/[0.03] text-white/35">
                Previous
              </Button>
            )}
            {hasNextPage ? (
              <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
                <Link href={nextHref}>Next</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled className="border-white/10 bg-white/[0.03] text-white/35">
                Next
              </Button>
            )}
          </div>
        </div>
      </SectionCard>
    </AdminShell>
  );
}
