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
 * Called before every agent invocation to inject relevant memory.
 * Gracefully degrades if memory/embedding services are unavailable.
 */
export async function buildContext(
  studentId: string,
  userMessage: string
): Promise<AgentContext> {
  // Run all fetches in parallel — each one is independently fault-tolerant
  const [student, memories, summaries, tasks] = await Promise.all([
    getStudentProfile(studentId),
    memoryManager.recall(studentId, userMessage, 10, 0.4).catch((err) => {
      console.error("Memory recall failed (continuing without):", err);
      return [];
    }),
    memoryManager.getRecentSummaries(studentId, 3).catch((err) => {
      console.error("Conversation summaries failed (continuing without):", err);
      return [];
    }),
    getPendingTasks(studentId),
  ]);

  // Format memories
  const relevantMemories = memories.length
    ? memories
        .map(
          (m) =>
            `[${m.category}/${m.importance}] ${m.fact} (relevance: ${(
              (m.similarity || 0) * 100
            ).toFixed(0)}%)`
        )
        .join("\n")
    : "No relevant memories found.";

  // Format recent conversations
  const recentConversations = summaries.length
    ? summaries
        .map(
          (s: { summary: string; created_at: string }) =>
            `[${new Date(s.created_at).toLocaleDateString()}] ${s.summary}`
        )
        .join("\n")
    : "No previous conversations.";

  // Format tasks
  const pendingTasksList = tasks
    .filter(
      (t: { status: string }) =>
        t.status === "pending" || t.status === "in_progress"
    )
    .map(
      (t: { title: string; priority: string; deadline: string | null }) =>
        `- ${t.title} (${t.priority}${
          t.deadline ? `, due: ${new Date(t.deadline).toLocaleDateString()}` : ""
        })`
    )
    .join("\n");

  // Upcoming deadlines
  const upcomingDeadlines = tasks
    .filter(
      (t: { deadline: string | null; status: string }) =>
        t.deadline && t.status !== "completed"
    )
    .sort(
      (
        a: { deadline: string | null },
        b: { deadline: string | null }
      ) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
    )
    .slice(0, 5)
    .map(
      (t: { title: string; deadline: string | null }) =>
        `- ${t.title}: ${new Date(t.deadline!).toLocaleDateString()}`
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
    pendingTasks: pendingTasksList || "No pending tasks.",
    upcomingDeadlines: upcomingDeadlines || "No upcoming deadlines.",
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
    .select("*")
    .eq("student_id", studentId)
    .in("status", ["pending", "in_progress"])
    .order("deadline", { ascending: true });
  return data || [];
}
