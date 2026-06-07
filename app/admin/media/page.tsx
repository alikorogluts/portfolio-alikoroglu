import { FileText, ImageIcon, Trash2 } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "../admin-shell";
import { EmptyState, FieldDescription, SectionCard, StatusBadge } from "../admin-ui";
import { AdminFeedback, ConfirmSubmitButton } from "../form-controls";
import { deleteMedia } from "./actions";
import { CopyUrlButton } from "./copy-url-button";
import { MediaUploadForm } from "./media-upload-form";

type MediaPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function MediaPage({ searchParams }: MediaPageProps) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const assets = await prisma.adminMediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: {
        select: { email: true },
      },
    },
  });

  return (
    <AdminShell title="Media" description="Upload and manage local portfolio images and documents.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />

      <SectionCard>
        <MediaUploadForm />
      </SectionCard>

      <div className="mt-6 grid gap-4">
        <FieldDescription>Copy a public URL from this list and paste it into CMS image, document or OpenGraph fields.</FieldDescription>

        {assets.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No media yet"
            description="Uploaded files will appear here with public URLs for CMS fields."
          />
        ) : null}

        {assets.map((asset) => {
          const Icon = asset.kind === "IMAGE" ? ImageIcon : FileText;

          return (
            <SectionCard key={asset.id}>
              <div className="grid gap-5 lg:grid-cols-[160px_1fr_auto] lg:items-center">
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/30">
                  {asset.kind === "IMAGE" ? (
                    <img src={asset.url} alt={asset.originalName} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-10 w-10 text-white/35" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Icon className="h-4 w-4 text-white/40" />
                    <h2 className="truncate text-base font-medium text-white">{asset.originalName}</h2>
                    <StatusBadge tone={asset.kind === "IMAGE" ? "success" : "neutral"}>{asset.kind}</StatusBadge>
                  </div>
                  <p className="mt-2 break-all text-sm text-white/50">{asset.url}</p>
                  <p className="mt-2 text-xs text-white/35">
                    {asset.mimeType} · {formatBytes(asset.size)} · Uploaded {formatDate(asset.createdAt)} by {asset.uploadedBy.email}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <CopyUrlButton url={asset.url} />
                  <form action={deleteMedia}>
                    <input type="hidden" name="id" value={asset.id} />
                    <ConfirmSubmitButton size="sm" confirmLabel="Delete media">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </AdminShell>
  );
}
