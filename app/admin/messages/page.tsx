import { Archive, Check, Inbox, MailOpen, Trash2 } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { archiveMessage, deleteMessage, markMessageRead, markMessageUnread } from "../actions";
import { AdminShell } from "../admin-shell";
import { EmptyState, FieldDescription, SectionCard, StatusBadge } from "../admin-ui";
import { AdminFeedback, ConfirmSubmitButton, SubmitButton } from "../form-controls";
import { MessagesFilter } from "./messages-filter";

type MessagesPageProps = {
  searchParams: Promise<{ q?: string; status?: string; success?: string; error?: string }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminMessagesPage({ searchParams }: MessagesPageProps) {
  await requireAdmin();
  const { q = "", status = "all", success, error } = await searchParams;
  const query = q.trim();
  const messages = await prisma.contactMessage.findMany({
    where: {
      ...(status === "read" ? { isRead: true, archivedAt: null } : {}),
      ...(status === "unread" ? { isRead: false, archivedAt: null } : {}),
      ...(status === "archived" ? { archivedAt: { not: null } } : {}),
      ...(status === "all" || !status ? { archivedAt: null } : {}),
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
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />
      <SectionCard className="mb-5">
        <MessagesFilter query={query} status={status} />
        <FieldDescription className="mt-3">
          Unread messages need attention, read messages stay in the inbox, and archived messages are hidden from the default view.
        </FieldDescription>
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
                  <StatusBadge tone={message.archivedAt ? "neutral" : message.isRead ? "neutral" : "warning"}>
                    {message.archivedAt ? "Archived" : message.isRead ? "Read" : "New"}
                  </StatusBadge>
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
                    <SubmitButton size="sm" pendingLabel="Marking..." className="border border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
                      <Check className="mr-2 h-4 w-4" />
                      Read
                    </SubmitButton>
                  </form>
                ) : null}
                {message.isRead ? (
                  <form action={markMessageUnread}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <SubmitButton size="sm" pendingLabel="Marking..." className="border border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
                      <MailOpen className="mr-2 h-4 w-4" />
                      Unread
                    </SubmitButton>
                  </form>
                ) : null}
                {!message.archivedAt ? (
                  <form action={archiveMessage}>
                    <input type="hidden" name="messageId" value={message.id} />
                    <ConfirmSubmitButton size="sm" confirmLabel="Archive message" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </ConfirmSubmitButton>
                  </form>
                ) : null}
                <form action={deleteMessage}>
                  <input type="hidden" name="messageId" value={message.id} />
                  <ConfirmSubmitButton size="sm" confirmLabel="Delete message">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </AdminShell>
  );
}
