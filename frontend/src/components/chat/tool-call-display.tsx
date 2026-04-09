"use client";

import {
  Brain,
  ListTodo,
  CalendarDays,
  User,
  Building2,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const toolIcons: Record<string, typeof Brain> = {
  store_memory: Brain,
  recall_memory: Brain,
  create_task: ListTodo,
  get_student_tasks: ListTodo,
  update_task_status: CheckCircle2,
  create_plan: CalendarDays,
  get_student_profile: User,
  update_student_profile: User,
  get_companies: Building2,
  compute_readiness: BarChart3,
  save_assessment: BarChart3,
  alert_tpc: AlertTriangle,
};

const toolLabels: Record<string, string> = {
  store_memory: "Saving to memory",
  recall_memory: "Searching memories",
  create_task: "Creating task",
  get_student_tasks: "Checking your tasks",
  update_task_status: "Updating task",
  create_plan: "Creating prep plan",
  get_student_profile: "Reviewing your profile",
  update_student_profile: "Updating your profile",
  get_companies: "Looking up companies",
  compute_readiness: "Computing readiness",
  save_assessment: "Saving assessment",
  alert_tpc: "Alerting TPC",
};

interface ToolCallDisplayProps {
  toolCall: {
    toolName: string;
    state: string;
    args?: Record<string, unknown>;
    result?: unknown;
  };
}

export function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const Icon = toolIcons[toolCall.toolName] || Brain;
  const label = toolLabels[toolCall.toolName] || toolCall.toolName;
  const isRunning = toolCall.state === "call";
  const result = toolCall.result as Record<string, unknown> | undefined;
  const success = (result as { success?: boolean })?.success !== false;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-violet-50/60 border border-violet-100/60">
      {isRunning ? (
        <Loader2 className="h-3.5 w-3.5 text-violet-500 animate-spin shrink-0" />
      ) : (
        <Icon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
      )}
      <span className="text-xs text-violet-700 font-medium">{label}</span>
      {!isRunning && result && (
        <span
          className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${
            success
              ? "bg-violet-100 text-violet-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {success ? "Done" : "Error"}
        </span>
      )}
      {toolCall.toolName === "store_memory" && toolCall.args?.fact != null && (
        <span className="text-[10px] text-violet-400 truncate max-w-[180px] ml-1">
          {String(toolCall.args.fact).slice(0, 50)}...
        </span>
      )}
    </div>
  );
}
