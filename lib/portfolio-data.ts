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
export type PublicProject = (typeof fallbackProjects)[number] & {
  slug?: string;
  githubUrl?: string;
  demoUrl?: string;
  coverImageUrl?: string;
  spotlightTitle?: string;
  spotlightSubtitle?: string;
  spotlightDescription?: string;
  spotlightImageUrl?: string;
  spotlightMetricLabel?: string;
  spotlightMetricValue?: string;
  sortOrder?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  updatedAt?: string;
};
export type PublicExperience = (typeof fallbackExperience)[number] & {
  company?: string;
  role?: string;
  dateRange?: string;
  detail?: string;
};
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
  backgroundImageUrl: string;
};

export type PublicSiteSettings = {
  siteTitle: string;
  siteDescription: string;
  defaultLanguage: "en" | "tr";
  maintenanceMode: boolean;
  showAvailabilityBadge: boolean;
  showDownloadCvButton: boolean;
  showGithubButton: boolean;
  showEmailButton: boolean;
  contactFormEnabled: boolean;
  contactRecipientEmail: string;
  footerCopyrightText: string;
  analyticsEnabled: boolean;
  analyticsProvider: string;
  analyticsId: string;
  maintenanceTitle: string;
  maintenanceDescription: string;
  maintenanceExpectedBackAt: string;
  maintenanceImageUrl: string;
  ogImageUrl: string;
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
  backgroundImageUrl: "",
};

const fallbackSettings: PublicSiteSettings = {
  siteTitle: "Ali Koroglu - Full-Stack & Mobile Developer",
  siteDescription:
    "Portfolio of Ali Koroglu, a computer engineering senior building .NET, Next.js, Flutter, and Python ML systems.",
  defaultLanguage: "en",
  maintenanceMode: false,
  showAvailabilityBadge: true,
  showDownloadCvButton: true,
  showGithubButton: true,
  showEmailButton: true,
  contactFormEnabled: true,
  contactRecipientEmail: fallbackProfile.email,
  footerCopyrightText: `© ${new Date().getFullYear()} Ali Koroglu. Portfolio.`,
  analyticsEnabled: false,
  analyticsProvider: "",
  analyticsId: "",
  maintenanceTitle: "Portfolio updates in progress.",
  maintenanceDescription: "The portfolio is temporarily unavailable while updates are being applied.",
  maintenanceExpectedBackAt: "",
  maintenanceImageUrl: "/images/maintenance-visual.png",
  ogImageUrl: "",
};

async function getPrisma() {
  const { prisma, readWithRetry } = await import("@/lib/prisma");
  return { prisma, readWithRetry };
}

function logPortfolioFallback(source: string, error: unknown) {
  console.error(`[portfolio-data] Falling back to static ${source}.`, error);
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function nullableString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalString(value: unknown) {
  const normalized = nullableString(value);
  return normalized || undefined;
}

function stringArrayFromJson(value: unknown, fallback: string[] = []) {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => nullableString(item)).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function metricFromJson(value: unknown, fallback: { value: string; label: string }) {
  if (!isRecord(value)) return fallback;

  return {
    value: stringOrFallback(value.value, fallback.value),
    label: stringOrFallback(value.label, fallback.label),
  };
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
    const { prisma } = await getPrisma();
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
    const { prisma } = await getPrisma();
    const profile = await prisma.portfolioProfile.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!profile) {
      return fallbackProfile;
    }

    return {
      name: stringOrFallback(profile.name, fallbackProfile.name),
      role: stringOrFallback(profile.role, fallbackProfile.role),
      subtitle: stringOrFallback(profile.subtitle, fallbackProfile.subtitle),
      location: stringOrFallback(profile.location, fallbackProfile.location),
      email: stringOrFallback(profile.email, fallbackProfile.email),
      phone: stringOrFallback(profile.phone, fallbackProfile.phone),
      github: stringOrFallback(profile.githubUrl, fallbackProfile.github),
      linkedin: stringOrFallback(profile.linkedinUrl, fallbackProfile.linkedin),
      grit: stringOrFallback(profile.websiteUrl, fallbackProfile.grit),
      cv: stringOrFallback(profile.cvUrl, fallbackProfile.cv),
      summary: stringOrFallback(profile.summary, fallbackProfile.summary),
      stackLine: stringOrFallback(profile.stackLine, fallbackProfile.stackLine),
      availability: stringOrFallback(profile.availability, fallbackProfile.availability),
    };
  } catch (error) {
    logPortfolioFallback("profile", error);
    return fallbackProfile;
  }
}

export async function getSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const { prisma, readWithRetry } = await getPrisma();
    const settings = await readWithRetry(
      () =>
        prisma.siteSettings.findFirst({
          orderBy: { updatedAt: "desc" },
        }),
      "site settings lookup",
    );

    if (!settings) return fallbackSettings;

    return {
      siteTitle: settings.siteTitle,
      siteDescription: settings.siteDescription,
      defaultLanguage: settings.defaultLanguage === "tr" ? "tr" : "en",
      maintenanceMode: settings.maintenanceMode,
      showAvailabilityBadge: settings.showAvailabilityBadge,
      showDownloadCvButton: settings.showDownloadCvButton,
      showGithubButton: settings.showGithubButton,
      showEmailButton: settings.showEmailButton,
      contactFormEnabled: settings.contactFormEnabled,
      contactRecipientEmail: settings.contactRecipientEmail ?? fallbackProfile.email,
      footerCopyrightText: settings.footerCopyrightText ?? fallbackSettings.footerCopyrightText,
      analyticsEnabled: settings.analyticsEnabled,
      analyticsProvider: settings.analyticsProvider ?? "",
      analyticsId: settings.analyticsId ?? "",
      maintenanceTitle: stringOrFallback(settings.maintenanceTitle, fallbackSettings.maintenanceTitle),
      maintenanceDescription: stringOrFallback(settings.maintenanceDescription, fallbackSettings.maintenanceDescription),
      maintenanceExpectedBackAt: nullableString(settings.maintenanceExpectedBackAt),
      maintenanceImageUrl: stringOrFallback(settings.maintenanceImageUrl, fallbackSettings.maintenanceImageUrl),
      ogImageUrl: nullableString(settings.ogImageUrl),
    };
  } catch (error) {
    logPortfolioFallback("settings", error);
    return fallbackSettings;
  }
}

export async function getPortfolioHero(profile: PublicProfile = fallbackProfile): Promise<PublicHero> {
  try {
    const { prisma } = await getPrisma();
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

    const animatedWords = stringArrayFromJson(hero.animatedWords, fallbackHero.animatedWords);
    const primaryLabel = nullableString(hero.primaryCtaLabel);
    const primaryHref = nullableString(hero.primaryCtaHref);
    const secondaryLabel = nullableString(hero.secondaryCtaLabel);
    const secondaryHref = nullableString(hero.secondaryCtaHref);

    return {
      headlinePrefix: stringOrFallback(hero.headlinePrefix, profile.name),
      headlineTemplate: stringOrFallback(hero.headlineTemplate, fallbackHero.headlineTemplate),
      animatedWords: animatedWords.length > 0 ? animatedWords : fallbackHero.animatedWords,
      description: stringOrFallback(hero.description, `${profile.role} | ${profile.subtitle}. ${profile.summary}`),
      primaryCtaLabel: primaryLabel && primaryHref ? primaryLabel : fallbackHero.primaryCtaLabel,
      primaryCtaHref: primaryLabel && primaryHref ? primaryHref : `mailto:${profile.email}`,
      secondaryCtaLabel: secondaryLabel && secondaryHref ? secondaryLabel : fallbackHero.secondaryCtaLabel,
      secondaryCtaHref: secondaryLabel && secondaryHref ? secondaryHref : profile.github,
      currentBuilding: stringOrFallback(hero.currentBuilding, fallbackHero.currentBuilding),
      backgroundImageUrl: nullableString(hero.backgroundImageUrl),
    };
  } catch (error) {
    logPortfolioFallback("hero", error);
    return {
      ...fallbackHero,
      headlinePrefix: profile.name,
      description: `${profile.role} | ${profile.subtitle}. ${profile.summary}`,
      primaryCtaHref: `mailto:${profile.email}`,
      secondaryCtaHref: profile.github,
      backgroundImageUrl: "",
    };
  }
}

export async function getPortfolioProjects(): Promise<PublicProject[]> {
  try {
    const { prisma } = await getPrisma();
    const projects = await prisma.portfolioProject.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
    });

    if (projects.length === 0) {
      return fallbackProjects;
    }

    return projects.map((project) => ({
      name: stringOrFallback(project.title, "Untitled project"),
      slug: optionalString(project.slug),
      label: nullableString(project.label),
      description: nullableString(project.description),
      stack: nullableString(project.stack),
      metric: nullableString(project.metric),
      githubUrl: optionalString(project.githubUrl),
      demoUrl: optionalString(project.demoUrl),
      coverImageUrl: optionalString(project.coverImageUrl),
      spotlightTitle: optionalString(project.spotlightTitle),
      spotlightSubtitle: optionalString(project.spotlightSubtitle),
      spotlightDescription: optionalString(project.spotlightDescription),
      spotlightImageUrl: optionalString(project.spotlightImageUrl),
      spotlightMetricLabel: optionalString(project.spotlightMetricLabel),
      spotlightMetricValue: optionalString(project.spotlightMetricValue),
      sortOrder: project.sortOrder,
      isFeatured: project.isFeatured,
      isPublished: project.isPublished,
      updatedAt: project.updatedAt.toISOString(),
    }));
  } catch (error) {
    logPortfolioFallback("projects", error);
    return fallbackProjects;
  }
}

export async function getPortfolioExperience(): Promise<PublicExperience[]> {
  try {
    const { prisma } = await getPrisma();
    const experience = await prisma.portfolioExperience.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (experience.length === 0) {
      return fallbackExperience;
    }

    return experience.map((item, index) => ({
      number: String(index + 1).padStart(2, "0"),
      title: stringOrFallback(item.company, item.title),
      subtitle: nullableString(item.title),
      company: optionalString(item.company),
      role: optionalString(item.role),
      dateRange: optionalString(item.dateRange),
      detail: optionalString(item.subtitle),
      description: nullableString(item.description),
    }));
  } catch (error) {
    logPortfolioFallback("experience", error);
    return fallbackExperience;
  }
}

export async function getPortfolioSkills(): Promise<PublicSkillGroup[]> {
  try {
    const { prisma } = await getPrisma();
    const skillGroups = await prisma.portfolioSkillGroup.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (skillGroups.length === 0) {
      return fallbackSkillGroups;
    }

    return skillGroups.map((group) => ({
      name: stringOrFallback(group.name, "Skills"),
      category: nullableString(group.category),
      items: stringArrayFromJson(group.items),
    }));
  } catch (error) {
    logPortfolioFallback("skills", error);
    return fallbackSkillGroups;
  }
}

export async function getPortfolioHighlights(): Promise<PublicHighlight[]> {
  try {
    const { prisma } = await getPrisma();
    const highlights = await prisma.portfolioHighlight.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    if (highlights.length === 0) {
      return fallbackHighlights;
    }

    return highlights.map((highlight) => ({
      value: stringOrFallback(highlight.value, "0"),
      label: stringOrFallback(highlight.label, "Highlight"),
      sublabel: nullableString(highlight.sublabel),
    }));
  } catch (error) {
    logPortfolioFallback("highlights", error);
    return fallbackHighlights;
  }
}

export async function getPortfolioAwards(): Promise<PublicAward[]> {
  try {
    const { prisma } = await getPrisma();
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
      quote: nullableString(award.quote),
      title: stringOrFallback(award.title, award.label),
      role: stringOrFallback(award.role, nullableString(award.sublabel)),
      metric: metricFromJson(award.metric, {
        value: stringOrFallback(award.value, "0"),
        label: stringOrFallback(award.label, "Highlight"),
      }),
    }));
  } catch (error) {
    logPortfolioFallback("awards", error);
    return fallbackAwards;
  }
}
