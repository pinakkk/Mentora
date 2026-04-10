import { generateText } from "ai";
import { fastModel } from "@/lib/ai/provider";
import { generateJson } from "@/lib/ai/json";
import { memoryManager } from "./manager";
import { z } from "zod";

/**
 * Memory Agent — async, cheap (Llama 3.3 70B via Groq) extraction & summarization.
 *
 * - extractAndStoreFacts(): runs after each conversation turn, dedupes via
 *   the memoryManager, mirrors hot facts into Layer-2 episodic.
 * - summarizeConversation(): runs once a conversation gets long enough,
 *   produces a 2-3 sentence rolling summary stored in Postgres + Redis.
 *
 * Both functions are non-blocking by contract — the caller wraps them in
 * `after(() => …)` so they survive the response being sent.
 *
 * NOTE: We use `generateJson()` (prompt-based JSON) instead of the AI SDK's
 * `Output.object()` because Groq's Llama 3.3 70B does not support
 * `response_format: json_schema`.
 */

const factSchema = z.object({
  facts: z.array(
    z.object({
      fact: z.string(),
      category: z.enum([
        "goal",
        "skill",
        "struggle",
        "milestone",
        "preference",
        "behavioral",
      ]),
      importance: z.enum(["high", "medium", "low"]),
    })
  ),
});

type ChatMsg = {
  role: string;
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
};

function flatten(messages: ChatMsg[]): string {
  return messages
    .map((m) => {
      const text =
        m.content ||
        m.parts
          ?.filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("") ||
        "";
      return `${m.role === "user" ? "Student" : "Coach"}: ${text}`;
    })
    .filter((line) => line.length > 10)
    .join("\n");
}

/**
 * Extract structured facts from the last few turns and persist them.
 */
export async function extractAndStoreFacts(
  studentId: string,
  messages: ChatMsg[]
): Promise<void> {
  try {
    const recentMessages = messages.slice(-6);
    const conversationText = flatten(recentMessages);
    if (conversationText.length < 20) return;

    const extracted = await generateJson({
      model: fastModel,
      schema: factSchema,
      prompt: `You are a Memory Agent. Analyze this conversation between a student and their AI placement coach. Extract key facts worth remembering about the STUDENT.

CONVERSATION:
${conversationText}

RULES:
- Only extract facts that reveal something about the STUDENT (not generic advice).
- Categories:
  - goal: Career goals, target companies, aspirations
  - skill: Technical/soft skills, proficiency levels, technologies known
  - struggle: Difficulties, weaknesses, areas of confusion
  - milestone: Achievements, completions, progress markers
  - preference: Learning style, schedule, communication preferences
  - behavioral: Personality traits, motivation patterns, response to feedback
- importance: "high" for career-defining facts, "medium" for useful context, "low" for minor details
- Be specific and concise. Write facts as clear statements.
- If there are no meaningful facts to extract, return {"facts": []}.
- Do NOT extract facts about what the coach said or recommended — only about the student.

OUTPUT SHAPE (exact):
{
  "facts": [
    { "fact": "...", "category": "goal|skill|struggle|milestone|preference|behavioral", "importance": "high|medium|low" }
  ]
}`,
    });

    if (!extracted.facts || extracted.facts.length === 0) return;

    await Promise.allSettled(
      extracted.facts.map((f) =>
        memoryManager.storeFact(studentId, f.fact, f.category, f.importance)
      )
    );
  } catch (err) {
    console.error("Fact extraction error (non-fatal):", err);
  }
}

/**
 * Produce a short rolling summary of the conversation and persist it
 * (Postgres `conversations.summary` + Redis episodic).
 */
export async function summarizeConversation(
  studentId: string,
  conversationId: string,
  messages: ChatMsg[]
): Promise<void> {
  try {
    if (messages.length < 10) return;

    const window = messages.slice(-20);
    const text = flatten(window);
    if (text.length < 100) return;

    const result = await generateText({
      model: fastModel,
      prompt: `Summarize this coaching conversation in 2-3 sentences. Focus on:
- key decisions made
- tasks assigned or completed
- new things learned about the student
- the student's emotional/engagement state

Plain prose, no bullet points, no preamble — just the summary.

CONVERSATION:
${text}`,
    });

    const summary = result.text.trim();
    if (!summary || summary.length < 20) return;

    await memoryManager.storeConversationSummary(
      studentId,
      conversationId,
      summary
    );
  } catch (err) {
    console.error("Summarization error (non-fatal):", err);
  }
}
