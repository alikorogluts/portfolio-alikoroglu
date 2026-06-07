import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import {
  awards,
  experience,
  highlights,
  profile,
  projects,
  skillGroups,
} from "../components/landing/portfolio-data";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL."),
});

async function main() {
  const env = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });

  if (!env.success) {
    const message = env.error.issues.map((issue) => issue.message).join(" ");
    throw new Error(
      `Missing or invalid seed environment variables. ${message} Set DATABASE_URL before running pnpm db:seed.`
    );
  }

  const adapter = new PrismaPg({ connectionString: env.data.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const adminCount = await prisma.adminUser.count();

    if (adminCount === 0) {
      console.warn(
        "No AdminUser records found. Create the first admin user directly in the database before signing in."
      );
    } else {
      console.log(`Found ${adminCount} database-backed admin user(s). Seed will not modify admin credentials.`);
    }

    const owner = await prisma.adminUser.findFirst({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (owner) {
      console.log(`Primary admin user: ${owner.email} (${owner.role})`);
    }

    const existingProfile = await prisma.portfolioProfile.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    const profileData = {
      name: profile.name,
      role: profile.role,
      subtitle: profile.subtitle,
      location: profile.location,
      email: profile.email,
      phone: profile.phone,
      githubUrl: profile.github,
      linkedinUrl: profile.linkedin,
      websiteUrl: profile.grit,
      cvUrl: profile.cv,
      summary: profile.summary,
      stackLine: profile.stackLine,
      availability: profile.availability,
    };

    if (existingProfile) {
      await prisma.portfolioProfile.update({
        where: { id: existingProfile.id },
        data: profileData,
      });
    } else {
      await prisma.portfolioProfile.create({ data: profileData });
    }

    const existingSettings = await prisma.siteSettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    const settingsData = {
      siteTitle: `${profile.name} - ${profile.role}`,
      siteDescription: `${profile.subtitle}. ${profile.summary}`,
      defaultLanguage: "en",
      maintenanceMode: false,
      showAvailabilityBadge: true,
      showDownloadCvButton: true,
      showGithubButton: true,
      showEmailButton: true,
      contactFormEnabled: true,
      contactRecipientEmail: profile.email,
      footerCopyrightText: `© ${new Date().getFullYear()} ${profile.name}. Built with focus, restraint and care.`,
      analyticsEnabled: false,
      analyticsProvider: null,
      analyticsId: null,
    };

    if (existingSettings) {
      await prisma.siteSettings.update({
        where: { id: existingSettings.id },
        data: settingsData,
      });
    } else {
      await prisma.siteSettings.create({ data: settingsData });
    }

    const existingHero = await prisma.portfolioHero.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });
    const heroData = {
      headlinePrefix: profile.name,
      headlineTemplate: "systems that",
      animatedWords: ["build", "ship", "detect", "scale"],
      description: `${profile.role} | ${profile.subtitle}. ${profile.summary}`,
      primaryCtaLabel: "Email me",
      primaryCtaHref: `mailto:${profile.email}`,
      secondaryCtaLabel: "View GitHub",
      secondaryCtaHref: profile.github,
      currentBuilding: projects[0]?.name ?? "DeepSecure",
      isActive: true,
    };

    if (existingHero) {
      await prisma.portfolioHero.update({
        where: { id: existingHero.id },
        data: heroData,
      });
    } else {
      await prisma.portfolioHero.create({ data: heroData });
    }

    for (const [index, project] of projects.entries()) {
      const existing = await prisma.portfolioProject.findFirst({
        where: { title: project.name },
      });
      const data = {
        title: project.name,
        slug: project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        label: project.label,
        description: project.description,
        stack: project.stack,
        metric: project.metric,
        sortOrder: index,
        isFeatured: index === 0,
        isPublished: true,
      };

      if (existing) {
        await prisma.portfolioProject.update({ where: { id: existing.id }, data });
      } else {
        await prisma.portfolioProject.create({ data });
      }
    }

    for (const [index, item] of experience.entries()) {
      const existing = await prisma.portfolioExperience.findFirst({
        where: { title: item.title },
      });
      const data = {
        title: item.title,
        company: item.title,
        subtitle: item.subtitle,
        description: item.description,
        sortOrder: index,
        isPublished: true,
      };

      if (existing) {
        await prisma.portfolioExperience.update({ where: { id: existing.id }, data });
      } else {
        await prisma.portfolioExperience.create({ data });
      }
    }

    for (const [index, group] of skillGroups.entries()) {
      const existing = await prisma.portfolioSkillGroup.findFirst({
        where: { name: group.name },
      });
      const data = {
        name: group.name,
        category: group.category,
        items: group.items,
        sortOrder: index,
        isPublished: true,
      };

      if (existing) {
        await prisma.portfolioSkillGroup.update({ where: { id: existing.id }, data });
      } else {
        await prisma.portfolioSkillGroup.create({ data });
      }
    }

    for (const [index, item] of highlights.entries()) {
      const existing = await prisma.portfolioHighlight.findFirst({
        where: { label: item.label },
      });
      const data = {
        value: item.value,
        label: item.label,
        sublabel: item.sublabel,
        sortOrder: index,
        isPublished: true,
      };

      if (existing) {
        await prisma.portfolioHighlight.update({ where: { id: existing.id }, data });
      } else {
        await prisma.portfolioHighlight.create({ data });
      }
    }

    for (const [index, award] of awards.entries()) {
      const existing = await prisma.portfolioHighlight.findFirst({
        where: { label: award.title },
      });
      const data = {
        value: award.metric.value,
        label: award.title,
        sublabel: award.role,
        quote: award.quote,
        title: award.title,
        role: award.role,
        metric: award.metric,
        sortOrder: highlights.length + index,
        isPublished: true,
      };

      if (existing) {
        await prisma.portfolioHighlight.update({ where: { id: existing.id }, data });
      } else {
        await prisma.portfolioHighlight.create({ data });
      }
    }

    console.log("Seeded portfolio CMS content.");
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
