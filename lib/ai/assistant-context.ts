import "server-only";

import {
  getPortfolioProfile,
  getPortfolioProjects,
  getPortfolioSkills,
  getSiteSettings,
} from "@/lib/portfolio-data";

import { buildAssistantContext, type AssistantContext } from "./assistant-context-core";

export async function getAssistantContext(question: string): Promise<AssistantContext> {
  const [profile, projects, skillGroups, settings] = await Promise.all([
    getPortfolioProfile(),
    getPortfolioProjects(),
    getPortfolioSkills(),
    getSiteSettings(),
  ]);

  return buildAssistantContext(question, {
    // Intentionally omit email, phone, location, URLs, admin data, and contact messages.
    profile: {
      name: profile.name,
      role: profile.role,
      subtitle: profile.subtitle,
      summary: profile.summary,
      stackLine: profile.stackLine,
    },
    projects: projects.map((project) => ({
      name: project.name,
      slug: project.slug,
      label: project.label,
      description: project.description,
      stack: project.stack,
      metric: project.metric,
      spotlightTitle: project.spotlightTitle,
      spotlightSubtitle: project.spotlightSubtitle,
      spotlightDescription: project.spotlightDescription,
    })),
    skillGroups,
    site: {
      contactFormEnabled: settings.contactFormEnabled,
      showDownloadCvButton: settings.showDownloadCvButton,
    },
  });
}
