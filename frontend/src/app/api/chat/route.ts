import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { after } from "next/server";
import { chatModel } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { buildContext } from "@/server/memory/context-builder";
import { buildCoachSystemPrompt } from "@/server/prompts/coach-system";
import { createCoachTools } from "@/server/agents/tools";
import { rateLimitOrReject } from "@/lib/ratelimit";
import { touchInteraction } from "@/server/memory/episodic";
import { detectAndStoreEmotion } from "@/server/agents/burnout-detector";

export const maxDuration = 60;

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

  const serviceClient = getServiceClient();

  // Get or create student record
  let { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!student) {
    // Create student on first chat
    const now = new Date().toISOString();
    const { data: newStudent, error } = await serviceClient
      .from("students")
      .insert({
        id: crypto.randomUUID(),
        auth_id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Student",
        email: user.email!,
        avatar_url: user.user_metadata?.avatar_url,
        role: "student",
        skills: [],
        readiness: 0,
        onboarded: false,
        preferences: {},
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (error || !newStudent) {
      console.error("Failed to create student:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create student", details: error?.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    student = newStudent;
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
