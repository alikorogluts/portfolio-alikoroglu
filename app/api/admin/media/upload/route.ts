import { AuditAction, MediaKind } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "svg"]);
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);
const DOCUMENT_EXTENSIONS = new Set(["pdf"]);
const DOCUMENT_MIME_TYPES = new Set(["application/pdf"]);
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;

function sanitizeBaseName(fileName: string) {
  const parsed = path.parse(fileName);
  return parsed.name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80) || "media";
}

function getExtension(fileName: string) {
  return path.extname(fileName).replace(".", "").toLowerCase();
}

function validateFile(file: File) {
  const extension = getExtension(file.name);
  const isImage = IMAGE_EXTENSIONS.has(extension) && IMAGE_MIME_TYPES.has(file.type);
  const isDocument = DOCUMENT_EXTENSIONS.has(extension) && DOCUMENT_MIME_TYPES.has(file.type);

  if (!isImage && !isDocument) {
    return { ok: false as const, message: "Only image files and PDF documents are allowed." };
  }

  if (isImage && file.size > IMAGE_MAX_SIZE) {
    return { ok: false as const, message: "Image files must be 5MB or smaller." };
  }

  if (isDocument && file.size > DOCUMENT_MAX_SIZE) {
    return { ok: false as const, message: "PDF files must be 10MB or smaller." };
  }

  return {
    ok: true as const,
    extension,
    kind: isImage ? MediaKind.IMAGE : MediaKind.DOCUMENT,
    directory: isImage ? "images" : "documents",
  };
}

function getRequestMetadata(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent"),
  };
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, message: "Choose a file to upload." }, { status: 400 });
  }

  const validation = validateFile(file);

  if (!validation.ok) {
    return NextResponse.json({ success: false, message: validation.message }, { status: 400 });
  }

  const baseName = sanitizeBaseName(file.name);
  const fileName = `${baseName}-${randomUUID().slice(0, 10)}.${validation.extension}`;
  const uploadRoot = path.join(process.cwd(), "public", "uploads", validation.directory);
  const filePath = path.join(uploadRoot, fileName);
  const publicUrl = `/uploads/${validation.directory}/${fileName}`;

  await mkdir(uploadRoot, { recursive: true });
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const asset = await prisma.adminMediaAsset.create({
    data: {
      fileName,
      originalName: file.name,
      url: publicUrl,
      mimeType: file.type,
      size: file.size,
      kind: validation.kind,
      uploadedById: user.id,
    },
  });

  const metadata = getRequestMetadata(request);
  await prisma.adminAuditLog.create({
    data: {
      userId: user.id,
      action: AuditAction.MEDIA_UPLOADED,
      entityType: "AdminMediaAsset",
      entityId: asset.id,
      summary: `Media uploaded: ${file.name}`,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Media uploaded successfully.",
    asset,
  });
}
