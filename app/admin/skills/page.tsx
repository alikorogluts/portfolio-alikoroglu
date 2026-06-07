import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { deleteSkill, saveSkill } from "../actions";
import { AdminShell } from "../admin-shell";
import { AdminFeedback, ConfirmSubmitButton, SubmitButton } from "../form-controls";
import { FieldDescription, SectionCard, StatusBadge } from "../admin-ui";

type SkillsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function SkillsPage({ searchParams }: SkillsPageProps) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const items = await prisma.portfolioSkillGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <AdminShell title="Skills" description="Manage public technical stack groups.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />
      <div className="grid gap-5">
        <SkillForm submitLabel="Create Skill Group" />
        {items.map((item) => (
          <SectionCard key={item.id}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-medium">{item.name}</h2>
              <StatusBadge tone={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Published" : "Draft"}</StatusBadge>
            </div>
            <SkillForm item={item} submitLabel="Save" />
            <form action={deleteSkill} className="mt-3">
              <input type="hidden" name="id" value={item.id} />
              <ConfirmSubmitButton size="sm" confirmLabel="Delete skill group">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </ConfirmSubmitButton>
            </form>
          </SectionCard>
        ))}
      </div>
    </AdminShell>
  );
}

function SkillForm({ item, submitLabel }: { item?: Awaited<ReturnType<typeof prisma.portfolioSkillGroup.findMany>>[number]; submitLabel: string }) {
  const items = Array.isArray(item?.items) ? item.items.filter((value) => typeof value === "string").join(", ") : "";

  return (
    <form action={saveSkill} className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <Field name="name" label="Group Name" value={item?.name ?? ""} required placeholder="Frontend" description="Skill group heading shown on the public portfolio." />
        <Field name="category" label="Category" value={item?.category ?? ""} placeholder="Engineering" description="Optional internal grouping or display category." />
        <Field name="items" label="Technologies" value={items} required placeholder="React, Next.js, Tailwind CSS" description="Comma separated technologies shown inside this group." />
        <Field name="sortOrder" label="Sort Order" value={String(item?.sortOrder ?? 0)} type="number" description="Lower numbers appear first." />
      </div>
      <div>
        <label className="flex items-center gap-3 text-sm text-white/65">
          <input type="checkbox" name="isPublished" defaultChecked={item?.isPublished ?? true} className="h-4 w-4 accent-white" />
          Published
        </label>
        <FieldDescription className="mt-1">Published skill groups are visible on the public portfolio.</FieldDescription>
      </div>
      <SubmitButton pendingLabel="Saving skill group..." className="justify-self-end">{submitLabel}</SubmitButton>
    </form>
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
