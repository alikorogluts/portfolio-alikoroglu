import { Check, Inbox, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { deleteMessage, markMessageRead } from "../actions";
import { AdminShell } from "../admin-shell";
import { EmptyState, SectionCard, StatusBadge } from "../admin-ui";

type MessagesPageProps = {
  searchParams: Promise<{ q?: string; status?: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminMessagesPage({ searchParams }: MessagesPageProps) {
  await requireAdmin();
  const { q = "", status = "all" } = await searchParams;
  const query = q.trim();
  const messages = await prisma.contactMessage.findMany({
    where: {
      ...(status === "read" ? { isRead: true } : {}),
      ...(status === "unread" ? { isRead: false } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
              { subject: { contains: query, mode: "insensitive" } },
              { message: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell title="Messages" description="Manage messages submitted from the public contact form.">
      <SectionCard className="mb-5">
        <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Ad, email, konu veya mesaj ara"
              className="border-white/10 bg-black/30 pl-9 text-white placeholder:text-white/28"
            />
          </div>
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-white outline-none"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
          <Button type="submit" className="bg-white text-black hover:bg-white/85">
            Filter
          </Button>
        </form>
      </SectionCard>

      <div className="grid gap-4">
        {messages.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No messages found"
            description="No contact messages match the selected filter. New messages will appear here."
          />
        ) : null}

        {messages.map((message) => (
          <SectionCard key={message.id}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-medium text-white">{message.subject}</h2>
                  <StatusBadge tone={message.isRead ? "neutral" : "warning"}>{message.isRead ? "Read" : "New"}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-white/50">
                  {message.name} · {message.email} · {formatDate(message.createdAt)}
                </p>
                <div className="mt-4 rounded-md border border-white/10 bg-black/20 p-4">
                  <p className="max-w-4xl whitespace-pre-wrap text-sm leading-7 text-white/66">{message.message}</p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                {!message.isRead ? (
                  <form action={markMessageRead}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <Button variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
                      <Check className="mr-2 h-4 w-4" />
                      Read
                    </Button>
                  </form>
                ) : null}
                <form action={deleteMessage}>
                  <input type="hidden" name="messageId" value={message.id} />
                  <Button variant="outline" size="sm" className="border-red-400/20 bg-red-400/5 text-red-200 hover:bg-red-400/10 hover:text-red-100">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </form>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </AdminShell>
  );
}
