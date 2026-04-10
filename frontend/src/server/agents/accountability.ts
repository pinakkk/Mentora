/**
 * Accountability Agent — the "strict but caring mentor" pipeline.
 *
 * Used by the cron worker (`/api/cron/accountability`) and on demand by
 * the proactive-nudges worker (`/api/cron/nudges`). Pure logic; no HTTP.
 *
 * Responsibilities:
 *   - Find tasks that are overdue for a student
 *   - Find students who've been inactive
 *   - Generate the right nudge type (level 1 → 2 → 3) based on history
 *   - Persist the nudge to the `nudges` table (for the in-app inbox)
 *   - Escalate to TPC alerts when interventions hit Level 3
 */

import { createClient as createServiceClient } from "@supabase/supabase-js";
import { fastModel } from "@/lib/ai/provider";
import { generateText } from "ai";
import { getEpisodicState } from "@/server/memory/episodic";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StudentRow {
  id: string;
  name: string;
  readiness: number | null;
}

interface TaskRow {
  id: string;
  title: string;
  deadline: string | null;
  priority: string;
  status: string;
  created_at: string;
}

export interface NudgeResult {
  studentId: string;
  studentName: string;
  level: 1 | 2 | 3;
  type: "reminder" | "opportunity" | "re_engage" | "celebrate";
  content: string;
  escalated: boolean;
}

/**
 * Process a single student and decide whether to nudge / escalate.
 * Returns the nudge that was generated (or null if nothing was needed).
 */
export async function processStudent(student: StudentRow): Promise<NudgeResult | null> {
  // 1. Pull task / nudge / activity context
  const [{ data: tasks }, { data: recentNudges }, episodic] = await Promise.all([
    serviceClient
      .from("tasks")
      .select("id, title, deadline, priority, status, created_at")
      .eq("student_id", student.id)
      .in("status", ["pending", "in_progress"])
      .order("deadline", { ascending: true }),
    serviceClient
      .from("nudges")
      .select("id, type, sent_at, status")
      .eq("student_id", student.id)
      .order("sent_at", { ascending: false })
      .limit(5),
    getEpisodicState(student.id).catch(() => null),
  ]);

  const now = Date.now();
  const allTasks = (tasks || []) as TaskRow[];

  const overdueTasks = allTasks.filter(
    (t) => t.deadline && new Date(t.deadline).getTime() < now
  );

  // Days since most recent recorded interaction (chat or task update)
  const lastActivity = episodic?.lastInteractionAt
    ? new Date(episodic.lastInteractionAt).getTime()
    : 0;
  const daysInactive = lastActivity
    ? Math.floor((now - lastActivity) / (24 * 60 * 60 * 1000))
    : Number.POSITIVE_INFINITY;

  // Number of un-acted nudges in the last 5 — indicates ignored coaching.
  const recentlyIgnored = (recentNudges || []).filter(
    (n) => n.status === "sent"
  ).length;

  // 2. Decide level
  let level: 1 | 2 | 3 | null = null;
  let reason = "";

  if (overdueTasks.length === 0 && daysInactive < 3) {
    return null; // nothing to nudge about
  }

  if (overdueTasks.length >= 3 || daysInactive >= 7 || recentlyIgnored >= 3) {
    level = 3;
    reason = `Hit hard signals: ${overdueTasks.length} overdue tasks, ${daysInactive}d inactive, ${recentlyIgnored} ignored nudges`;
  } else if (overdueTasks.length >= 1 || daysInactive >= 4) {
    level = 2;
    reason = `Some friction: ${overdueTasks.length} overdue, ${daysInactive}d inactive`;
  } else if (daysInactive >= 3) {
    level = 1;
    reason = `Mild signal: ${daysInactive}d inactive`;
  }

  if (!level) return null;

  // 3. Generate nudge text via Haiku — short, on-brand
  const overdueSummary = overdueTasks
    .slice(0, 3)
    .map((t) => `- "${t.title}" (was due ${t.deadline?.slice(0, 10)}, priority ${t.priority})`)
    .join("\n");

  const stylePrompt =
    level === 1
      ? "Gentle reminder. Friendly, 1-2 sentences, end with a tiny next step."
      : level === 2
      ? "Use behavioral nudge tactics: micro-commitment OR loss aversion OR social proof. 2-3 sentences. Empathetic but firm."
      : "Strategy switch. Acknowledge the pattern, suggest one DIFFERENT approach (pair practice, smaller scope, break first). 3 sentences max.";

  const result = await generateText({
    model: fastModel,
    prompt: `Write a short proactive coaching nudge for a student named ${student.name}.

Student state:
- Readiness: ${student.readiness ?? "?"}%
- Days inactive: ${daysInactive === Number.POSITIVE_INFINITY ? "no record" : daysInactive}
- Overdue tasks (top 3):
${overdueSummary || "(none)"}
- Recent emotional state: ${episodic?.emotionalState || "unknown"}
- Recent ignored nudges: ${recentlyIgnored}

Nudge level: ${level}
Tone: ${stylePrompt}

Plain text. No greetings like "Hi Student". No markdown. Address them by first name once.`,
  });

  const content = result.text.trim();
  const type: NudgeResult["type"] =
    level === 1 ? "reminder" : level === 2 ? "re_engage" : "re_engage";

  // 4. Persist the nudge
  await serviceClient.from("nudges").insert({
    id: crypto.randomUUID(),
    student_id: student.id,
    content,
    type,
    urgency: level,
    status: "sent",
    sent_at: new Date().toISOString(),
  });

  // 5. Escalate to TPC if level 3
  let escalated = false;
  if (level === 3) {
    escalated = await maybeEscalate(student, reason, overdueTasks, daysInactive);
  }

  return {
    studentId: student.id,
    studentName: student.name,
    level,
    type,
    content,
    escalated,
  };
}

async function maybeEscalate(
  student: StudentRow,
  reason: string,
  overdueTasks: TaskRow[],
  daysInactive: number
): Promise<boolean> {
  // Don't spam: only one open accountability alert per student per 72h.
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await serviceClient
    .from("tpc_alerts")
    .select("id")
    .eq("student_id", student.id)
    .eq("pattern", "accountability")
    .gte("created_at", since)
    .limit(1);

  if (existing && existing.length > 0) return false;

  await serviceClient.from("tpc_alerts").insert({
    id: crypto.randomUUID(),
    student_id: student.id,
    severity: daysInactive >= 14 ? "critical" : "high",
    pattern: "accountability",
    context: {
      reason,
      overdueCount: overdueTasks.length,
      daysInactive: daysInactive === Number.POSITIVE_INFINITY ? null : daysInactive,
      sampleTasks: overdueTasks.slice(0, 3).map((t) => t.title),
    },
    recommendation: `Student ${student.name} has gone silent / missed deadlines. Suggest a direct check-in and a reduced-scope re-plan.`,
    status: "new_alert",
    created_at: new Date().toISOString(),
  });

  return true;
}

/**
 * Run the pipeline across the whole cohort. Used by both cron routes.
 */
export async function runAccountabilitySweep(opts: { limit?: number } = {}) {
  const { data: students } = await serviceClient
    .from("students")
    .select("id, name, readiness")
    .eq("role", "student")
    .limit(opts.limit ?? 200);

  const results: NudgeResult[] = [];
  for (const s of students || []) {
    try {
      const r = await processStudent(s as StudentRow);
      if (r) results.push(r);
    } catch (e) {
      console.error(`[accountability] failed for ${s.id}:`, e);
    }
  }
  return results;
}
