"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Assessment } from "@/types/agents";

interface InterviewHistoryProps {
  assessments: Assessment[];
}

export function InterviewHistory({ assessments }: InterviewHistoryProps) {
  if (assessments.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No mock interviews yet
      </div>
    );
  }

  const data = assessments.map((a, i) => ({
    name: `Mock ${i + 1}`,
    score: a.overallScore || 0,
    type: a.type,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            border: "1px solid #f3f4f6",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
        />
        <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
