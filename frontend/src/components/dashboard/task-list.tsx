"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import type { Task } from "@/types/agents";

interface TaskListProps {
  tasks: Task[];
  onToggle?: (taskId: string, status: string) => void;
}

const priorityDot: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-violet-500",
  low: "bg-gray-400",
};

export function TaskList({ tasks, onToggle }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm">
        <Clock className="h-7 w-7 mb-2 text-gray-300" />
        No tasks yet. Start chatting with your coach!
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
            task.status === "completed"
              ? "opacity-50"
              : "hover:bg-gray-50"
          }`}
        >
          <button
            onClick={() =>
              onToggle?.(
                task.id,
                task.status === "completed" ? "pending" : "completed"
              )
            }
            className="mt-0.5 shrink-0"
          >
            {task.status === "completed" ? (
              <CheckCircle2 className="h-[18px] w-[18px] text-violet-500" />
            ) : (
              <Circle className="h-[18px] w-[18px] text-gray-300 hover:text-gray-400 transition-colors" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium leading-snug ${
                task.status === "completed"
                  ? "line-through text-gray-400"
                  : "text-gray-900"
              }`}
            >
              {task.title}
            </p>
            <div className="flex items-center gap-2.5 mt-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${priorityDot[task.priority] || priorityDot.medium}`} />
                <span className="text-[11px] text-gray-500 capitalize">{task.priority}</span>
              </div>
              <span className="text-[11px] text-gray-400 capitalize">{task.category}</span>
              {task.deadline && (
                <span className="text-[11px] text-gray-400">
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
