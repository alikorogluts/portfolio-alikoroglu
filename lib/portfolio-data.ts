import "server-only";

import {
  awards as fallbackAwards,
  experience as fallbackExperience,
  highlights as fallbackHighlights,
  profile as fallbackProfile,
  projects as fallbackProjects,
  skillGroups as fallbackSkillGroups,
} from "@/components/landing/portfolio-data";

export type PublicProfile = typeof fallbackProfile;
export type PublicProject = (typeof fallbackProjects)[number];
export type PublicExperience = (typeof fallbackExperience)[number];
export type PublicSkillGroup = (typeof fallbackSkillGroups)[number];
export type PublicHighlight = (typeof fallbackHighlights)[number];
export type PublicAward = (typeof fallbackAwards)[number];
export type PublicHero = {
  headlinePrefix: string;
  headlineTemplate: string;
  animatedWords: string[];
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  currentBuilding: string;
};

const fallbackHero: PublicHero = {
  headlinePrefix: fallbackProfile.name,
  headlineTemplate: "systems that",
  animatedWords: ["build", "ship", "detect", "scale"],
  description: `${fallbackProfile.role} | ${fallbackProfile.subtitle}. ${fallbackProfile.summary}`,
  primaryCtaLabel: "Email me",
  primaryCtaHref: `mailto:${fallbackProfile.email}`,
  secondaryCtaLabel: "View GitHub",
  secondaryCtaHref: fallbackProfile.github,
  currentBuilding: "DeepSecure",
};

async function getPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma;
}

function logPortfolioFallback(source: string, error: unknown) {
  console.error(`[portfolio-data] Falling back to static ${source}.`, error);
}

export type PortfolioDataDiagnostics = {
  profileFromDb: boolean;
  heroFromDb: boolean;
  publishedProjects: number;
  publishedExperience: number;
  publishedSkills: number;
  publishedHighlights: number;
  fallbackLikely: boolean;
};

export async function getPortfolioDataDiagnostics(): Promise<PortfolioDataDiagnostics | null> {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  try {
    const prisma = await getPrisma();
    const [profileCount, heroCount, publishedProjects, publishedExperience, publishedSkills, publishedHighlights] =
      await Promise.all([
        prisma.portfolioProfile.count(),
        prisma.portfolioHero.count({ where: { isActive: true } }),
        prisma.portfolioProject.count({ where: { isPublished: true } }),
        prisma.portfolioExperience.count({ where: { isPublished: true } }),
        prisma.portfolioSkillGroup.count({ where: { isPublished: true } }),
        prisma.portfolioHighlight.count({ where: { isPublished: true } }),
      ]);

    return {
      profileFromDb: profileCount > 0,
      heroFromDb: heroCount > 0,
      publishedProjects,
      publishedExperience,
      publishedSkills,
      publishedHighlights,
      fallbackLikely:
        profileCount === 0 ||
        heroCount === 0 ||
        publishedProjects === 0 ||
        publishedExperience === 0 ||
        publishedSkills === 0 ||
        publishedHighlights === 0,
    };
  } catch (error) {
    logPortfolioFallback("diagnostics", error);
    return {
      profileFromDb: false,
      heroFromDb: false,
      publishedProjects: 0,
      publishedExperience: 0,
      publishedSkills: 0,
      publishedHighlights: 0,
      fallbackLikely: true,
    };
  }
}

export async function getPortfolioProfile(): Promise<PublicProfile> {
  try {
    const prisma = await getPrisma();
    const profile = await prisma.portfolioProfile.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!profile) {
      return fallbackProfile;
    }

    return {
      name: profile.name,
      role: profile.role,
      subtitle: profile.subtitle ?? fallbackProfile.subtitle,
      location: profile.location ?? fallbackProfile.location,
      email: profile.email,
      phone: profile.phone ?? fallbackProfile.phone,
      github: profile.githubUrl ?? fallbackProfile.github,
      linkedin: profile.linkedinUrl ?? fallbackProfile.linkedin,
      grit: profile.websiteUrl ?? fallbackProfile.grit,
      cv: profile.cvUrl ?? fallbackProfile.cv,
      summary: profile.summary,
      stackLine: profile.stackLine ?? fallbackProfile.stackLine,
      availability: profile.availability ?? fallbackProfile.availability,
    };
  } catch (error) {
    logPortfolioFallback("profile", error);
    return fallbackProfile;
  }
}

export async function getPortfolioHero(profile: PublicProfile = fallbackProfile): Promise<PublicHero> {
  try {
    const prisma = await getPrisma();
    const hero = await prisma.portfolioHero.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!hero) {
      return {
        ...fallbackHero,
        headlinePrefix: profile.name,
        description: `${profile.role} | ${profile.subtitle}. ${profile.summary}`,
        primaryCtaHref: `mailto:${profile.email}`,
        secondaryCtaHref: profile.github,
      };
    }

    const animatedWords = Array.isArray(hero.animatedWords)
      ? hero.animatedWords.filter((item): item is string => typeof item === "string")
      : fallbackHero.animatedWords;

    return {
      headlinePrefix: hero.headlinePrefix,
      headlineTemplate: hero.headlineTemplate,
      animatedWords: animatedWords.length > 0 ? animatedWords : fallbackHero.animatedWords,
      description: hero.description ?? `${profile.role} | ${profile.subtitle}. ${profile.summary}`,
      primaryCtaLabel: hero.primaryCtaLabel ?? fallbackHero.primaryCtaLabel,
      primaryCtaHref: hero.primaryCtaHref ?? `mailto:${profile.email}`,
      secondaryCtaLabel: hero.secondaryCtaLabel ?? fallbackHero.secondaryCtaLabel,
      secondaryCtaHref: hero.secondaryCtaHref ?? profile.github,
      currentBuilding: hero.currentBuilding ?? fallbackHero.currentBuilding,
    };
  } catch (error) {
    logPortfolioFallback("hero", error);
    return {
      ...fallbackHero,
      headlinePrefix: profile.name,
      description: `${profile.role} | ${profile.subtitle}. ${profile.summary}`,
      primaryCtaHref: `mailto:${profile.email}`,
      secondaryCtaHref: profile.github,
    };
  }
}

export async function getPortfolioProjects(): Promise<PublicProject[]> {
  try {
    const prisma = await getPrisma();
    const projects = await prisma.portfolioProject.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (projects.length === 0) {
      return fallbackProjects;
    }

    return projects.map((project) => ({
      name: project.title,
      label: project.label ?? "",
      description: project.description,
      stack: project.stack ?? "",
      metric: project.metric ?? "",
    }));
  } catch (error) {
    logPortfolioFallback("projects", error);
    return fallbackProjects;
  }
}

export async function getPortfolioExperience(): Promise<PublicExperience[]> {
  try {
    const prisma = await getPrisma();
    const experience = await prisma.portfolioExperience.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (experience.length === 0) {
      return fallbackExperience;
    }

    return experience.map((item, index) => ({
      number: String(index + 1).padStart(2, "0"),
      title: item.company ?? item.title,
      subtitle: item.subtitle ?? [item.role, item.dateRange].filter(Boolean).join(" · "),
      description: item.description,
    }));
  } catch (error) {
    logPortfolioFallback("experience", error);
    return fallbackExperience;
  }
}

export async function getPortfolioSkills(): Promise<PublicSkillGroup[]> {
  try {
    const prisma = await getPrisma();
    const skillGroups = await prisma.portfolioSkillGroup.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (skillGroups.length === 0) {
      return fallbackSkillGroups;
    }

    return skillGroups.map((group) => ({
      name: group.name,
      category: group.category ?? "",
      items: Array.isArray(group.items) ? group.items.filter((item): item is string => typeof item === "string") : [],
    }));
  } catch (error) {
    logPortfolioFallback("skills", error);
    return fallbackSkillGroups;
  }
}

export async function getPortfolioHighlights(): Promise<PublicHighlight[]> {
  try {
    const prisma = await getPrisma();
    const highlights = await prisma.portfolioHighlight.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (highlights.length === 0) {
      return fallbackHighlights;
    }

    return highlights.map((highlight) => ({
      value: highlight.value,
      label: highlight.label,
      sublabel: highlight.sublabel ?? "",
    }));
  } catch (error) {
    logPortfolioFallback("highlights", error);
    return fallbackHighlights;
  }
}

export async function getPortfolioAwards(): Promise<PublicAward[]> {
  try {
    const prisma = await getPrisma();
    const awards = await prisma.portfolioHighlight.findMany({
      where: {
        isPublished: true,
        quote: { not: null },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (awards.length === 0) {
      return fallbackAwards;
    }

    return awards.map((award) => ({
      quote: award.quote ?? "",
      title: award.title ?? award.label,
      role: award.role ?? award.sublabel ?? "",
      metric:
        typeof award.metric === "object" && award.metric && !Array.isArray(award.metric) && "value" in award.metric && "label" in award.metric
          ? (award.metric as { value: string; label: string })
          : { value: award.value, label: award.label },
    }));
  } catch (error) {
    logPortfolioFallback("awards", error);
    return fallbackAwards;
  }
}
