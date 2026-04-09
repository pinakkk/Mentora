import { createOpenAI } from "@ai-sdk/openai";

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Primary chat/agent model — use .chat() to hit /chat/completions, not /responses
export const chatModel = openrouter.chat("anthropic/claude-sonnet-4");

// Embedding model
export const EMBEDDING_MODEL = "openai/text-embedding-3-small" as const;
