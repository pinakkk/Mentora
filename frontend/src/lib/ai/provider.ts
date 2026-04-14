import { createOpenAI } from "@ai-sdk/openai";

// ─── MODEL TIERS ─────────────────────────────────────────
//
// gpt-oss-120b (primary chat, via Groq):
//     Coach reasoning, mock-interview, planning, resume diagnostic,
//     escalation decisions.
//
// Llama 3.3 70B (fast, via Groq):
//     Fact extraction, summarization, sentiment, burnout/emotion detection,
//     GitHub/LinkedIn audits, micro-assessments, nudge text generation.
//
// Both model IDs are env-overridable so we can swap snapshots without
// touching code.

// Groq exposes an OpenAI-compatible API at /openai/v1 — using `createOpenAI`
// here means the rest of the codebase can keep using the Vercel AI SDK
// (`generateText`, `streamText`, `wrapLanguageModel`, tool calling, etc.)
// without learning a second SDK.
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const CHAT_MODEL_ID =
  process.env.GROQ_CHAT_MODEL || "openai/gpt-oss-120b";
const FAST_MODEL_ID =
  process.env.GROQ_FAST_MODEL || "llama-3.3-70b-versatile";

// Primary chat/agent model — use .chat() to hit /chat/completions, not /responses
export const chatModel = groq.chat(CHAT_MODEL_ID);

// Cheap/fast model for extraction, summarization, sentiment, etc.
export const fastModel = groq.chat(FAST_MODEL_ID);

// Embedding model
export const EMBEDDING_MODEL = "openai/text-embedding-3-small" as const;
