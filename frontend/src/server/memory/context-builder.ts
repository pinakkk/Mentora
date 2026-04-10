import { memoryManager } from "./manager";
import { createClient } from "@supabase/supabase-js";
import { getRecentSummaries as getEpisodicSummaries, getEpisodicState } from "./episodic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AgentContext {
  studentProfile: {
    id: string;
    name: string;
    email: string;
    department?: string;
    cgpa?: number;
    year?: number;
    skills: Array<{ name: string; level: number }>;
    readiness: number;
    resumeUrl?: string;
    onboarded: boolean;
  };
  relevantMemories: string;
  recentConversations: string;
  pendingTasks: string;
  upcomingDeadlines: string;
  emotionalState?: string;
}

/**
 * Build full context for agent calls — pulls from all 3 memory layers:
 *
 *   Layer 1 (Working):   `userMessage` itself + the messages array (handled by
 *                        the LLM call site, not here)
 *   Layer 2 (Episodic):  Redis hot facts + recent summaries + emotional state
 *   Layer 3 (Semantic):  pgvector recall for the user's query
 *
 * Optimized to keep total context under ~500 tokens — top 5 semantic memories,
 * top 3 hot facts (deduped against semantic), 2 recent summaries, 5 tasks.
 */
export async function buildContext(
  studentId: string,
  userMessage: string
): Promise<AgentContext> {
  const [student, semanticMemories, hotFacts, episodicSummaries, dbSummaries, tasks, state] =
    await Promise.all([
      getStudentProfile(studentId),
      memoryManager.recall(studentId, userMessage, 5, 0.45).catch(() => []),
      memoryManager.hotFacts(studentId, 5).catch(() => []),
      getEpisodicSummaries(studentId, 3).catch(() => []),
      memoryManager.getRecentSummaries(studentId, 3).catch(() => []),
      getPendingTasks(studentId),
      getEpisodicState(studentId).catch(() => null),
    ]);

  // Merge semantic + episodic hot facts, dedupe by lowercase fact text.
  const seen = new Set<string>();
  const mergedFacts: Array<{ category: string; fact: string }> = [];
  for (const m of semanticMemories) {
    const key = m.fact.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      mergedFacts.push({ category: m.category, fact: m.fact });
    }
  }
  for (const h of hotFacts) {
    const key = h.fact.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      mergedFacts.push({ category: h.category, fact: h.fact });
    }
    if (mergedFacts.length >= 8) break;
  }

  const relevantMemories = mergedFacts.length
    ? mergedFacts.map((m) => `[${m.category}] ${m.fact}`).join("\n")
    : "None.";

  // Prefer Redis episodic summaries; fall back to durable DB summaries.
  const summarySource =
    episodicSummaries.length > 0
      ? episodicSummaries.map((s) => ({
          summary: s.text,
          created_at: s.createdAt,
        }))
      : dbSummaries.map((s: { summary: string | null; created_at: string }) => ({
          summary: s.summary || "",
          created_at: s.created_at,
        }));

  const recentConversations = summarySource.length
    ? summarySource
        .slice(0, 2)
        .map(
          (s) =>
            `${new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${s.summary}`
        )
        .join("\n")
    : "None.";

  // Pending tasks (max 5)
  const pendingTasksList = tasks
    .filter(
      (t: { status: string }) =>
        t.status === "pending" || t.status === "in_progress"
    )
    .slice(0, 5)
    .map(
      (t: { title: string; priority: string; deadline: string | null }) =>
        `- ${t.title} (${t.priority}${
          t.deadline
            ? `, ${new Date(t.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
            : ""
        })`
    )
    .join("\n");

  // Top 3 upcoming deadlines
  const upcomingDeadlines = tasks
    .filter(
      (t: { deadline: string | null; status: string }) =>
        t.deadline && t.status !== "completed"
    )
    .sort(
      (a: { deadline: string | null }, b: { deadline: string | null }) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
    )
    .slice(0, 3)
    .map(
      (t: { title: string; deadline: string | null }) =>
        `- ${t.title}: ${new Date(t.deadline!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    )
    .join("\n");

  return {
    studentProfile: {
      id: student?.id || studentId,
      name: student?.name || "Student",
      email: student?.email || "",
      department: student?.department,
      cgpa: student?.cgpa,
      year: student?.year,
      skills: student?.skills || [],
      readiness: student?.readiness || 0,
      resumeUrl: student?.resume_url,
      onboarded: student?.onboarded || false,
    },
    relevantMemories,
    recentConversations,
    pendingTasks: pendingTasksList || "None.",
    upcomingDeadlines: upcomingDeadlines || "None.",
    emotionalState: state?.emotionalState,
  };
}

async function getStudentProfile(studentId: string) {
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();
  return data;
}

async function getPendingTasks(studentId: string) {
  const { data } = await supabase
    .from("tasks")
    .select("title, priority, deadline, status")
    .eq("student_id", studentId)
    .in("status", ["pending", "in_progress"])
    .order("deadline", { ascending: true })
    .limit(8);
  return data || [];
}
