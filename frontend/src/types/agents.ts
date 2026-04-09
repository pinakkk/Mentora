export type AgentType =
  | "diagnostic"
  | "planner"
  | "accountability"
  | "mock_interview"
  | "escalation"
  | "memory";

export interface AgentConfig {
  type: AgentType;
  systemPrompt: string;
  tools: AgentTool[];
  maxIterations: number;
  model: string;
}

export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AgentAction {
  id: string;
  agentType: AgentType;
  toolName: string;
  toolInput: Record<string, unknown>;
  toolResult?: Record<string, unknown>;
  timestamp: string;
  status: "pending" | "running" | "completed" | "error";
}

export interface Task {
  id: string;
  studentId: string;
  title: string;
  description?: string;
  deadline?: string;
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  status: "pending" | "in_progress" | "completed";
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PrepPlan {
  id: string;
  studentId: string;
  targetCompanies: string[];
  durationWeeks: number;
  phases: PlanPhase[];
  currentPhase: number;
  status: "active" | "completed" | "abandoned";
  createdAt: string;
  updatedAt: string;
}

export interface PlanPhase {
  name: string;
  weekStart: number;
  weekEnd: number;
  focus: string;
  milestones: string[];
  dailyTasks: DailyTask[];
}

export interface DailyTask {
  day: number;
  title: string;
  description: string;
  category: string;
  estimatedMinutes: number;
}

export interface Assessment {
  id: string;
  studentId: string;
  companyId?: string;
  type: "technical" | "behavioral" | "hr" | "system_design";
  questions: AssessmentQuestion[];
  answers: string[];
  scores: Record<string, number>;
  feedback?: string;
  overallScore?: number;
  createdAt: string;
}

export interface AssessmentQuestion {
  text: string;
  type: string;
  difficulty: "easy" | "medium" | "hard";
  rubric?: string[];
}

export interface TPCAlert {
  id: string;
  studentId: string;
  severity: "low" | "medium" | "high" | "critical";
  pattern: string;
  context: Record<string, unknown>;
  recommendation?: string;
  status: "new_alert" | "acknowledged" | "resolved";
  createdAt: string;
  studentName?: string;
}

export interface Nudge {
  id: string;
  studentId: string;
  content: string;
  type: "reminder" | "opportunity" | "re_engage" | "celebrate";
  urgency: number;
  status: "sent" | "read" | "acted";
  sentAt: string;
}
