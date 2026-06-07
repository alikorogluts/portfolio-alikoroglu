"use server";

import { AuditAction } from "@prisma/client";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requiredString, validationMessage } from "../validation";

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"),
    userAgent: headerStore.get("user-agent"),
  };
}

async function writeAuditLog(userId: string, action: AuditAction, entityId: string, summary: string) {
  const metadata = await getRequestMetadata();

  await prisma.adminAuditLog.create({
    data: {
      userId,
      action,
      entityType: "AdminMediaAsset",
      entityId,
      summary,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });
}

function mediaRedirect(message: string, type: "success" | "error" = "success") {
  return `/admin/media?${type}=${encodeURIComponent(message)}`;
}

export async function deleteMedia(formData: FormData) {
  const user = await requireAdmin();
  const parsedId = requiredString("Media asset").safeParse(formData.get("id"));

  if (!parsedId.success) {
    redirect(mediaRedirect(validationMessage(parsedId.error), "error"));
  }

  const id = parsedId.data;
  const asset = await prisma.adminMediaAsset.findUnique({ where: { id } });

  if (!asset) {
    redirect(mediaRedirect("Media asset was not found.", "error"));
  }

  if (!asset.url.startsWith("/uploads/images/") && !asset.url.startsWith("/uploads/documents/")) {
    redirect(mediaRedirect("Media URL is outside the upload directory.", "error"));
  }

  const relativePath = asset.url.replace(/^\//, "");
  const filePath = path.normalize(path.join(process.cwd(), "public", relativePath));
  const uploadsRoot = path.normalize(path.join(process.cwd(), "public", "uploads"));

  if (!filePath.startsWith(uploadsRoot)) {
    redirect(mediaRedirect("Media path is invalid.", "error"));
  }

  await prisma.adminMediaAsset.delete({ where: { id: asset.id } });
  await unlink(filePath).catch((error) => {
    console.error("[media] Failed to delete media file from disk.", error);
  });
  await writeAuditLog(user.id, AuditAction.MEDIA_DELETED, asset.id, `Media deleted: ${asset.originalName}`);

  revalidatePath("/admin/media");
  redirect(mediaRedirect("Media deleted successfully."));
}
