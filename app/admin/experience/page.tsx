import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { deleteExperience, saveExperience } from "../actions";
import { AdminShell } from "../admin-shell";
import { AdminFeedback, ConfirmSubmitButton, SubmitButton } from "../form-controls";
import { FieldDescription, SectionCard, StatusBadge } from "../admin-ui";

type ExperiencePageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function ExperiencePage({ searchParams }: ExperiencePageProps) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const items = await prisma.portfolioExperience.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <AdminShell title="Experience" description="Manage public experience timeline items.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />
      <div className="grid gap-5">
        <ExperienceForm submitLabel="Create Experience" />
        {items.map((item) => (
          <SectionCard key={item.id}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-medium">{item.company ?? item.title}</h2>
                <p className="text-sm text-white/45">{item.role ?? item.subtitle}</p>
              </div>
              <StatusBadge tone={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Published" : "Draft"}</StatusBadge>
            </div>
            <ExperienceForm item={item} submitLabel="Save" />
            <form action={deleteExperience} className="mt-3">
              <input type="hidden" name="id" value={item.id} />
              <ConfirmSubmitButton size="sm" confirmLabel="Delete experience">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </ConfirmSubmitButton>
            </form>
          </SectionCard>
        ))}
      </div>
    </AdminShell>
  );
}

function ExperienceForm({ item, submitLabel }: { item?: Awaited<ReturnType<typeof prisma.portfolioExperience.findMany>>[number]; submitLabel: string }) {
  return (
    <SectionCard className={item ? "bg-transparent p-0 shadow-none" : ""}>
      <form action={saveExperience} className="grid gap-4">
        {item ? <input type="hidden" name="id" value={item.id} /> : null}
        <div className="grid gap-4 md:grid-cols-3">
          <Field name="company" label="Company" value={item?.company ?? ""} placeholder="Company Inc." description="Organization name shown in the timeline." />
          <Field name="role" label="Role" value={item?.role ?? ""} placeholder="Full-Stack Developer" description="Your title or responsibility at this company." />
          <Field name="dateRange" label="Date Range" value={item?.dateRange ?? ""} placeholder="2024 - Present" description="Human-readable date range for the public timeline." />
          <Field name="title" label="Title" value={item?.title ?? ""} required placeholder="Built production security tooling" description="Required headline for this experience item." />
          <Field name="subtitle" label="Subtitle" value={item?.subtitle ?? ""} placeholder="Platform engineering and product delivery" description="Optional supporting line under the title." />
          <Field name="sortOrder" label="Sort Order" value={String(item?.sortOrder ?? 0)} type="number" description="Lower numbers appear first." />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`description-${item?.id ?? "new"}`} className="text-white/65">Description</Label>
          <Textarea id={`description-${item?.id ?? "new"}`} name="description" defaultValue={item?.description ?? ""} required placeholder="Summarize your contribution, scope and outcome." className="min-h-24 border-white/10 bg-black/30 text-white placeholder:text-white/28" />
          <FieldDescription>Public summary for this timeline entry.</FieldDescription>
        </div>
        <div>
          <label className="flex items-center gap-3 text-sm text-white/65">
            <input type="checkbox" name="isPublished" defaultChecked={item?.isPublished ?? true} className="h-4 w-4 accent-white" />
            Published
          </label>
          <FieldDescription className="mt-1">Published experience items are visible on the public portfolio.</FieldDescription>
        </div>
        <SubmitButton pendingLabel="Saving experience..." className="justify-self-end">{submitLabel}</SubmitButton>
      </form>
    </SectionCard>
  );
}

function Field({
  name,
  label,
  value,
  type = "text",
  required = false,
  placeholder,
  description,
}: {
  name: string;
  label: string;
  value: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${name}-${value}`} className="text-white/65">{label}</Label>
      <Input id={`${name}-${value}`} name={name} type={type} defaultValue={value} required={required} placeholder={placeholder} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </div>
  );
}
