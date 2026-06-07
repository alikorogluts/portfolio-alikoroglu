import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { updateProfile } from "../actions";
import { AdminShell } from "../admin-shell";
import { SectionCard } from "../admin-ui";

export default async function AdminProfilePage() {
  await requireAdmin();
  const profile = await prisma.portfolioProfile.findFirst({ orderBy: { updatedAt: "desc" } });

  return (
    <AdminShell title="Profile" description="Manage the public portfolio identity, links and summary.">
      <SectionCard>
        <form action={updateProfile} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["name", "Name", profile?.name ?? "Ali Koroglu"],
              ["role", "Role", profile?.role ?? "Full-Stack & Mobile Developer"],
              ["subtitle", "Subtitle", profile?.subtitle ?? ""],
              ["location", "Location", profile?.location ?? ""],
              ["email", "Email", profile?.email ?? ""],
              ["phone", "Phone", profile?.phone ?? ""],
              ["githubUrl", "GitHub URL", profile?.githubUrl ?? ""],
              ["linkedinUrl", "LinkedIn URL", profile?.linkedinUrl ?? ""],
              ["websiteUrl", "Website URL", profile?.websiteUrl ?? ""],
              ["cvUrl", "CV URL", profile?.cvUrl ?? ""],
              ["availability", "Availability", profile?.availability ?? ""],
              ["stackLine", "Stack Line", profile?.stackLine ?? ""],
            ].map(([name, label, value]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name} className="text-white/65">{label}</Label>
                <Input id={name} name={name} defaultValue={value} className="border-white/10 bg-black/30 text-white" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary" className="text-white/65">Summary</Label>
            <Textarea id="summary" name="summary" defaultValue={profile?.summary ?? ""} required className="min-h-32 border-white/10 bg-black/30 text-white" />
          </div>
          <Button type="submit" className="justify-self-end bg-white text-black hover:bg-white/85">Save Profile</Button>
        </form>
      </SectionCard>
    </AdminShell>
  );
}
