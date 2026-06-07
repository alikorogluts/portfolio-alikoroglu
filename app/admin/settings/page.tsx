import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { updateSettings } from "../actions";
import { AdminShell } from "../admin-shell";
import { AdminFeedback, SubmitButton } from "../form-controls";
import { FieldDescription, SectionCard } from "../admin-ui";
import { MediaUrlInput, type MediaPickerAsset } from "../media/media-picker";

type SettingsPageProps = {
  searchParams: Promise<{ success?: string; error?: string }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await requireAdmin();
  const { success, error } = await searchParams;
  const [settings, mediaAssets] = await Promise.all([
    prisma.siteSettings.findFirst({ orderBy: { updatedAt: "desc" } }),
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

  return (
    <AdminShell title="Settings" description="Manage site behavior, visibility, contact and analytics settings.">
      <AdminFeedback message={success} />
      <AdminFeedback message={error} type="error" />
      <form action={updateSettings} className="grid gap-5">
        <SectionCard>
          <h2 className="mb-5 text-lg font-medium">General</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field name="siteTitle" label="Site Title" value={settings?.siteTitle ?? "Ali Koroglu - Full-Stack & Mobile Developer"} required placeholder="Ali Koroglu - Full-Stack & Mobile Developer" description="Default browser title and metadata title for the portfolio." />
            <Field name="defaultLanguage" label="Default Language" value={settings?.defaultLanguage ?? "en"} required placeholder="en" description="Language code used for document metadata." />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="siteDescription" className="text-white/65">Site Description</Label>
              <Textarea id="siteDescription" name="siteDescription" defaultValue={settings?.siteDescription ?? ""} required placeholder="Short SEO description for search and social previews." className="min-h-24 border-white/10 bg-black/30 text-white placeholder:text-white/28" />
              <FieldDescription>Default description for metadata, SEO and social previews.</FieldDescription>
            </div>
            <Field name="footerCopyrightText" label="Footer Copyright Text" value={settings?.footerCopyrightText ?? ""} placeholder="© 2026 Ali Koroglu" description="Optional copyright line shown in the footer." />
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-5 text-lg font-medium">Visibility</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Toggle name="maintenanceMode" label="Maintenance Mode" checked={settings?.maintenanceMode ?? false} description="When enabled, visitors will see the maintenance page instead of the portfolio." />
            <Toggle name="showAvailabilityBadge" label="Show Availability Badge" checked={settings?.showAvailabilityBadge ?? true} description="Controls whether the profile availability status appears publicly." />
            <Toggle name="showDownloadCvButton" label="Show Download CV Button" checked={settings?.showDownloadCvButton ?? true} description="Controls whether CV download buttons are shown when a CV URL exists." />
            <Toggle name="showGithubButton" label="Show GitHub Button" checked={settings?.showGithubButton ?? true} description="Controls whether GitHub buttons are shown when a profile GitHub URL exists." />
            <Toggle name="showEmailButton" label="Show Email Button" checked={settings?.showEmailButton ?? true} description="Controls whether email buttons are shown when a profile email exists." />
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-5 text-lg font-medium">Maintenance Page</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field name="maintenanceTitle" label="Maintenance Title" value={settings?.maintenanceTitle ?? ""} placeholder="Portfolio updates in progress." description="Headline shown on the public maintenance page." />
            <Field name="maintenanceExpectedBackAt" label="Expected Back At" value={settings?.maintenanceExpectedBackAt ?? ""} placeholder="Back soon" description="Optional public ETA text. Keep it human-readable." />
            <MediaUrlInput
              assets={pickerAssets}
              name="maintenanceImageUrl"
              label="Maintenance Image"
              defaultValue={settings?.maintenanceImageUrl ?? ""}
              accept="IMAGE"
              placeholder="/uploads/images/maintenance.webp"
              description="Optional maintenance visual. Leave empty to use the default dark orb visual."
            />
            <MediaUrlInput
              assets={pickerAssets}
              name="ogImageUrl"
              label="OpenGraph Image"
              defaultValue={settings?.ogImageUrl ?? ""}
              accept="IMAGE"
              placeholder="/uploads/images/og-image.webp"
              description="This image is shown when your portfolio is shared on LinkedIn, WhatsApp, Discord, X and other social platforms."
            />
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="maintenanceDescription" className="text-white/65">Maintenance Description</Label>
              <Textarea id="maintenanceDescription" name="maintenanceDescription" defaultValue={settings?.maintenanceDescription ?? ""} placeholder="The portfolio is temporarily unavailable while updates are being applied." className="min-h-24 border-white/10 bg-black/30 text-white placeholder:text-white/28" />
              <FieldDescription>Short supporting text shown below the maintenance title.</FieldDescription>
            </div>
          </div>
          <FieldDescription className="mt-4">Use /admin/media to upload and copy image URLs, or choose uploaded images from the picker.</FieldDescription>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-5 text-lg font-medium">Contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Toggle name="contactFormEnabled" label="Contact Form Enabled" checked={settings?.contactFormEnabled ?? true} description="Controls whether visitors can submit the public contact form." />
            <Field name="contactRecipientEmail" label="Contact Recipient Email" value={settings?.contactRecipientEmail ?? ""} placeholder="you@example.com" description="Optional inbox for contact notifications or routing." />
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="mb-5 text-lg font-medium">Analytics</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Toggle name="analyticsEnabled" label="Analytics Enabled" checked={settings?.analyticsEnabled ?? false} description="Turns public analytics script rendering on or off." />
            <Field name="analyticsProvider" label="Analytics Provider" value={settings?.analyticsProvider ?? ""} placeholder="google" description="Supported: Google Analytics, Plausible, Umami" />
            <Field name="analyticsId" label="Analytics ID" value={settings?.analyticsId ?? ""} placeholder="G-XXXXXXXXXX" description="Tracking ID or site key from your analytics provider." />
          </div>
        </SectionCard>

        <SectionCard className="border-red-400/15 bg-red-400/[0.025]">
          <h2 className="mb-2 text-lg font-medium text-red-100">Danger Zone</h2>
          <p className="text-sm text-white/45">Destructive site-wide actions can be added here later with confirmation.</p>
        </SectionCard>

        <div className="flex justify-end">
          <SubmitButton pendingLabel="Saving settings...">Save Settings</SubmitButton>
        </div>
      </form>
    </AdminShell>
  );
}

function Field({
  name,
  label,
  value,
  required = false,
  placeholder,
  description,
}: {
  name: string;
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-white/65">{label}</Label>
      <Input id={name} name={name} defaultValue={value} required={required} placeholder={placeholder} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </div>
  );
}

function Toggle({ name, label, checked, description }: { name: string; label: string; checked: boolean; description?: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <label className="flex items-center gap-3 text-sm text-white/65">
        <input type="checkbox" name={name} defaultChecked={checked} className="h-4 w-4 accent-white" />
        {label}
      </label>
      {description ? <FieldDescription className="mt-1 pl-7">{description}</FieldDescription> : null}
    </div>
  );
}
