import { Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { deleteHighlight, saveHighlight } from "../actions";
import { AdminShell } from "../admin-shell";
import { AdminFeedback, ConfirmSubmitButton, SubmitButton } from "../form-controls";
import { FieldDescription, SectionCard, StatusBadge } from "../admin-ui";

type HighlightsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function HighlightsPage({ searchParams }: HighlightsPageProps) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const items = await prisma.portfolioHighlight.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }] });

  return (
    <AdminShell title="Highlights" description="Manage public metrics, awards and featured highlight content.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />
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
              <ConfirmSubmitButton size="sm" confirmLabel="Delete highlight">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </ConfirmSubmitButton>
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
        <Field name="value" label="Value" value={item?.value ?? ""} required placeholder="12+" description="Primary number or text shown in the highlight." />
        <Field name="label" label="Label" value={item?.label ?? ""} required placeholder="Projects shipped" description="Short label paired with the highlight value." />
        <Field name="sublabel" label="Sublabel" value={item?.sublabel ?? ""} placeholder="Across web and mobile" description="Optional secondary line below the label." />
        <Field name="sortOrder" label="Sort Order" value={String(item?.sortOrder ?? 0)} type="number" description="Lower numbers appear first." />
        <Field name="title" label="Award Title" value={item?.title ?? ""} placeholder="Hackathon Winner" description="Optional title when this highlight represents an award." />
        <Field name="role" label="Award Role" value={item?.role ?? ""} placeholder="Lead Developer" description="Optional role or context for the award." />
        <Field name="metricValue" label="Metric Value" value={metric?.value ?? ""} placeholder="98%" description="Optional nested metric value used by richer highlight layouts." />
        <Field name="metricLabel" label="Metric Label" value={metric?.label ?? ""} placeholder="accuracy" description="Optional nested metric label paired with the metric value." />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`quote-${item?.id ?? "new"}`} className="text-white/65">Quote / Content</Label>
        <Textarea id={`quote-${item?.id ?? "new"}`} name="quote" defaultValue={item?.quote ?? ""} placeholder="Optional supporting quote or narrative content." className="min-h-24 border-white/10 bg-black/30 text-white placeholder:text-white/28" />
        <FieldDescription>Optional text used by quote-style or long-form highlight layouts.</FieldDescription>
      </div>
      <div>
        <label className="flex items-center gap-3 text-sm text-white/65">
          <input type="checkbox" name="isPublished" defaultChecked={item?.isPublished ?? true} className="h-4 w-4 accent-white" />
          Published
        </label>
        <FieldDescription className="mt-1">Published highlights are visible on the public portfolio.</FieldDescription>
      </div>
      <SubmitButton pendingLabel="Saving highlight..." className="justify-self-end">{submitLabel}</SubmitButton>
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
