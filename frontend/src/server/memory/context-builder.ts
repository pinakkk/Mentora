import { memoryManager } from "./manager";
import { createClient } from "@supabase/supabase-js";

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
}

/**
 * Build full context for agent calls.
 * Optimized to keep total context under ~400 tokens:
 * - Top 5 memories (not 10) — most relevant only
 * - 2 recent conversations (not 3)
 * - Compact formatting (no verbose labels)
 */
export async function buildContext(
  studentId: string,
  userMessage: string
): Promise<AgentContext> {
  const [student, memories, summaries, tasks] = await Promise.all([
    getStudentProfile(studentId),
    memoryManager.recall(studentId, userMessage, 5, 0.45).catch(() => []),
    memoryManager.getRecentSummaries(studentId, 2).catch(() => []),
    getPendingTasks(studentId),
  ]);

  // Compact memory format: "[category] fact" (no importance/relevance % — saves tokens)
  const relevantMemories = memories.length
    ? memories
        .map((m) => `[${m.category}] ${m.fact}`)
        .join("\n")
    : "None.";

  // Compact conversation format
  const recentConversations = summaries.length
    ? summaries
        .map(
          (s: { summary: string; created_at: string }) =>
            `${new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${s.summary}`
        )
        .join("\n")
    : "None.";

  // Compact task format: only pending, max 5
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

  // Compact deadlines: top 3 only
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
