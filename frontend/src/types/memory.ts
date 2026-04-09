export interface MemoryFact {
  id: string;
  studentId: string;
  fact: string;
  category: MemoryCategory;
  importance: "high" | "medium" | "low";
  createdAt: string;
  updatedAt: string;
  similarity?: number;
}

export type MemoryCategory =
  | "goal"
  | "skill"
  | "struggle"
  | "milestone"
  | "preference"
  | "behavioral";

export interface ConversationSummary {
  id: string;
  studentId: string;
  conversationId: string;
  summary: string;
  createdAt: string;
}

export interface MemoryContext {
  relevantFacts: MemoryFact[];
  recentSummaries: ConversationSummary[];
  studentProfile: {
    name: string;
    skills: Array<{ name: string; level: number }>;
    readiness: number;
    pendingTasks: number;
    upcomingDeadlines: string[];
  };
}
