import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { deleteHighlight, saveHighlight } from "../actions";
import { AdminShell } from "../admin-shell";
import { SectionCard, StatusBadge } from "../admin-ui";

export default async function HighlightsPage() {
  await requireAdmin();
  const items = await prisma.portfolioHighlight.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <AdminShell title="Highlights" description="Manage public metrics, awards and featured highlight content.">
      <div className="grid gap-5">
        <HighlightForm submitLabel="Create Highlight" />
        {items.map((item) => (
          <SectionCard key={item.id}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-medium">{item.label}</h2>
                <p className="text-sm text-white/45">{item.value}</p>
              </div>
              <StatusBadge tone={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Published" : "Draft"}</StatusBadge>
            </div>
            <HighlightForm item={item} submitLabel="Save" />
            <form action={deleteHighlight} className="mt-3">
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

function HighlightForm({ item, submitLabel }: { item?: Awaited<ReturnType<typeof prisma.portfolioHighlight.findMany>>[number]; submitLabel: string }) {
  const metric = typeof item?.metric === "object" && item.metric && !Array.isArray(item.metric) ? item.metric as { value?: string; label?: string } : null;

  return (
    <form action={saveHighlight} className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.025] p-4">
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <Field name="value" label="Value" value={item?.value ?? ""} required />
        <Field name="label" label="Label" value={item?.label ?? ""} required />
        <Field name="sublabel" label="Sublabel" value={item?.sublabel ?? ""} />
        <Field name="sortOrder" label="Sort Order" value={String(item?.sortOrder ?? 0)} type="number" />
        <Field name="title" label="Award Title" value={item?.title ?? ""} />
        <Field name="role" label="Award Role" value={item?.role ?? ""} />
        <Field name="metricValue" label="Metric Value" value={metric?.value ?? ""} />
        <Field name="metricLabel" label="Metric Label" value={metric?.label ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`quote-${item?.id ?? "new"}`} className="text-white/65">Quote / Content</Label>
        <Textarea id={`quote-${item?.id ?? "new"}`} name="quote" defaultValue={item?.quote ?? ""} className="min-h-24 border-white/10 bg-black/30 text-white" />
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
