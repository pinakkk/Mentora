import { createOpenAI } from "@ai-sdk/openai";

// ─── MODEL TIERS ─────────────────────────────────────────
//
// Sonnet 4 (smart, expensive, via OpenRouter):
//     Coach reasoning, mock-interview, planning, resume diagnostic,
//     escalation decisions.
//
// Llama 3.3 70B (cheap, fast, via Groq's OpenAI-compatible API):
//     Fact extraction, summarization, sentiment, burnout/emotion detection,
//     GitHub/LinkedIn audits, micro-assessments, nudge text generation.
//
// Both model IDs are env-overridable so we can swap snapshots without
// touching code.

const openrouter = createOpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Groq exposes an OpenAI-compatible API at /openai/v1 — using `createOpenAI`
// here means the rest of the codebase can keep using the Vercel AI SDK
// (`generateText`, `streamText`, `wrapLanguageModel`, tool calling, etc.)
// without learning a second SDK.
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const SONNET_MODEL_ID =
  process.env.OPENROUTER_SONNET_MODEL || "anthropic/claude-sonnet-4";
const FAST_MODEL_ID =
  process.env.GROQ_FAST_MODEL || "llama-3.3-70b-versatile";

// Primary chat/agent model — use .chat() to hit /chat/completions, not /responses
export const chatModel = openrouter.chat(SONNET_MODEL_ID);

// Cheap/fast model for extraction, summarization, sentiment, etc.
// Routed through Groq for ~10x cost reduction vs. Sonnet and very low latency.
export const fastModel = groq.chat(FAST_MODEL_ID);

// Embedding model
export const EMBEDDING_MODEL = "openai/text-embedding-3-small" as const;
