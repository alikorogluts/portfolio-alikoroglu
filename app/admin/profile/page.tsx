import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { updateProfile } from "../actions";
import { AdminShell } from "../admin-shell";
import { AdminFeedback, SubmitButton } from "../form-controls";
import { FieldDescription, SectionCard } from "../admin-ui";
import { MediaUrlInput, type MediaPickerAsset } from "../media/media-picker";

type AdminProfilePageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function AdminProfilePage({ searchParams }: AdminProfilePageProps) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const [profile, mediaAssets] = await Promise.all([
    prisma.portfolioProfile.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.adminMediaAsset.findMany({ orderBy: { createdAt: "desc" } }),
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

  return (
    <AdminShell title="Profile" description="Manage the public portfolio identity, links and summary.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />
      <SectionCard>
        <form action={updateProfile} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { name: "name", label: "Full Name", value: profile?.name ?? "Ali Koroglu", placeholder: "Ali Koroglu", description: "Primary owner name shown in the header, hero and metadata." },
              { name: "role", label: "Title", value: profile?.role ?? "Full-Stack & Mobile Developer", placeholder: "Full-Stack & Mobile Developer", description: "Short professional title shown near your name." },
              { name: "subtitle", label: "Subtitle", value: profile?.subtitle ?? "", placeholder: "Security-minded product engineer", description: "Optional supporting line for profile and footer surfaces." },
              { name: "location", label: "Location", value: profile?.location ?? "", placeholder: "Istanbul, Turkiye", description: "Optional public location text." },
              { name: "email", label: "Email", value: profile?.email ?? "", placeholder: "you@example.com", description: "Used by contact links and email buttons across the portfolio." },
              { name: "phone", label: "Phone", value: profile?.phone ?? "", placeholder: "+90 ...", description: "Optional public phone number if you want to show one." },
              { name: "githubUrl", label: "GitHub", value: profile?.githubUrl ?? "", placeholder: "https://github.com/username", description: "Used by header, footer and GitHub CTA fallbacks." },
              { name: "linkedinUrl", label: "LinkedIn", value: profile?.linkedinUrl ?? "", placeholder: "https://www.linkedin.com/in/username", description: "Used by footer and social link areas." },
              { name: "websiteUrl", label: "Website URL", value: profile?.websiteUrl ?? "", placeholder: "https://example.com", description: "Optional personal or company website link." },
              { name: "availability", label: "Availability", value: profile?.availability ?? "", placeholder: "Available for selected projects", description: "Short status text for availability badges." },
              { name: "stackLine", label: "Stack Line", value: profile?.stackLine ?? "", placeholder: "Next.js, React Native, Prisma", description: "Compact technology summary used in profile areas." },
            ].map(({ name, label, value, placeholder, description }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name} className="text-white/65">{label}</Label>
                <Input id={name} name={name} defaultValue={value} placeholder={placeholder} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
                <FieldDescription>{description}</FieldDescription>
              </div>
            ))}
            <MediaUrlInput
              assets={pickerAssets}
              name="cvUrl"
              label="CV URL"
              defaultValue={profile?.cvUrl ?? ""}
              accept="DOCUMENT"
              placeholder="/uploads/documents/cv.pdf"
              description="Public URL for your downloadable CV. Use the media library or paste a PDF URL."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary" className="text-white/65">Summary</Label>
            <Textarea id="summary" name="summary" defaultValue={profile?.summary ?? ""} required placeholder="A concise professional summary for the public portfolio." className="min-h-32 border-white/10 bg-black/30 text-white placeholder:text-white/28" />
            <FieldDescription>Short biography used in profile-driven sections and metadata fallbacks.</FieldDescription>
          </div>
          <FieldDescription>Upload CV or media files in /admin/media, then paste the copied URL into CV URL or image fields.</FieldDescription>
          <SubmitButton pendingLabel="Saving profile..." className="justify-self-end">Save Profile</SubmitButton>
        </form>
      </SectionCard>
    </AdminShell>
  );
}
