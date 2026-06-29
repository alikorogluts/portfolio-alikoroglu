import { PORTFOLIO_ENTITIES, type PortfolioEntity } from "./portfolio-entities";

const PROTECTED_SEGMENT_PATTERN =
  /(```[\s\S]*?```|`[^`]*`|https?:\/\/\S+|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\.{0,2}\/)?(?:[\w.-]+\/)+[\w.-]+|[A-Za-z0-9_-]{24,})/g;

function splitProtectedSegments(input: string) {
  const segments: Array<{ value: string; protected: boolean }> = [];
  let lastIndex = 0;

  for (const match of input.matchAll(PROTECTED_SEGMENT_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ value: input.slice(lastIndex, index), protected: false });
    }
    segments.push({ value: match[0], protected: true });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < input.length) {
    segments.push({ value: input.slice(lastIndex), protected: false });
  }

  return segments;
}

export function normalizeUserQuery(input: string): string {
  const normalized = input.normalize("NFC").trim();
  const segments = splitProtectedSegments(normalized);

  return segments
    .map((segment) => (segment.protected ? segment.value : segment.value.replace(/\s+/g, " ")))
    .join("")
    .trim();
}

export function toSearchKey(input: string): string {
  return normalizeUserQuery(input)
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

// Bu katman kullanıcı mesajını yeniden yazmak için değil, retrieval aşamasında güvenli aday entity bulmak içindir.
export function findEntityCandidates(input: string): PortfolioEntity[] {
  const searchKey = toSearchKey(input);
  const paddedSearchKey = ` ${searchKey} `;

  return PORTFOLIO_ENTITIES.filter((entity) =>
    [entity.canonical, ...entity.aliases].some((alias) => {
      const aliasKey = toSearchKey(alias);
      return searchKey === aliasKey || paddedSearchKey.includes(` ${aliasKey} `);
    }),
  );
}
