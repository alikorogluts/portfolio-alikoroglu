import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { updateHero } from "../actions";
import { AdminShell } from "../admin-shell";
import { AdminFeedback, SubmitButton } from "../form-controls";
import { FieldDescription, SectionCard } from "../admin-ui";
import { MediaUrlInput, type MediaPickerAsset } from "../media/media-picker";

type AdminHeroPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminHeroPage({ searchParams }: AdminHeroPageProps) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const [hero, mediaAssets] = await Promise.all([
    prisma.portfolioHero.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } }),
    prisma.adminMediaAsset.findMany({ where: { kind: "IMAGE" }, orderBy: { createdAt: "desc" } }),
  ]);
  const pickerAssets: MediaPickerAsset[] = mediaAssets.map((asset) => ({
    id: asset.id,
    originalName: asset.originalName,
    url: asset.url,
    mimeType: asset.mimeType,
    size: asset.size,
    kind: asset.kind,
    createdAt: asset.createdAt.toISOString(),
  }));
  const words = Array.isArray(hero?.animatedWords) ? hero.animatedWords.filter((item) => typeof item === "string").join(", ") : "build, ship, detect, scale";

  return (
    <AdminShell title="Hero" description="Manage public hero headline, animated words and call-to-action links.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />
      <SectionCard>
        <form action={updateHero} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { name: "headlinePrefix", label: "Headline Prefix", value: hero?.headlinePrefix ?? "Ali Koroglu", placeholder: "Ali Koroglu", description: "The fixed opening text before the animated hero phrase." },
              { name: "headlineTemplate", label: "Headline Template", value: hero?.headlineTemplate ?? "systems that", placeholder: "systems that", description: "Text that appears directly before the rotating animated word." },
              { name: "animatedWords", label: "Animated Words", value: words, placeholder: "build, ship, detect, scale", description: "Comma separated values. Example: build, ship, detect, scale" },
              { name: "currentBuilding", label: "Current Building", value: hero?.currentBuilding ?? "DeepSecure", placeholder: "DeepSecure", description: "Short project or product name shown as the current focus." },
              { name: "primaryCtaLabel", label: "Primary CTA Label", value: hero?.primaryCtaLabel ?? "Email me", placeholder: "Email me", description: "Button text for the main hero action." },
              { name: "primaryCtaHref", label: "Primary CTA Link", value: hero?.primaryCtaHref ?? "", placeholder: "mailto:you@example.com", description: "Optional link override. Leave empty to use profile email fallback where supported." },
              { name: "secondaryCtaLabel", label: "Secondary CTA Label", value: hero?.secondaryCtaLabel ?? "View GitHub", placeholder: "View GitHub", description: "Button text for the secondary hero action." },
              { name: "secondaryCtaHref", label: "Secondary CTA Link", value: hero?.secondaryCtaHref ?? "", placeholder: "https://github.com/username", description: "Optional link override. Leave empty to use profile GitHub fallback where supported." },
            ].map(({ name, label, value, placeholder, description }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name} className="text-white/65">{label}</Label>
                <Input id={name} name={name} defaultValue={value} placeholder={placeholder} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
                <FieldDescription>{description}</FieldDescription>
              </div>
            ))}
            <MediaUrlInput
              assets={pickerAssets}
              name="backgroundImageUrl"
              label="Background Image"
              defaultValue={hero?.backgroundImageUrl ?? ""}
              accept="IMAGE"
              placeholder="/uploads/images/hero-background.webp"
              description="Optional hero background image. Public asset paths and HTTPS URLs are supported."
            />
            <MediaUrlInput
              assets={pickerAssets}
              name="visualImageUrl"
              label="Visual Image"
              defaultValue={hero?.visualImageUrl ?? ""}
              accept="IMAGE"
              placeholder="/uploads/images/hero-visual.webp"
              description="Optional hero-side visual. Leave empty to use the default animated visual."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/65">Description</Label>
            <Textarea id="description" name="description" defaultValue={hero?.description ?? ""} placeholder="Brief supporting copy for the hero section." className="min-h-28 border-white/10 bg-black/30 text-white placeholder:text-white/28" />
            <FieldDescription>Short public paragraph under the hero headline.</FieldDescription>
          </div>
          <FieldDescription>Upload hero images in /admin/media, copy the URL, or choose an uploaded image from the picker.</FieldDescription>
          <SubmitButton pendingLabel="Saving hero..." className="justify-self-end">Save Hero</SubmitButton>
        </form>
      </SectionCard>
    </AdminShell>
  );
}
