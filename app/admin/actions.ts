"use server";

import { AuditAction } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const projectSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  label: z.string().trim().optional(),
  description: z.string().trim().min(1),
  stack: z.string().trim().optional(),
  githubUrl: z.string().trim().url().optional().or(z.literal("")),
  demoUrl: z.string().trim().url().optional().or(z.literal("")),
  coverImageUrl: z.string().trim().url().optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.coerce.boolean().default(false),
});

const profileSchema = z.object({
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
  subtitle: z.string().trim().optional(),
  summary: z.string().trim().min(1),
  location: z.string().trim().optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  githubUrl: z.string().trim().url().optional().or(z.literal("")),
  linkedinUrl: z.string().trim().url().optional().or(z.literal("")),
  websiteUrl: z.string().trim().url().optional().or(z.literal("")),
  cvUrl: z.string().trim().optional(),
  availability: z.string().trim().optional(),
  stackLine: z.string().trim().optional(),
});

const heroSchema = z.object({
  headlinePrefix: z.string().trim().min(1),
  headlineTemplate: z.string().trim().min(1),
  animatedWords: z.string().trim().min(1),
  description: z.string().trim().optional(),
  primaryCtaLabel: z.string().trim().optional(),
  primaryCtaHref: z.string().trim().optional(),
  secondaryCtaLabel: z.string().trim().optional(),
  secondaryCtaHref: z.string().trim().optional(),
  currentBuilding: z.string().trim().optional(),
});

const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().trim().optional(),
  role: z.string().trim().optional(),
  dateRange: z.string().trim().optional(),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().optional(),
  description: z.string().trim().min(1),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.coerce.boolean().default(false),
});

const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  category: z.string().trim().optional(),
  items: z.string().trim().min(1),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.coerce.boolean().default(false),
});

const highlightSchema = z.object({
  id: z.string().optional(),
  value: z.string().trim().min(1),
  label: z.string().trim().min(1),
  sublabel: z.string().trim().optional(),
  quote: z.string().trim().optional(),
  title: z.string().trim().optional(),
  role: z.string().trim().optional(),
  metricValue: z.string().trim().optional(),
  metricLabel: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().default(0),
  isPublished: z.coerce.boolean().default(false),
});

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? headerStore.get("x-real-ip"),
    userAgent: headerStore.get("user-agent"),
  };
}

function cleanOptional(value?: string) {
  return value?.trim() ? value.trim() : null;
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
  const parsed = projectSchema.parse(Object.fromEntries(formData));

  const project = await prisma.portfolioProject.create({
    data: {
      title: parsed.title,
      slug: cleanOptional(parsed.slug),
      label: cleanOptional(parsed.label),
      description: parsed.description,
      stack: cleanOptional(parsed.stack),
      githubUrl: cleanOptional(parsed.githubUrl),
      demoUrl: cleanOptional(parsed.demoUrl),
      coverImageUrl: cleanOptional(parsed.coverImageUrl),
      sortOrder: parsed.sortOrder,
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
  redirect("/admin/projects");
}

export async function updateProject(projectId: string, formData: FormData) {
  const user = await requireAdmin();
  const parsed = projectSchema.parse(Object.fromEntries(formData));

  const project = await prisma.portfolioProject.update({
    where: { id: projectId },
    data: {
      title: parsed.title,
      slug: cleanOptional(parsed.slug),
      label: cleanOptional(parsed.label),
      description: parsed.description,
      stack: cleanOptional(parsed.stack),
      githubUrl: cleanOptional(parsed.githubUrl),
      demoUrl: cleanOptional(parsed.demoUrl),
      coverImageUrl: cleanOptional(parsed.coverImageUrl),
      sortOrder: parsed.sortOrder,
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
  redirect("/admin/projects");
}

export async function deleteProject(formData: FormData) {
  const user = await requireAdmin();
  const projectId = z.string().min(1).parse(formData.get("projectId"));
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
}

export async function markMessageRead(formData: FormData) {
  const user = await requireAdmin();
  const messageId = z.string().min(1).parse(formData.get("messageId"));
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
}

export async function deleteMessage(formData: FormData) {
  const user = await requireAdmin();
  const messageId = z.string().min(1).parse(formData.get("messageId"));
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
}

export async function updateProfile(formData: FormData) {
  const user = await requireAdmin();
  const parsed = profileSchema.parse(Object.fromEntries(formData));
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
}

export async function updateHero(formData: FormData) {
  const user = await requireAdmin();
  const parsed = heroSchema.parse(Object.fromEntries(formData));
  const existing = await prisma.portfolioHero.findFirst({ where: { isActive: true }, orderBy: { updatedAt: "desc" } });
  const animatedWords = parsed.animatedWords.split(",").map((word) => word.trim()).filter(Boolean);
  const data = {
    headlinePrefix: parsed.headlinePrefix,
    headlineTemplate: parsed.headlineTemplate,
    animatedWords,
    description: cleanOptional(parsed.description),
    primaryCtaLabel: cleanOptional(parsed.primaryCtaLabel),
    primaryCtaHref: cleanOptional(parsed.primaryCtaHref),
    secondaryCtaLabel: cleanOptional(parsed.secondaryCtaLabel),
    secondaryCtaHref: cleanOptional(parsed.secondaryCtaHref),
    currentBuilding: cleanOptional(parsed.currentBuilding),
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
}

export async function saveExperience(formData: FormData) {
  const user = await requireAdmin();
  const parsed = experienceSchema.parse(Object.fromEntries(formData));
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
}

export async function deleteExperience(formData: FormData) {
  const user = await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const item = await prisma.portfolioExperience.delete({ where: { id } });
  await writeAuditLog({ userId: user.id, action: AuditAction.EXPERIENCE_DELETED, entityType: "PortfolioExperience", entityId: item.id, summary: `Experience deleted: ${item.title}` });
  revalidatePath("/admin/experience");
  revalidatePath("/");
}

export async function saveSkill(formData: FormData) {
  const user = await requireAdmin();
  const parsed = skillSchema.parse(Object.fromEntries(formData));
  const data = {
    name: parsed.name,
    category: cleanOptional(parsed.category),
    items: parsed.items.split(",").map((item) => item.trim()).filter(Boolean),
    sortOrder: parsed.sortOrder,
    isPublished: parsed.isPublished,
  };
  const item = parsed.id
    ? await prisma.portfolioSkillGroup.update({ where: { id: parsed.id }, data })
    : await prisma.portfolioSkillGroup.create({ data });
  await writeAuditLog({ userId: user.id, action: parsed.id ? AuditAction.SKILL_UPDATED : AuditAction.SKILL_CREATED, entityType: "PortfolioSkillGroup", entityId: item.id, summary: `Skill group saved: ${item.name}` });
  revalidatePath("/admin/skills");
  revalidatePath("/");
}

export async function deleteSkill(formData: FormData) {
  const user = await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const item = await prisma.portfolioSkillGroup.delete({ where: { id } });
  await writeAuditLog({ userId: user.id, action: AuditAction.SKILL_DELETED, entityType: "PortfolioSkillGroup", entityId: item.id, summary: `Skill group deleted: ${item.name}` });
  revalidatePath("/admin/skills");
  revalidatePath("/");
}

export async function saveHighlight(formData: FormData) {
  const user = await requireAdmin();
  const parsed = highlightSchema.parse(Object.fromEntries(formData));
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
}

export async function deleteHighlight(formData: FormData) {
  const user = await requireAdmin();
  const id = z.string().min(1).parse(formData.get("id"));
  const item = await prisma.portfolioHighlight.delete({ where: { id } });
  await writeAuditLog({ userId: user.id, action: AuditAction.HIGHLIGHT_DELETED, entityType: "PortfolioHighlight", entityId: item.id, summary: `Highlight deleted: ${item.label}` });
  revalidatePath("/admin/highlights");
  revalidatePath("/");
}
