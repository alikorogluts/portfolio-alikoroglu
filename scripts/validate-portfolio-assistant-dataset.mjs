import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const dataDir = join(root, "data", "portfolio-assistant");

function readJson(fileName) {
  return JSON.parse(readFileSync(join(dataDir, fileName), "utf8"));
}

function toSearchKey(input) {
  return input
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

function validateJsonl(fileName) {
  const filePath = join(dataDir, fileName);
  const content = readFileSync(filePath, "utf8").trim();
  if (!content) throw new Error(`${fileName} is empty`);

  return content.split("\n").map((line, index) => {
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      throw new Error(`${fileName}:${index + 1} is not valid JSON: ${error.message}`);
    }

    if (!Array.isArray(record.messages)) {
      throw new Error(`${fileName}:${index + 1} missing messages array`);
    }

    const roles = record.messages.map((message) => message.role).join(",");
    if (roles !== "system,user,assistant") {
      throw new Error(`${fileName}:${index + 1} has invalid roles: ${roles}`);
    }

    for (const message of record.messages) {
      if (typeof message.content !== "string" || message.content.trim().length === 0) {
        throw new Error(`${fileName}:${index + 1} has empty content`);
      }
    }

    return {
      fileName,
      line: index + 1,
      user: record.messages[1].content,
      assistant: record.messages[2].content,
    };
  });
}

function validateDuplicates(records) {
  const seenPairs = new Map();
  for (const record of records) {
    const key = `${toSearchKey(record.user)}\n${toSearchKey(record.assistant)}`;
    if (seenPairs.has(key)) {
      const first = seenPairs.get(key);
      throw new Error(
        `Duplicate user+assistant pair: ${first.fileName}:${first.line} and ${record.fileName}:${record.line}`,
      );
    }
    seenPairs.set(key, record);
  }
}

function validateNearDuplicates(trainRecords, evalRecords) {
  const trainKeys = new Map(trainRecords.map((record) => [toSearchKey(`${record.user} ${record.assistant}`), record]));
  const nearMatches = [];

  for (const record of evalRecords) {
    const key = toSearchKey(`${record.user} ${record.assistant}`);
    if (trainKeys.has(key)) {
      const trainRecord = trainKeys.get(key);
      nearMatches.push(`${trainRecord.fileName}:${trainRecord.line} ~= ${record.fileName}:${record.line}`);
    }
  }

  if (nearMatches.length > 0) {
    throw new Error(`Train/eval near duplicate examples found:\n${nearMatches.join("\n")}`);
  }
}

function looksEnglish(text) {
  const normalized = text.toLocaleLowerCase("en");
  const englishSignals = [
    "the",
    "and",
    "is",
    "are",
    "can",
    "cannot",
    "does",
    "what",
    "how",
    "where",
    "give",
    "me",
    "this",
    "limited",
    "should",
    "not",
    "repository",
    "portfolio",
    "contact",
  ];
  const turkishSignals = [" ş", " ğ", " ü", " ç", " ö", "ı", "değil", "için", "kullanıcı", "gizli", "paylaş"];
  return englishSignals.some((signal) => normalized.includes(signal)) && !turkishSignals.some((signal) => normalized.includes(signal));
}

function looksTurkish(text) {
  const normalized = text.toLocaleLowerCase("tr");
  const turkishSignals = [
    "repo",
    "portföy",
    "için",
    "kullan",
    "gizli",
    "bilgi",
    "proje",
    "site",
    "değil",
    "yer al",
    "olarak",
    "ile",
    "ve",
    "var",
    "yok",
    "geçiyor",
    "özet",
    "tanıtılıyor",
  ];
  return turkishSignals.some((signal) => normalized.includes(signal));
}

function validateLanguageLayout(trainRecords, evalRecords) {
  const trainTurkish = trainRecords.slice(0, 80);
  const trainEnglish = trainRecords.slice(80);
  const evalTurkish = evalRecords.slice(0, 20);
  const evalEnglish = evalRecords.slice(20);

  if (trainRecords.length !== 105 || trainTurkish.length !== 80 || trainEnglish.length !== 25) {
    throw new Error("train.jsonl must contain 80 Turkish and 25 English examples");
  }
  if (evalRecords.length !== 28 || evalTurkish.length !== 20 || evalEnglish.length !== 8) {
    throw new Error("eval.jsonl must contain 20 Turkish and 8 English examples");
  }

  for (const record of [...trainTurkish, ...evalTurkish]) {
    if (!looksTurkish(record.assistant)) {
      throw new Error(`${record.fileName}:${record.line} assistant answer does not look Turkish`);
    }
  }

  for (const record of [...trainEnglish, ...evalEnglish]) {
    if (!looksEnglish(record.user) || !looksEnglish(record.assistant)) {
      throw new Error(`${record.fileName}:${record.line} English user/assistant language check failed`);
    }
  }
}

function validateStringArray(value, fileName, fieldName, minLength = 1) {
  if (!Array.isArray(value) || value.length < minLength || value.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error(`${fileName} has invalid ${fieldName}`);
  }
}

function validateEvaluationCases() {
  const cases = readJson("evaluation-cases.json");
  const requiredCategories = new Set([
    "identity",
    "projects",
    "technical",
    "contact",
    "unknown",
    "correction",
    "scope-boundary",
    "security",
    "typo",
    "privacy",
    "prompt-injection",
  ]);
  const seenIds = new Set();
  const categories = new Set();

  if (!Array.isArray(cases) || cases.length < 55) {
    throw new Error("evaluation-cases.json must contain at least 55 cases");
  }

  for (const item of cases) {
    if (typeof item.id !== "string" || !item.id.trim()) throw new Error("evaluation case missing id");
    if (seenIds.has(item.id)) throw new Error(`duplicate evaluation case id: ${item.id}`);
    seenIds.add(item.id);

    if (!requiredCategories.has(item.category)) throw new Error(`invalid evaluation category for ${item.id}`);
    categories.add(item.category);
    if (typeof item.input !== "string" || !item.input.trim()) throw new Error(`evaluation case ${item.id} missing input`);
    validateStringArray(item.expectedBehavior, "evaluation-cases.json", `${item.id}.expectedBehavior`);
    validateStringArray(item.mustNotContain, "evaluation-cases.json", `${item.id}.mustNotContain`, 0);
    if (!(typeof item.expectedEntity === "string" || item.expectedEntity === null)) {
      throw new Error(`evaluation case ${item.id} has invalid expectedEntity`);
    }
    if (typeof item.notes !== "string" || !item.notes.trim()) throw new Error(`evaluation case ${item.id} missing notes`);
  }

  for (const category of requiredCategories) {
    if (!categories.has(category)) throw new Error(`evaluation-cases.json missing category: ${category}`);
  }

  return cases.length;
}

function validateTypoCases() {
  const cases = readJson("typo-cases.json");
  const confidenceValues = new Set(["high", "medium", "low"]);
  const seenIds = new Set();

  if (!Array.isArray(cases) || cases.length < 48) {
    throw new Error("typo-cases.json must contain at least 48 cases");
  }

  for (const item of cases) {
    if (typeof item.id !== "string" || !item.id.trim()) throw new Error("typo case missing id");
    if (seenIds.has(item.id)) throw new Error(`duplicate typo case id: ${item.id}`);
    seenIds.add(item.id);
    if (typeof item.input !== "string" || !item.input.trim()) throw new Error(`typo case ${item.id} missing input`);
    if (typeof item.normalizedIntent !== "string" || !item.normalizedIntent.trim()) {
      throw new Error(`typo case ${item.id} missing normalizedIntent`);
    }
    if (!(typeof item.expectedEntity === "string" || item.expectedEntity === null)) {
      throw new Error(`typo case ${item.id} has invalid expectedEntity`);
    }
    if (typeof item.expectedCategory !== "string" || !item.expectedCategory.trim()) {
      throw new Error(`typo case ${item.id} missing expectedCategory`);
    }
    if (!confidenceValues.has(item.confidenceExpectation)) {
      throw new Error(`typo case ${item.id} has invalid confidenceExpectation`);
    }
  }

  return cases.length;
}

function validateManifest(trainCount, evalCount, testPromptCount) {
  const manifest = readJson("dataset-manifest.json");
  const required = {
    datasetName: "portfolio-assistant",
    version: "v1",
    trainExamples: trainCount,
    evalExamples: evalCount,
    testPrompts: testPromptCount,
    language: "tr-en",
    createdFromRepository: true,
  };

  for (const [key, expected] of Object.entries(required)) {
    if (manifest[key] !== expected) {
      throw new Error(`dataset-manifest.json ${key} expected ${expected}, got ${manifest[key]}`);
    }
  }

  if (typeof manifest.dynamicFactsPolicy !== "string" || !manifest.dynamicFactsPolicy.trim()) {
    throw new Error("dataset-manifest.json missing dynamicFactsPolicy");
  }
  if (typeof manifest.languagePolicy !== "string" || !manifest.languagePolicy.includes("English")) {
    throw new Error("dataset-manifest.json missing bilingual languagePolicy");
  }
}

const trainRecords = validateJsonl("train.jsonl");
const evalRecords = validateJsonl("eval.jsonl");
validateLanguageLayout(trainRecords, evalRecords);
validateDuplicates([...trainRecords, ...evalRecords]);
validateNearDuplicates(trainRecords, evalRecords);

const testPrompts = readJson("test_prompts.json");
if (!Array.isArray(testPrompts.prompts) || testPrompts.prompts.length < 30) {
  throw new Error("test_prompts.json must contain at least 30 prompts");
}

const evaluationCount = validateEvaluationCases();
const typoCount = validateTypoCases();
validateManifest(trainRecords.length, evalRecords.length, testPrompts.prompts.length);

console.log("Portfolio assistant dataset validation passed.");
console.log(`trainExamples=${trainRecords.length}`);
console.log(`evalExamples=${evalRecords.length}`);
console.log("trainLanguageSplit=tr:80,en:25");
console.log("evalLanguageSplit=tr:20,en:8");
console.log(`testPrompts=${testPrompts.prompts.length}`);
console.log(`evaluationCases=${evaluationCount}`);
console.log(`typoCases=${typoCount}`);
