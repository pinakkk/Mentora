"use client";

import { CheckCircle2, Clock } from "lucide-react";
import type { PrepPlan } from "@/types/agents";

interface TimelineProps {
  plan: PrepPlan | null;
}

export function Timeline({ plan }: TimelineProps) {
  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm">
        <Clock className="h-7 w-7 mb-2 text-gray-300" />
        No prep plan yet. Ask your coach to create one!
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {plan.phases.map((phase, i) => {
        const isCurrent = i + 1 === plan.currentPhase;
        const isCompleted = i + 1 < plan.currentPhase;

        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-violet-500 shrink-0" />
              ) : isCurrent ? (
                <div className="h-5 w-5 rounded-full border-2 border-violet-500 bg-violet-50 flex items-center justify-center shrink-0">
                  <div className="h-2 w-2 rounded-full bg-violet-500" />
                </div>
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-200 shrink-0" />
              )}
              {i < plan.phases.length - 1 && (
                <div
                  className={`w-0.5 flex-1 my-1 min-h-6 ${
                    isCompleted ? "bg-violet-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <div className="pb-5 -mt-0.5">
              <div className="flex items-center gap-2">
                <h4
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-violet-600"
                      : isCompleted
                      ? "text-gray-500"
                      : "text-gray-400"
                  }`}
                >
                  {phase.name}
                </h4>
                {isCurrent && (
                  <span className="text-[10px] font-medium bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Week {phase.weekStart}-{phase.weekEnd} &middot; {phase.focus}
              </p>
              {phase.milestones.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {phase.milestones.map((m, j) => (
                    <li key={j} className="text-xs text-gray-500 flex items-center gap-1.5">
                      <div className="h-1 w-1 rounded-full bg-gray-300" />
                      {m}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
