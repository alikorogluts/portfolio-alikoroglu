import Link from "next/link";
import { ExternalLink, FolderKanban, Github, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { deleteProject } from "../actions";
import { AdminShell } from "../admin-shell";
import { EmptyState, SectionCard, StatusBadge } from "../admin-ui";
import { AdminFeedback, ConfirmSubmitButton } from "../form-controls";

type AdminProjectsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminProjectsPage({ searchParams }: AdminProjectsPageProps) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const projects = await prisma.portfolioProject.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <AdminShell title="Projects" description="Create, edit and publish portfolio projects.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/45">{projects.length} project records</p>
        <Button asChild className="bg-white text-black hover:bg-white/85">
          <Link href="/admin/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create the first project to start managing portfolio content from the admin panel."
          action={
            <Button asChild className="bg-white text-black hover:bg-white/85">
              <Link href="/admin/projects/new">
                <Plus className="mr-2 h-4 w-4" />
                Create first project
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-white/10 bg-white/[0.025] lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.04] text-white/45">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Technologies</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Links</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {projects.map((project) => (
                  <tr key={project.id} className="bg-white/[0.015] transition hover:bg-white/[0.04]">
                    <td className="px-4 py-4">
                      <p className="font-medium text-white">{project.title}</p>
                      <p className="mt-1 line-clamp-2 max-w-xl text-white/45">{project.description}</p>
                    </td>
                    <td className="px-4 py-4 text-white/55">{project.stack ?? "-"}</td>
                    <td className="px-4 py-4 text-white/55">{project.sortOrder}</td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={project.isPublished ? "success" : "warning"}>
                        {project.isPublished ? "Published" : "Draft"}
                      </StatusBadge>
                      {project.isFeatured ? <StatusBadge tone="neutral">Featured</StatusBadge> : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 text-white/60">
                        {project.githubUrl ? (
                          <a href={project.githubUrl} target="_blank" rel="noreferrer" aria-label="Github">
                            <Github className="h-4 w-4" />
                          </a>
                        ) : null}
                        {project.demoUrl ? (
                          <a href={project.demoUrl} target="_blank" rel="noreferrer" aria-label="Demo">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
                          <Link href={`/admin/projects/${project.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </Button>
                        <form action={deleteProject}>
                          <input type="hidden" name="projectId" value={project.id} />
                          <ConfirmSubmitButton size="sm" confirmLabel="Delete project">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </ConfirmSubmitButton>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 lg:hidden">
            {projects.map((project) => (
              <SectionCard key={project.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-medium">{project.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/50">{project.description}</p>
                  </div>
                  <StatusBadge tone={project.isPublished ? "success" : "warning"}>
                    {project.isPublished ? "Published" : "Draft"}
                  </StatusBadge>
                </div>
                <p className="mt-4 text-sm text-white/45">{project.stack ?? "No technology details"}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
                    <Link href={`/admin/projects/${project.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <form action={deleteProject}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <ConfirmSubmitButton size="sm" confirmLabel="Delete project">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </SectionCard>
            ))}
          </div>
        </>
      )}
    </AdminShell>
  );
}
