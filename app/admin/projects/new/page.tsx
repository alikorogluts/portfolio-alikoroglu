import { requireAdmin } from "@/lib/auth";

import { createProject } from "../../actions";
import { AdminShell } from "../../admin-shell";
import { ProjectForm } from "../project-form";

export default async function NewProjectPage() {
  await requireAdmin();

  return (
    <AdminShell title="New Project" description="Create a new portfolio project.">
      <ProjectForm action={createProject} submitLabel="Create Project" />
    </AdminShell>
  );
}
