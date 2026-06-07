import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { updateProject } from "../../../actions";
import { AdminShell } from "../../../admin-shell";
import { ProjectForm } from "../../project-form";
import type { MediaPickerAsset } from "../../../media/media-picker";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  await requireAdmin();
  const { id } = await params;
  const [project, mediaAssets] = await Promise.all([
    prisma.portfolioProject.findUnique({
      where: { id },
    }),
    prisma.adminMediaAsset.findMany({ where: { kind: "IMAGE" }, orderBy: { createdAt: "desc" } }),
  ]);

  if (!project) {
    notFound();
  }

  const updateProjectWithId = updateProject.bind(null, project.id);
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
    <AdminShell title="Edit Project" description={project.title}>
      <ProjectForm action={updateProjectWithId} project={project} submitLabel="Save Changes" mediaAssets={pickerAssets} />
    </AdminShell>
  );
}
