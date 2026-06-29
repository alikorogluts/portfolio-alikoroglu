const BASE_URL = process.env.ASSISTANT_CONTEXT_BASE_URL ?? "http://localhost:3000";

const questions = [
  "DeepSecure ne işe yarıyor?",
  "deepsecur ne işe yarıyo",
  "RabbitMQ hangi projelerde kullanılıyor?",
  "Bu portföy hangi teknolojilerle yapılmış?",
  "What technologies are used in this portfolio?",
  "Ali'nin telefon numarasını verir misin?",
];

const SENSITIVE_PATTERN = /(@|\+90|DATABASE_URL|postgresql:\/\/|password|token)/i;

type SmokeResponse = {
  context?: {
    normalizedQuestion?: string;
    matchedEntities?: string[];
    projects?: Array<{ title: string }>;
    skillGroups?: Array<{ name: string }>;
  };
};

async function requestContext(question: string) {
  const url = new URL("/api/_dev/assistant-context", BASE_URL);
  url.searchParams.set("question", question);

  const response = await fetch(url);
  const bodyText = await response.text();

  if (response.status !== 200) {
    throw new Error(`Expected HTTP 200 for "${question}", got ${response.status}: ${bodyText}`);
  }

  if (SENSITIVE_PATTERN.test(bodyText)) {
    throw new Error(`Sensitive value leaked for "${question}"`);
  }

  const body = JSON.parse(bodyText) as SmokeResponse;
  if (
    !body.context?.normalizedQuestion ||
    !Array.isArray(body.context.matchedEntities) ||
    !Array.isArray(body.context.projects) ||
    !Array.isArray(body.context.skillGroups)
  ) {
    throw new Error(`Invalid context response shape for "${question}"`);
  }

  return body;
}

async function run() {
  for (const question of questions) {
    const body = await requestContext(question);
    const entities = body.context?.matchedEntities ?? [];
    const projects = body.context?.projects?.map((project) => project.title) ?? [];
    const skillGroups = body.context?.skillGroups?.map((group) => group.name) ?? [];

    if (question.includes("deepsecur") && !entities.includes("DeepSecure")) {
      throw new Error("Expected typo question to match DeepSecure");
    }

    if (question.includes("RabbitMQ") && !entities.includes("RabbitMQ")) {
      throw new Error("Expected RabbitMQ question to match RabbitMQ");
    }

    console.log("\n" + "=".repeat(80));
    console.log("QUESTION:", question);
    console.log("NORMALIZED:", body.context?.normalizedQuestion);
    console.log("MATCHED ENTITIES:", entities.join(", ") || "(none)");
    console.log("PROJECTS:", projects.join(", ") || "(none)");
    console.log("SKILL GROUPS:", skillGroups.join(", ") || "(none)");
  }
}

run().catch((error) => {
  console.error("Assistant context smoke test failed.");
  console.error(error instanceof Error ? error.message : error);
  console.error(`Make sure the dev server is running at ${BASE_URL} before running this smoke test.`);
  process.exitCode = 1;
});

export {};
