import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { deleteExperience, saveExperience } from "../actions";
import { AdminShell } from "../admin-shell";
import { SectionCard, StatusBadge } from "../admin-ui";

export default async function ExperiencePage() {
  await requireAdmin();
  const items = await prisma.portfolioExperience.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <AdminShell title="Experience" description="Manage public experience timeline items.">
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
              <Button variant="outline" size="sm" className="border-red-400/20 bg-red-400/5 text-red-200 hover:bg-red-400/10 hover:text-red-100">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
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
          <Field name="company" label="Company" value={item?.company ?? ""} />
          <Field name="role" label="Role" value={item?.role ?? ""} />
          <Field name="dateRange" label="Date Range" value={item?.dateRange ?? ""} />
          <Field name="title" label="Title" value={item?.title ?? ""} required />
          <Field name="subtitle" label="Subtitle" value={item?.subtitle ?? ""} />
          <Field name="sortOrder" label="Sort Order" value={String(item?.sortOrder ?? 0)} type="number" />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`description-${item?.id ?? "new"}`} className="text-white/65">Description</Label>
          <Textarea id={`description-${item?.id ?? "new"}`} name="description" defaultValue={item?.description ?? ""} required className="min-h-24 border-white/10 bg-black/30 text-white" />
        </div>
        <label className="flex items-center gap-3 text-sm text-white/65">
          <input type="checkbox" name="isPublished" defaultChecked={item?.isPublished ?? true} className="h-4 w-4 accent-white" />
          Published
        </label>
        <Button type="submit" className="justify-self-end bg-white text-black hover:bg-white/85">{submitLabel}</Button>
      </form>
    </SectionCard>
  );
}

function Field({ name, label, value, type = "text", required = false }: { name: string; label: string; value: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${name}-${value}`} className="text-white/65">{label}</Label>
      <Input id={`${name}-${value}`} name={name} type={type} defaultValue={value} required={required} className="border-white/10 bg-black/30 text-white" />
    </div>
  );
}
