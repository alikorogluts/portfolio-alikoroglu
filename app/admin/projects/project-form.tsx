import type { PortfolioProject } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ProjectFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  project?: PortfolioProject;
  submitLabel: string;
};

export function ProjectForm({ action, project, submitLabel }: ProjectFormProps) {
  return (
    <form action={action} className="grid gap-5 rounded-lg border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl md:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-white/65">
            Title
          </Label>
          <Input id="title" name="title" defaultValue={project?.title} required className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug" className="text-white/65">
            Slug
          </Label>
          <Input id="slug" name="slug" defaultValue={project?.slug ?? ""} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="label" className="text-white/65">
            Etiket
          </Label>
          <Input id="label" name="label" defaultValue={project?.label ?? ""} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
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
          className="min-h-32 border-white/10 bg-black/30 text-white placeholder:text-white/28"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stack" className="text-white/65">
            Teknolojiler
          </Label>
          <Input id="stack" name="stack" defaultValue={project?.stack ?? ""} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder" className="text-white/65">
            Orderlama
          </Label>
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={project?.sortOrder ?? 0}
            className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="githubUrl" className="text-white/65">
            Github Linki
          </Label>
          <Input id="githubUrl" name="githubUrl" defaultValue={project?.githubUrl ?? ""} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="demoUrl" className="text-white/65">
            Demo Linki
          </Label>
          <Input id="demoUrl" name="demoUrl" defaultValue={project?.demoUrl ?? ""} className="border-white/10 bg-black/30 text-white placeholder:text-white/28" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="coverImageUrl" className="text-white/65">
            Cover Image
          </Label>
          <Input
            id="coverImageUrl"
            name="coverImageUrl"
            defaultValue={project?.coverImageUrl ?? ""}
            className="border-white/10 bg-black/30 text-white placeholder:text-white/28"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm text-white/65">
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={project?.isPublished ?? true}
          className="h-4 w-4 accent-white"
        />
        Published
      </label>

      <div className="flex justify-end">
        <Button type="submit" className="bg-white text-black hover:bg-white/85">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
