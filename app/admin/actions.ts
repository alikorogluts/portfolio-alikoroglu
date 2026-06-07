"use server";

import { AuditAction } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkboxBoolean,
  commaSeparatedArray,
  optionalAbsoluteUrl,
  optionalEmail,
  optionalHrefWithMailto,
  optionalInteger,
  optionalTrimmedString,
  optionalUrlOrAssetPath,
  requiredEmail,
  requiredString,
  validationMessage,
} from "./validation";

const projectSchema = z.object({
  title: requiredString("Project title"),
  slug: optionalTrimmedString,
  label: optionalTrimmedString,
  description: requiredString("Project description"),
  stack: optionalTrimmedString,
  metric: optionalTrimmedString,
  githubUrl: optionalAbsoluteUrl,
  demoUrl: optionalAbsoluteUrl,
  coverImageUrl: optionalUrlOrAssetPath,
  spotlightTitle: optionalTrimmedString,
  spotlightSubtitle: optionalTrimmedString,
  spotlightDescription: optionalTrimmedString,
  spotlightImageUrl: optionalUrlOrAssetPath,
  spotlightMetricLabel: optionalTrimmedString,
  spotlightMetricValue: optionalTrimmedString,
  sortOrder: optionalInteger(0),
  isFeatured: checkboxBoolean,
  isPublished: checkboxBoolean,
});

const profileSchema = z.object({
  name: requiredString("Name"),
  role: requiredString("Role"),
  subtitle: optionalTrimmedString,
  summary: requiredString("Summary"),
  location: optionalTrimmedString,
  email: requiredEmail,
  phone: optionalTrimmedString,
  githubUrl: optionalAbsoluteUrl,
  linkedinUrl: optionalAbsoluteUrl,
  websiteUrl: optionalAbsoluteUrl,
  cvUrl: optionalUrlOrAssetPath,
  availability: optionalTrimmedString,
  stackLine: optionalTrimmedString,
});

const heroSchema = z.object({
  headlinePrefix: requiredString("Headline prefix"),
  headlineTemplate: requiredString("Headline template"),
  animatedWords: commaSeparatedArray.refine((items) => items.length > 0, "Enter at least one animated word."),
  description: optionalTrimmedString,
  primaryCtaLabel: optionalTrimmedString,
  primaryCtaHref: optionalHrefWithMailto,
  secondaryCtaLabel: optionalTrimmedString,
  secondaryCtaHref: optionalHrefWithMailto,
  currentBuilding: optionalTrimmedString,
  backgroundImageUrl: optionalUrlOrAssetPath,
  visualImageUrl: optionalUrlOrAssetPath,
});

const experienceSchema = z.object({
  id: optionalTrimmedString,
  company: optionalTrimmedString,
  role: optionalTrimmedString,
  dateRange: optionalTrimmedString,
  title: requiredString("Experience title"),
  subtitle: optionalTrimmedString,
  description: requiredString("Experience description"),
  sortOrder: optionalInteger(0),
  isPublished: checkboxBoolean,
});

const skillSchema = z.object({
  id: optionalTrimmedString,
  name: requiredString("Skill group name"),
  category: optionalTrimmedString,
  items: commaSeparatedArray.refine((items) => items.length > 0, "Enter at least one skill."),
  sortOrder: optionalInteger(0),
  isPublished: checkboxBoolean,
});

const highlightSchema = z.object({
  id: optionalTrimmedString,
  value: requiredString("Highlight value"),
  label: requiredString("Highlight label"),
  sublabel: optionalTrimmedString,
  quote: optionalTrimmedString,
  title: optionalTrimmedString,
  role: optionalTrimmedString,
  metricValue: optionalTrimmedString,
  metricLabel: optionalTrimmedString,
  sortOrder: optionalInteger(0),
  isPublished: checkboxBoolean,
});

const settingsSchema = z.object({
  siteTitle: requiredString("Site title"),
  siteDescription: requiredString("Site description"),
  defaultLanguage: z.enum(["en", "tr"]).default("en"),
  maintenanceMode: checkboxBoolean,
  showAvailabilityBadge: checkboxBoolean,
  showDownloadCvButton: checkboxBoolean,
  showGithubButton: checkboxBoolean,
  showEmailButton: checkboxBoolean,
  contactFormEnabled: checkboxBoolean,
  contactRecipientEmail: optionalEmail,
  footerCopyrightText: optionalTrimmedString,
  analyticsEnabled: checkboxBoolean,
  analyticsProvider: optionalTrimmedString,
  analyticsId: optionalTrimmedString,
  maintenanceTitle: optionalTrimmedString,
  maintenanceDescription: optionalTrimmedString,
  maintenanceExpectedBackAt: optionalTrimmedString,
  maintenanceImageUrl: optionalUrlOrAssetPath,
  ogImageUrl: optionalUrlOrAssetPath,
});

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"),
    userAgent: headerStore.get("user-agent"),
  };
}

function cleanOptional(value?: string | null) {
  return value ?? null;
}

function successUrl(path: string, message: string) {
  return `${path}?success=${encodeURIComponent(message)}`;
}

function errorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

function parseFormOrRedirect<T extends z.ZodTypeAny>(schema: T, formData: FormData, path: string): z.infer<T> {
  const parsed = schema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect(errorUrl(path, validationMessage(parsed.error)));
  }

  return parsed.data;
}

function parseIdOrRedirect(formData: FormData, field: string, path: string, label = "Record") {
  const parsed = requiredString(label).safeParse(formData.get(field));

  if (!parsed.success) {
    redirect(errorUrl(path, validationMessage(parsed.error)));
  }

  return parsed.data;
}

async function writeAuditLog({
  userId,
  action,
  entityType,
  entityId,
  summary,
}: {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  summary: string;
}) {
  const metadata = await getRequestMetadata();

  await prisma.adminAuditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      summary,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
    },
  });
}

export async function createProject(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseFormOrRedirect(projectSchema, formData, "/admin/projects");

  const project = await prisma.portfolioProject.create({
    data: {
      title: parsed.title,
      slug: cleanOptional(parsed.slug),
      label: cleanOptional(parsed.label),
      description: parsed.description,
      stack: cleanOptional(parsed.stack),
      metric: cleanOptional(parsed.metric),
      githubUrl: cleanOptional(parsed.githubUrl),
      demoUrl: cleanOptional(parsed.demoUrl),
      coverImageUrl: cleanOptional(parsed.coverImageUrl),
      spotlightTitle: cleanOptional(parsed.spotlightTitle),
      spotlightSubtitle: cleanOptional(parsed.spotlightSubtitle),
      spotlightDescription: cleanOptional(parsed.spotlightDescription),
      spotlightImageUrl: cleanOptional(parsed.spotlightImageUrl),
      spotlightMetricLabel: cleanOptional(parsed.spotlightMetricLabel),
      spotlightMetricValue: cleanOptional(parsed.spotlightMetricValue),
      sortOrder: parsed.sortOrder,
      isFeatured: parsed.isFeatured,
      isPublished: parsed.isPublished,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.PROJECT_CREATED,
    entityType: "PortfolioProject",
    entityId: project.id,
    summary: `Project created: ${project.title}`,
  });

  revalidatePath("/admin/projects");
  revalidatePath("/");
  redirect(successUrl("/admin/projects", "Project created successfully."));
}

export async function updateProject(projectId: string, formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseFormOrRedirect(projectSchema, formData, "/admin/projects");

  const project = await prisma.portfolioProject.update({
    where: { id: projectId },
    data: {
      title: parsed.title,
      slug: cleanOptional(parsed.slug),
      label: cleanOptional(parsed.label),
      description: parsed.description,
      stack: cleanOptional(parsed.stack),
      metric: cleanOptional(parsed.metric),
      githubUrl: cleanOptional(parsed.githubUrl),
      demoUrl: cleanOptional(parsed.demoUrl),
      coverImageUrl: cleanOptional(parsed.coverImageUrl),
      spotlightTitle: cleanOptional(parsed.spotlightTitle),
      spotlightSubtitle: cleanOptional(parsed.spotlightSubtitle),
      spotlightDescription: cleanOptional(parsed.spotlightDescription),
      spotlightImageUrl: cleanOptional(parsed.spotlightImageUrl),
      spotlightMetricLabel: cleanOptional(parsed.spotlightMetricLabel),
      spotlightMetricValue: cleanOptional(parsed.spotlightMetricValue),
      sortOrder: parsed.sortOrder,
      isFeatured: parsed.isFeatured,
      isPublished: parsed.isPublished,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.PROJECT_UPDATED,
    entityType: "PortfolioProject",
    entityId: project.id,
    summary: `Project updated: ${project.title}`,
  });

  revalidatePath("/admin/projects");
  revalidatePath("/");
  redirect(successUrl("/admin/projects", "Project updated successfully."));
}

export async function deleteProject(formData: FormData) {
  const user = await requireAdmin();
  const projectId = parseIdOrRedirect(formData, "projectId", "/admin/projects", "Project");
  const project = await prisma.portfolioProject.delete({
    where: { id: projectId },
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.PROJECT_DELETED,
    entityType: "PortfolioProject",
    entityId: project.id,
    summary: `Project deleted: ${project.title}`,
  });

  revalidatePath("/admin/projects");
  revalidatePath("/");
  redirect(successUrl("/admin/projects", "Project deleted successfully."));
}

export async function markMessageRead(formData: FormData) {
  const user = await requireAdmin();
  const messageId = parseIdOrRedirect(formData, "messageId", "/admin/messages", "Message");
  const message = await prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.MESSAGE_READ,
    entityType: "ContactMessage",
    entityId: message.id,
    summary: `Message marked as read: ${message.subject}`,
  });

  revalidatePath("/admin/messages");
  redirect(successUrl("/admin/messages", "Message marked as read."));
}

export async function markMessageUnread(formData: FormData) {
  const user = await requireAdmin();
  const messageId = parseIdOrRedirect(formData, "messageId", "/admin/messages", "Message");
  const message = await prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      isRead: false,
      readAt: null,
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.MESSAGE_UNREAD,
    entityType: "ContactMessage",
    entityId: message.id,
    summary: `Message marked as unread: ${message.subject}`,
  });

  revalidatePath("/admin/messages");
  redirect(successUrl("/admin/messages", "Message marked as unread."));
}

export async function archiveMessage(formData: FormData) {
  const user = await requireAdmin();
  const messageId = parseIdOrRedirect(formData, "messageId", "/admin/messages", "Message");
  const message = await prisma.contactMessage.update({
    where: { id: messageId },
    data: {
      archivedAt: new Date(),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.MESSAGE_ARCHIVED,
    entityType: "ContactMessage",
    entityId: message.id,
    summary: `Message archived: ${message.subject}`,
  });

  revalidatePath("/admin/messages");
  redirect(successUrl("/admin/messages", "Message archived."));
}

export async function deleteMessage(formData: FormData) {
  const user = await requireAdmin();
  const messageId = parseIdOrRedirect(formData, "messageId", "/admin/messages", "Message");
  const message = await prisma.contactMessage.delete({
    where: { id: messageId },
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.MESSAGE_DELETED,
    entityType: "ContactMessage",
    entityId: message.id,
    summary: `Message deleted: ${message.subject}`,
  });

  revalidatePath("/admin/messages");
  redirect(successUrl("/admin/messages", "Message deleted successfully."));
}

export async function updateProfile(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseFormOrRedirect(profileSchema, formData, "/admin/profile");
  const existing = await prisma.portfolioProfile.findFirst({ orderBy: { updatedAt: "desc" } });

  const profile = existing
    ? await prisma.portfolioProfile.update({
        where: { id: existing.id },
        data: {
          ...parsed,
          subtitle: cleanOptional(parsed.subtitle),
          location: cleanOptional(parsed.location),
          phone: cleanOptional(parsed.phone),
          githubUrl: cleanOptional(parsed.githubUrl),
          linkedinUrl: cleanOptional(parsed.linkedinUrl),
          websiteUrl: cleanOptional(parsed.websiteUrl),
          cvUrl: cleanOptional(parsed.cvUrl),
          availability: cleanOptional(parsed.availability),
          stackLine: cleanOptional(parsed.stackLine),
        },
      })
    : await prisma.portfolioProfile.create({
        data: {
          ...parsed,
          subtitle: cleanOptional(parsed.subtitle),
          location: cleanOptional(parsed.location),
          phone: cleanOptional(parsed.phone),
          githubUrl: cleanOptional(parsed.githubUrl),
          linkedinUrl: cleanOptional(parsed.linkedinUrl),
          websiteUrl: cleanOptional(parsed.websiteUrl),
          cvUrl: cleanOptional(parsed.cvUrl),
          availability: cleanOptional(parsed.availability),
          stackLine: cleanOptional(parsed.stackLine),
        },
      });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.PROFILE_UPDATED,
    entityType: "PortfolioProfile",
    entityId: profile.id,
    summary: "Profile content updated.",
  });

  revalidatePath("/admin/profile");
  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect(successUrl("/admin/profile", "Profile saved successfully."));
}

export async function updateHero(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseFormOrRedirect(heroSchema, formData, "/admin/hero");
  const existing = await prisma.portfolioHero.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } });
  const data = {
    headlinePrefix: parsed.headlinePrefix,
    headlineTemplate: parsed.headlineTemplate,
    animatedWords: parsed.animatedWords,
    description: cleanOptional(parsed.description),
    primaryCtaLabel: cleanOptional(parsed.primaryCtaLabel),
    primaryCtaHref: cleanOptional(parsed.primaryCtaHref),
    secondaryCtaLabel: cleanOptional(parsed.secondaryCtaLabel),
    secondaryCtaHref: cleanOptional(parsed.secondaryCtaHref),
    currentBuilding: cleanOptional(parsed.currentBuilding),
    backgroundImageUrl: cleanOptional(parsed.backgroundImageUrl),
    visualImageUrl: cleanOptional(parsed.visualImageUrl),
    isActive: true,
  };

  const hero = existing
    ? await prisma.portfolioHero.update({ where: { id: existing.id }, data })
    : await prisma.portfolioHero.create({ data });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.HERO_UPDATED,
    entityType: "PortfolioHero",
    entityId: hero.id,
    summary: "Hero content updated.",
  });

  revalidatePath("/admin/hero");
  revalidatePath("/");
  redirect(successUrl("/admin/hero", "Hero saved successfully."));
}

export async function saveExperience(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseFormOrRedirect(experienceSchema, formData, "/admin/experience");
  const data = {
    title: parsed.title,
    company: cleanOptional(parsed.company),
    role: cleanOptional(parsed.role),
    dateRange: cleanOptional(parsed.dateRange),
    subtitle: cleanOptional(parsed.subtitle),
    description: parsed.description,
    sortOrder: parsed.sortOrder,
    isPublished: parsed.isPublished,
  };
  const item = parsed.id
    ? await prisma.portfolioExperience.update({ where: { id: parsed.id }, data })
    : await prisma.portfolioExperience.create({ data });

  await writeAuditLog({
    userId: user.id,
    action: parsed.id ? AuditAction.EXPERIENCE_UPDATED : AuditAction.EXPERIENCE_CREATED,
    entityType: "PortfolioExperience",
    entityId: item.id,
    summary: `Experience saved: ${item.title}`,
  });
  revalidatePath("/admin/experience");
  revalidatePath("/");
  redirect(successUrl("/admin/experience", parsed.id ? "Experience updated successfully." : "Experience created successfully."));
}

export async function deleteExperience(formData: FormData) {
  const user = await requireAdmin();
  const id = parseIdOrRedirect(formData, "id", "/admin/experience", "Experience");
  const item = await prisma.portfolioExperience.delete({ where: { id } });
  await writeAuditLog({ userId: user.id, action: AuditAction.EXPERIENCE_DELETED, entityType: "PortfolioExperience", entityId: item.id, summary: `Experience deleted: ${item.title}` });
  revalidatePath("/admin/experience");
  revalidatePath("/");
  redirect(successUrl("/admin/experience", "Experience deleted successfully."));
}

export async function saveSkill(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseFormOrRedirect(skillSchema, formData, "/admin/skills");
  const data = {
    name: parsed.name,
    category: cleanOptional(parsed.category),
    items: parsed.items,
    sortOrder: parsed.sortOrder,
    isPublished: parsed.isPublished,
  };
  const item = parsed.id
    ? await prisma.portfolioSkillGroup.update({ where: { id: parsed.id }, data })
    : await prisma.portfolioSkillGroup.create({ data });
  await writeAuditLog({ userId: user.id, action: parsed.id ? AuditAction.SKILL_UPDATED : AuditAction.SKILL_CREATED, entityType: "PortfolioSkillGroup", entityId: item.id, summary: `Skill group saved: ${item.name}` });
  revalidatePath("/admin/skills");
  revalidatePath("/");
  redirect(successUrl("/admin/skills", parsed.id ? "Skill group updated successfully." : "Skill group created successfully."));
}

export async function deleteSkill(formData: FormData) {
  const user = await requireAdmin();
  const id = parseIdOrRedirect(formData, "id", "/admin/skills", "Skill group");
  const item = await prisma.portfolioSkillGroup.delete({ where: { id } });
  await writeAuditLog({ userId: user.id, action: AuditAction.SKILL_DELETED, entityType: "PortfolioSkillGroup", entityId: item.id, summary: `Skill group deleted: ${item.name}` });
  revalidatePath("/admin/skills");
  revalidatePath("/");
  redirect(successUrl("/admin/skills", "Skill group deleted successfully."));
}

export async function saveHighlight(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseFormOrRedirect(highlightSchema, formData, "/admin/highlights");
  const metric = parsed.metricValue || parsed.metricLabel ? { value: parsed.metricValue ?? "", label: parsed.metricLabel ?? "" } : undefined;
  const data = {
    value: parsed.value,
    label: parsed.label,
    sublabel: cleanOptional(parsed.sublabel),
    quote: cleanOptional(parsed.quote),
    title: cleanOptional(parsed.title),
    role: cleanOptional(parsed.role),
    metric,
    sortOrder: parsed.sortOrder,
    isPublished: parsed.isPublished,
  };
  const item = parsed.id
    ? await prisma.portfolioHighlight.update({ where: { id: parsed.id }, data })
    : await prisma.portfolioHighlight.create({ data });
  await writeAuditLog({ userId: user.id, action: parsed.id ? AuditAction.HIGHLIGHT_UPDATED : AuditAction.HIGHLIGHT_CREATED, entityType: "PortfolioHighlight", entityId: item.id, summary: `Highlight saved: ${item.label}` });
  revalidatePath("/admin/highlights");
  revalidatePath("/");
  redirect(successUrl("/admin/highlights", parsed.id ? "Highlight updated successfully." : "Highlight created successfully."));
}

export async function deleteHighlight(formData: FormData) {
  const user = await requireAdmin();
  const id = parseIdOrRedirect(formData, "id", "/admin/highlights", "Highlight");
  const item = await prisma.portfolioHighlight.delete({ where: { id } });
  await writeAuditLog({ userId: user.id, action: AuditAction.HIGHLIGHT_DELETED, entityType: "PortfolioHighlight", entityId: item.id, summary: `Highlight deleted: ${item.label}` });
  revalidatePath("/admin/highlights");
  revalidatePath("/");
  redirect(successUrl("/admin/highlights", "Highlight deleted successfully."));
}

export async function updateSettings(formData: FormData) {
  const user = await requireAdmin();
  const parsed = parseFormOrRedirect(settingsSchema, formData, "/admin/settings");
  const existing = await prisma.siteSettings.findFirst({ orderBy: { updatedAt: "desc" } });
  const data = {
    siteTitle: parsed.siteTitle,
    siteDescription: parsed.siteDescription,
    defaultLanguage: parsed.defaultLanguage,
    maintenanceMode: parsed.maintenanceMode,
    showAvailabilityBadge: parsed.showAvailabilityBadge,
    showDownloadCvButton: parsed.showDownloadCvButton,
    showGithubButton: parsed.showGithubButton,
    showEmailButton: parsed.showEmailButton,
    contactFormEnabled: parsed.contactFormEnabled,
    contactRecipientEmail: cleanOptional(parsed.contactRecipientEmail),
    footerCopyrightText: cleanOptional(parsed.footerCopyrightText),
    analyticsEnabled: parsed.analyticsEnabled,
    analyticsProvider: cleanOptional(parsed.analyticsProvider),
    analyticsId: cleanOptional(parsed.analyticsId),
    maintenanceTitle: cleanOptional(parsed.maintenanceTitle),
    maintenanceDescription: cleanOptional(parsed.maintenanceDescription),
    maintenanceExpectedBackAt: cleanOptional(parsed.maintenanceExpectedBackAt),
    maintenanceImageUrl: cleanOptional(parsed.maintenanceImageUrl),
    ogImageUrl: cleanOptional(parsed.ogImageUrl),
  };
  const settings = existing
    ? await prisma.siteSettings.update({ where: { id: existing.id }, data })
    : await prisma.siteSettings.create({ data });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.SETTINGS_UPDATED,
    entityType: "SiteSettings",
    entityId: settings.id,
    summary: "Site visibility settings updated.",
  });

  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect(successUrl("/admin/settings", "Settings saved successfully."));
}
