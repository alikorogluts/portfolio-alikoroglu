import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { createProject } from "../../actions";
import { AdminShell } from "../../admin-shell";
import { ProjectForm } from "../project-form";
import type { MediaPickerAsset } from "../../media/media-picker";

export default async function NewProjectPage() {
  await requireAdmin();
  const mediaAssets = await prisma.adminMediaAsset.findMany({ where: { kind: "IMAGE" }, orderBy: { createdAt: "desc" } });
  const pickerAssets: MediaPickerAsset[] = mediaAssets.map((asset) => ({
    id: asset.id,
    originalName: asset.originalName,
    url: asset.url,
    mimeType: asset.mimeType,
    size: asset.size,
    kind: asset.kind,
    createdAt: asset.createdAt.toISOString(),
  }));

  return (
    <AdminShell title="New Project" description="Create a new portfolio project.">
      <ProjectForm action={createProject} submitLabel="Create Project" mediaAssets={pickerAssets} />
    </AdminShell>
  );
}
