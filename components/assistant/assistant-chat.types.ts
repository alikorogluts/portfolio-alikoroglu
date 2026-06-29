export type AssistantChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type AssistantChatResponse = {
  answer: string;
  language: "tr" | "en";
  latencyMs: number;
};
