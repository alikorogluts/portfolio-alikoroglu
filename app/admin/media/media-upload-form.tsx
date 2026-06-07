"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FieldDescription, FieldHint } from "../admin-ui";

export function MediaUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setStatus(null);
    setIsUploading(true);

    const response = await fetch("/api/admin/media/upload", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;

    setIsUploading(false);

    if (!response.ok || !result?.success) {
      setStatus({ type: "error", message: result?.message ?? "Upload failed." });
      return;
    }

    if (inputRef.current) inputRef.current.value = "";
    setStatus({ type: "success", message: result.message ?? "Media uploaded successfully." });
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
      <div className="space-y-2">
        <label htmlFor="file" className="text-sm text-white/65">
          Upload image or PDF
        </label>
        <FieldDescription>Upload reusable CMS assets for profile, hero, project, settings and CV fields.</FieldDescription>
        <Input
          ref={inputRef}
          id="file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
          required
          className="border-white/10 bg-black/30 text-white file:text-white"
        />
        <FieldHint>Allowed file types: JPG, PNG, WebP, GIF, SVG and PDF.</FieldHint>
        <FieldHint>Max size: images up to 5MB, PDF documents up to 10MB.</FieldHint>
        <FieldHint>Uploaded files receive public URLs such as /uploads/images/file.webp or /uploads/documents/cv.pdf.</FieldHint>
        {status ? (
          <p className={status.type === "success" ? "text-sm text-emerald-200" : "text-sm text-red-200"}>
            {status.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={isUploading} className="bg-white text-black hover:bg-white/85">
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
