import { fastModel } from "@/lib/ai/provider";
import { generateJson } from "@/lib/ai/json";
import { z } from "zod";
import { setEpisodicState, getEpisodicState } from "@/server/memory/episodic";
import { memoryManager } from "@/server/memory/manager";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * F11 — Burnout & Emotion Detection.
 *
 * After each chat turn we run a CHEAP (Llama 3.3 70B via Groq) sentiment
 * classification on the recent student messages and store the result in
 * Layer-2 episodic state.
 *
 * The Coach reads `emotionalState` from context on the next turn and adapts
 * tone. The accountability cron escalates to TPC when burnout is sustained.
 */

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sentimentSchema = z.object({
  state: z.enum(["neutral", "frustrated", "burnout", "anxious", "engaged"]),
  confidence: z.number().min(0).max(1),
  signals: z.array(z.string()),
});

type ChatMsg = {
  role: string;
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
};

function studentText(messages: ChatMsg[]): string {
  return messages
    .filter((m) => m.role === "user")
    .slice(-4)
    .map(
      (m) =>
        m.content ||
        m.parts
          ?.filter((p) => p.type === "text")
          .map((p) => p.text)
          .join("") ||
        ""
    )
    .filter((t) => t.length > 0)
    .join("\n---\n");
}

/**
 * Run sentiment classification on the most recent student turns and persist
 * the result. Non-blocking by design — caller wraps in `after()`.
 */
export async function detectAndStoreEmotion(
  studentId: string,
  messages: ChatMsg[]
): Promise<void> {
  try {
    const text = studentText(messages);
    if (text.length < 20) return;

    const out = await generateJson({
      model: fastModel,
      schema: sentimentSchema,
      prompt: `You are a sentiment classifier for a student-coaching app. Read the student's recent messages and classify their emotional state.

STUDENT MESSAGES (most recent first):
"""
${text}
"""

CATEGORIES:
- neutral:    factual or informational, no strong affect
- engaged:    motivated, curious, asking follow-ups, positive
- frustrated: angry, blaming, sharp/short, complaining
- anxious:    worried, fearful, avoidance language ("I can't", "what if I fail")
- burnout:    tired, hopeless, withdrawn, "I give up", very short replies after long gaps

RULES:
- Pick exactly one state.
- "signals" = up to 3 short phrases from the text that justify the call.
- Be conservative: default to "neutral" if unsure.
- Confidence must reflect honest certainty (0–1).

OUTPUT SHAPE (exact):
{ "state": "neutral|engaged|frustrated|anxious|burnout", "confidence": 0.0, "signals": ["..."] }`,
    });

    // Track consecutive low-engagement turns for the escalation cron.
    const prev = await getEpisodicState(studentId);
    const isLow = out.state === "burnout" || out.state === "frustrated" || out.state === "anxious";
    const consecutiveLowEngagement = isLow
      ? (prev?.consecutiveLowEngagement || 0) + 1
      : 0;

    await setEpisodicState(studentId, {
      lastInteractionAt: new Date().toISOString(),
      emotionalState: out.state,
      emotionConfidence: out.confidence,
      consecutiveLowEngagement,
    });

    // If we hit a strong burnout signal, persist a long-term memory fact too.
    if (
      (out.state === "burnout" || out.state === "frustrated") &&
      out.confidence >= 0.7
    ) {
      await memoryManager
        .storeFact(
          studentId,
          `Showed ${out.state} signals in recent chat. Triggers: ${out.signals.join("; ")}`,
          "behavioral",
          "high"
        )
        .catch(() => {});
    }

    // Auto-escalate ONLY when burnout is sustained for 3+ consecutive turns,
    // and we haven't already raised an open alert recently.
    if (
      out.state === "burnout" &&
      out.confidence >= 0.6 &&
      consecutiveLowEngagement >= 3
    ) {
      await maybeRaiseBurnoutAlert(studentId, out.signals);
    }
  } catch (err) {
    console.error("Burnout detection error (non-fatal):", err);
  }
}

async function maybeRaiseBurnoutAlert(
  studentId: string,
  signals: string[]
): Promise<void> {
  // Look for an existing open burnout alert in the last 48h to avoid spam.
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await serviceClient
    .from("tpc_alerts")
    .select("id")
    .eq("student_id", studentId)
    .eq("pattern", "burnout")
    .gte("created_at", since)
    .limit(1);

  if (existing && existing.length > 0) return;

  await serviceClient.from("tpc_alerts").insert({
    id: crypto.randomUUID(),
    student_id: studentId,
    severity: "high",
    pattern: "burnout",
    context: { signals, detectedBy: "burnout-detector", source: "chat" },
    recommendation:
      "Student showing sustained burnout signals across multiple turns. Suggest a check-in call, reduced plan scope, and a short break before pushing more practice.",
    status: "new_alert",
    created_at: new Date().toISOString(),
  });
}
