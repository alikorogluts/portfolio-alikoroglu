import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { deleteSkill, saveSkill } from "../actions";
import { AdminShell } from "../admin-shell";
import { SectionCard, StatusBadge } from "../admin-ui";

export default async function SkillsPage() {
  await requireAdmin();
  const items = await prisma.portfolioSkillGroup.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <AdminShell title="Skills" description="Manage public technical stack groups.">
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

function SkillForm({ item, submitLabel }: { item?: Awaited<ReturnType<typeof prisma.portfolioSkillGroup.findMany>>[number]; submitLabel: string }) {
  const items = Array.isArray(item?.items) ? item.items.filter((value) => typeof value === "string").join(", ") : "";

  return (
    <form action={saveSkill} className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <Field name="name" label="Name" value={item?.name ?? ""} required />
        <Field name="category" label="Category" value={item?.category ?? ""} />
        <Field name="items" label="Items (comma separated)" value={items} required />
        <Field name="sortOrder" label="Sort Order" value={String(item?.sortOrder ?? 0)} type="number" />
      </div>
      <label className="flex items-center gap-3 text-sm text-white/65">
        <input type="checkbox" name="isPublished" defaultChecked={item?.isPublished ?? true} className="h-4 w-4 accent-white" />
        Published
      </label>
      <Button type="submit" className="justify-self-end bg-white text-black hover:bg-white/85">{submitLabel}</Button>
    </form>
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
