import { findEntityCandidates, normalizeUserQuery, toSearchKey } from "./normalize-user-query";
import type { PortfolioEntity } from "./portfolio-entities";

export type AssistantLanguage = "tr" | "en";

export type AssistantProjectContext = {
  title: string;
  label: string | null;
  description: string | null;
  stack: string | null;
  metric: string | null;
};

export type AssistantSkillGroupContext = {
  name: string;
  category: string | null;
  items: string[];
};

export type AssistantContextInput = {
  profile: {
    name: string;
    role: string;
    subtitle: string | null;
    summary: string;
    stackLine: string | null;
  };
  projects: Array<{
    name: string;
    slug?: string;
    label: string | null;
    description: string | null;
    stack: string | null;
    metric: string | null;
    spotlightTitle?: string;
    spotlightSubtitle?: string;
    spotlightDescription?: string;
  }>;
  skillGroups: Array<{
    name: string;
    category: string | null;
    items: string[];
  }>;
  site: {
    contactFormEnabled: boolean;
    showDownloadCvButton: boolean;
  };
};

export type AssistantContext = {
  language: AssistantLanguage;
  normalizedQuestion: string;
  matchedEntities: string[];
  profile: AssistantContextInput["profile"];
  projects: AssistantProjectContext[];
  skillGroups: AssistantSkillGroupContext[];
  site: AssistantContextInput["site"];
};

const TURKISH_PATTERN =
  /\b(nedir|ne|hangi|nasıl|nasil|mi|mı|mu|mü|var|yok|kullanıyor|kullaniyor|işe|ise|yarar|anlat|proje|portföy|portfoy)\b/i;

const STOP_WORDS = new Set([
  "bu",
  "bir",
  "ve",
  "ile",
  "icin",
  "için",
  "the",
  "and",
  "what",
  "which",
  "does",
  "used",
  "here",
  "that",
  "this",
]);

function detectLanguage(question: string): AssistantLanguage {
  const normalized = normalizeUserQuery(question);

  if (/[çğıöşü]/i.test(normalized) || TURKISH_PATTERN.test(normalized)) {
    return "tr";
  }

  return "en";
}

function getSearchTokens(input: string): string[] {
  return toSearchKey(input)
    .split(" ")
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
}

function containsPhrase(text: string, phrase: string): boolean {
  return ` ${text} `.includes(` ${phrase} `);
}

function createProjectSearchText(project: AssistantContextInput["projects"][number]): string {
  return toSearchKey(
    [
      project.name,
      project.slug,
      project.label,
      project.description,
      project.stack,
      project.spotlightTitle,
      project.spotlightSubtitle,
      project.spotlightDescription,
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(" "),
  );
}

function entityMatchesText(entity: PortfolioEntity, searchText: string): boolean {
  return [entity.canonical, ...entity.aliases].some((alias) => containsPhrase(searchText, toSearchKey(alias)));
}

function scoreProject(question: string, projectSearchText: string, entities: PortfolioEntity[]): number {
  const entityScore = entities.reduce(
    (score, entity) => (entityMatchesText(entity, projectSearchText) ? score + 20 : score),
    0,
  );
  const tokenScore = getSearchTokens(question).reduce(
    (score, token) => (containsPhrase(projectSearchText, token) ? score + 1 : score),
    0,
  );

  return entityScore + tokenScore;
}

function scoreSkillGroup(question: string, group: AssistantContextInput["skillGroups"][number], entities: PortfolioEntity[]) {
  const groupSearchText = toSearchKey(
    [group.name, group.category, ...group.items].filter((value): value is string => Boolean(value?.trim())).join(" "),
  );
  const entityScore = entities.reduce(
    (score, entity) => (entityMatchesText(entity, groupSearchText) ? score + 12 : score),
    0,
  );
  const tokenScore = getSearchTokens(question).reduce(
    (score, token) => (containsPhrase(groupSearchText, token) ? score + 1 : score),
    0,
  );

  return entityScore + tokenScore;
}

function isBroadTechnologyQuestion(question: string): boolean {
  const key = toSearchKey(question);
  return ["teknoloji", "teknolojiler", "stack", "technologies", "technical stack"].some((phrase) =>
    key.includes(phrase),
  );
}

export function buildAssistantContext(question: string, input: AssistantContextInput): AssistantContext {
  const normalizedQuestion = normalizeUserQuery(question);
  const matchedEntityObjects = findEntityCandidates(normalizedQuestion);

  const projects = input.projects
    .map((project) => ({
      project,
      score: scoreProject(normalizedQuestion, createProjectSearchText(project), matchedEntityObjects),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map(({ project }) => ({
      title: project.name,
      label: project.label,
      description: project.description,
      stack: project.stack,
      metric: project.metric,
    }));

  const skillGroups = (
    isBroadTechnologyQuestion(normalizedQuestion)
      ? input.skillGroups.slice(0, 4)
      : input.skillGroups
          .map((group) => ({
            group,
            score: scoreSkillGroup(normalizedQuestion, group, matchedEntityObjects),
          }))
          .filter(({ score }) => score > 0)
          .sort((left, right) => right.score - left.score)
          .slice(0, 3)
          .map(({ group }) => group)
  ).map((group) => ({
      name: group.name,
      category: group.category,
      items: group.items,
    }));

  return {
    language: detectLanguage(normalizedQuestion),
    normalizedQuestion,
    matchedEntities: matchedEntityObjects.map((entity) => entity.canonical),
    profile: input.profile,
    projects,
    skillGroups,
    site: input.site,
  };
}
