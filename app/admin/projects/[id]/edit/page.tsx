import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { updateProject } from "../../../actions";
import { AdminShell } from "../../../admin-shell";
import { ProjectForm } from "../../project-form";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  await requireAdmin();
  const { id } = await params;
  const project = await prisma.portfolioProject.findUnique({
    where: { id },
  });

  if (!project) {
    notFound();
  }

  const updateProjectWithId = updateProject.bind(null, project.id);

  return (
    <AdminShell title="Edit Project" description={project.title}>
      <ProjectForm action={updateProjectWithId} project={project} submitLabel="Save Changes" />
    </AdminShell>
  );
}
