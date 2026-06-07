import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { updateHero } from "../actions";
import { AdminShell } from "../admin-shell";
import { SectionCard } from "../admin-ui";

export default async function AdminHeroPage() {
  await requireAdmin();
  const hero = await prisma.portfolioHero.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } });
  const words = Array.isArray(hero?.animatedWords) ? hero.animatedWords.filter((item) => typeof item === "string").join(", ") : "build, ship, detect, scale";

  return (
    <AdminShell title="Hero" description="Manage public hero headline, animated words and call-to-action links.">
      <SectionCard>
        <form action={updateHero} className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["headlinePrefix", "Headline Prefix", hero?.headlinePrefix ?? "Ali Koroglu"],
              ["headlineTemplate", "Headline Template", hero?.headlineTemplate ?? "systems that"],
              ["animatedWords", "Animated Words (comma separated)", words],
              ["currentBuilding", "Current Building", hero?.currentBuilding ?? "DeepSecure"],
              ["primaryCtaLabel", "Primary CTA Label", hero?.primaryCtaLabel ?? "Email me"],
              ["primaryCtaHref", "Primary CTA Link", hero?.primaryCtaHref ?? ""],
              ["secondaryCtaLabel", "Secondary CTA Label", hero?.secondaryCtaLabel ?? "View GitHub"],
              ["secondaryCtaHref", "Secondary CTA Link", hero?.secondaryCtaHref ?? ""],
            ].map(([name, label, value]) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={name} className="text-white/65">{label}</Label>
                <Input id={name} name={name} defaultValue={value} className="border-white/10 bg-black/30 text-white" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-white/65">Description</Label>
            <Textarea id="description" name="description" defaultValue={hero?.description ?? ""} className="min-h-28 border-white/10 bg-black/30 text-white" />
          </div>
          <Button type="submit" className="justify-self-end bg-white text-black hover:bg-white/85">Save Hero</Button>
        </form>
      </SectionCard>
    </AdminShell>
  );
}
