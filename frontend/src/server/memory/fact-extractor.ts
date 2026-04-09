import { generateText, Output, wrapLanguageModel, extractJsonMiddleware } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { memoryManager } from "./manager";
import { z } from "zod";

const wrappedModel = wrapLanguageModel({
  model: chatModel,
  middleware: extractJsonMiddleware(),
});

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

/**
 * Async fact extraction pipeline — the "Memory Agent" from the blueprint.
 * Runs after every conversation turn (non-blocking).
 *
 * 1. Takes the last few messages from the conversation
 * 2. Uses AI to extract structured facts about the student
 * 3. Stores each fact with deduplication via memoryManager
 */
export async function extractAndStoreFacts(
  studentId: string,
  messages: Array<{ role: string; content?: string; parts?: Array<{ type: string; text?: string }> }>
): Promise<void> {
  try {
    // Build conversation text from the last few messages
    const recentMessages = messages.slice(-6);
    const conversationText = recentMessages
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

    if (conversationText.length < 20) return;

    const result = await generateText({
      model: wrappedModel,
      output: Output.object({ schema: factSchema }),
      prompt: `You are a Memory Agent. Analyze this conversation between a student and their AI placement coach. Extract key facts worth remembering about the student.

CONVERSATION:
${conversationText}

RULES:
- Only extract facts that reveal something about the STUDENT (not generic advice)
- Categories:
  - goal: Career goals, target companies, aspirations
  - skill: Technical/soft skills, proficiency levels, technologies known
  - struggle: Difficulties, weaknesses, areas of confusion
  - milestone: Achievements, completions, progress markers
  - preference: Learning style, schedule, communication preferences
  - behavioral: Personality traits, motivation patterns, response to feedback
- importance: "high" for career-defining facts, "medium" for useful context, "low" for minor details
- Be specific and concise. Write facts as clear statements.
- If there are no meaningful facts to extract, return an empty array.
- Do NOT extract facts about what the coach said or recommended — only about the student.

Return a JSON object with a "facts" array.`,
    });

    const extracted = result.output;
    if (!extracted || !extracted.facts || extracted.facts.length === 0) return;

    // Store each fact (memoryManager handles deduplication)
    await Promise.allSettled(
      extracted.facts.map((f) =>
        memoryManager.storeFact(studentId, f.fact, f.category, f.importance)
      )
    );
  } catch (err) {
    // Non-blocking — log and continue
    console.error("Fact extraction error (non-fatal):", err);
  }
}
