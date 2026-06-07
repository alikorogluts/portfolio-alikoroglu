import type { PortfolioProject } from "@prisma/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { FieldDescription } from "../admin-ui";
import { SubmitButton } from "../form-controls";
import { MediaUrlInput, type MediaPickerAsset } from "../media/media-picker";

type ProjectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  project?: PortfolioProject;
  submitLabel: string;
  mediaAssets?: MediaPickerAsset[];
};

export function ProjectForm({ action, project, submitLabel, mediaAssets = [] }: ProjectFormProps) {
  return (
    <form action={action} className="grid gap-5 rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white/65">
            Title
          </Label>
          <Input id="title" name="title" defaultValue={project?.title} required placeholder="DeepSecure" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
          <FieldDescription>Public project name shown on cards and detail areas.</FieldDescription>
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-white/65">
            Slug
          </Label>
          <Input id="slug" name="slug" defaultValue={project?.slug ?? ""} placeholder="deepsecure" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
          <FieldDescription>URL-safe identifier. Use lowercase letters, numbers and hyphens.</FieldDescription>
        </div>
        <div className="space-y-2">
          <Label htmlFor="label" className="text-white/65">
            Label
          </Label>
          <Input id="label" name="label" defaultValue={project?.label ?? ""} placeholder="Security Platform" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
          <FieldDescription>Short category label shown above or near the project title.</FieldDescription>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-white/65">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={project?.description}
          required
          placeholder="Briefly describe the product, problem and outcome."
          className="min-h-32 border-white/10 bg-black/30 text-white placeholder:text-white/28"
        />
        <FieldDescription>Main project summary used by public cards and fallback spotlight content.</FieldDescription>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stack" className="text-white/65">
            Technologies
          </Label>
          <Input id="stack" name="stack" defaultValue={project?.stack ?? ""} placeholder="Next.js, Prisma, PostgreSQL" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
          <FieldDescription>Comma separated stack labels shown with the project.</FieldDescription>
        </div>
        <div className="space-y-2">
          <Label htmlFor="metric" className="text-white/65">
            Metric
          </Label>
          <Input id="metric" name="metric" defaultValue={project?.metric ?? ""} placeholder="99.9% uptime" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
          <FieldDescription>Optional proof point or result shown on project surfaces.</FieldDescription>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder" className="text-white/65">
            Sort Order
          </Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={project?.sortOrder ?? 0}
            className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
          />
          <FieldDescription>Lower numbers appear first.</FieldDescription>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="githubUrl" className="text-white/65">
            GitHub Link
          </Label>
          <Input id="githubUrl" name="githubUrl" defaultValue={project?.githubUrl ?? ""} placeholder="https://github.com/username/repo" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
          <FieldDescription>Optional public source link. Use HTTPS URLs.</FieldDescription>
        </div>
        <div className="space-y-2">
          <Label htmlFor="demoUrl" className="text-white/65">
            Demo Link
          </Label>
          <Input id="demoUrl" name="demoUrl" defaultValue={project?.demoUrl ?? ""} placeholder="https://example.com" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
          <FieldDescription>Optional live demo or case study link. Use HTTPS URLs.</FieldDescription>
        </div>
        <MediaUrlInput
          assets={mediaAssets}
          name="coverImageUrl"
          label="Cover Image"
          defaultValue={project?.coverImageUrl ?? ""}
          accept="IMAGE"
          placeholder="/uploads/images/project-cover.webp"
          description="Image shown in the project card and used as the visual fallback."
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 p-4">
        <h2 className="mb-4 text-sm font-medium text-white">Featured Spotlight Overrides</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="spotlightTitle" className="text-white/65">
              Spotlight Title
            </Label>
            <Input id="spotlightTitle" name="spotlightTitle" defaultValue={project?.spotlightTitle ?? ""} placeholder="Production-ready security workflows" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
            <FieldDescription>Optional title used only in the featured spotlight section.</FieldDescription>
          </div>
          <div className="space-y-2">
            <Label htmlFor="spotlightSubtitle" className="text-white/65">
              Spotlight Subtitle
            </Label>
            <Input id="spotlightSubtitle" name="spotlightSubtitle" defaultValue={project?.spotlightSubtitle ?? ""} placeholder="Featured build" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
            <FieldDescription>Optional small subtitle for the spotlight treatment.</FieldDescription>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="spotlightDescription" className="text-white/65">
              Spotlight Description
            </Label>
            <Textarea
              id="spotlightDescription"
              name="spotlightDescription"
              defaultValue={project?.spotlightDescription ?? ""}
              placeholder="Longer spotlight copy. Leave empty to use the project description."
              className="min-h-24 border-white/10 bg-black/30 text-white placeholder:text-white/28"
            />
            <FieldDescription>Optional custom description for the featured project section.</FieldDescription>
          </div>
          <MediaUrlInput
            assets={mediaAssets}
            name="spotlightImageUrl"
            label="Spotlight Image"
            defaultValue={project?.spotlightImageUrl ?? ""}
            accept="IMAGE"
            placeholder="/uploads/images/project-spotlight.webp"
            description="Optional image used in the featured visual area before falling back to the cover image."
          />
          <div className="space-y-2">
            <Label htmlFor="spotlightMetricValue" className="text-white/65">
              Spotlight Metric Value
            </Label>
            <Input id="spotlightMetricValue" name="spotlightMetricValue" defaultValue={project?.spotlightMetricValue ?? ""} placeholder="40%" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
            <FieldDescription>Optional numeric or text value for the spotlight metric.</FieldDescription>
          </div>
          <div className="space-y-2">
            <Label htmlFor="spotlightMetricLabel" className="text-white/65">
              Spotlight Metric Label
            </Label>
            <Input id="spotlightMetricLabel" name="spotlightMetricLabel" defaultValue={project?.spotlightMetricLabel ?? ""} placeholder="faster triage" className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
            <FieldDescription>Short label paired with the spotlight metric value.</FieldDescription>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="flex items-center gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={project?.isFeatured ?? false}
              className="h-4 w-4 accent-white"
            />
            Featured spotlight
          </label>
          <FieldDescription className="mt-1">Featured projects are used in the spotlight section.</FieldDescription>
        </div>
        <div>
          <label className="flex items-center gap-3 text-sm text-white/65">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={project?.isPublished ?? true}
              className="h-4 w-4 accent-white"
            />
            Published
          </label>
          <FieldDescription className="mt-1">Published projects are visible on the public portfolio.</FieldDescription>
        </div>
      </div>

      <FieldDescription>Upload project visuals in /admin/media, then choose them from the picker or paste the public URL.</FieldDescription>

      <div className="flex justify-end">
        <SubmitButton pendingLabel="Saving project...">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
