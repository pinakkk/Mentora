import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { after } from "next/server";
import { chatModel } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";
import { buildContext } from "@/server/memory/context-builder";
import { buildCoachSystemPrompt } from "@/server/prompts/coach-system";
import { createCoachTools } from "@/server/agents/tools";
import { rateLimitOrReject } from "@/lib/ratelimit";
import { touchInteraction } from "@/server/memory/episodic";
import { detectAndStoreEmotion } from "@/server/agents/burnout-detector";
import { getOrCreateStudent } from "@/server/db/students";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit BEFORE doing any LLM work
  const rl = await rateLimitOrReject("chat", user.id);
  if (rl) return rl;

  // Get or create student record (race-safe upsert)
  let student: { id: string };
  try {
    student = await getOrCreateStudent(user);
  } catch (err) {
    console.error("Failed to create student:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to create student",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Convert UI messages (parts format) to model messages (content format)
  const modelMessages = await convertToModelMessages(messages);

  // Extract last user message text for context building
  const lastMsg = messages[messages.length - 1];
  const lastMessage =
    lastMsg?.content ||
    lastMsg?.parts
      ?.filter((p: { type: string }) => p.type === "text")
      .map((p: { text: string }) => p.text)
      .join("") ||
    "";

  // Build memory-enriched context (3-layer: working + episodic + semantic)
  const context = await buildContext(student.id, lastMessage);
  const systemPrompt = buildCoachSystemPrompt(context);

  const studentId = student.id;

  // Schedule non-blocking work to run AFTER the response stream finishes.
  // This is the correct way to do it on Next 16 — `setTimeout`/promise.catch
  // can be cut off by serverless cold-stop. `after()` keeps the function alive.
  after(async () => {
    try {
      await Promise.allSettled([
        touchInteraction(studentId),
        detectAndStoreEmotion(studentId, messages),
      ]);
    } catch (e) {
      console.error("[chat:after] background tasks failed:", e);
    }
  });

  const result = streamText({
    model: chatModel,
    system: systemPrompt,
    messages: modelMessages,
    tools: createCoachTools(studentId),
    stopWhen: stepCountIs(10),
  });

  return result.toTextStreamResponse();
}
