"use client";

import { motion } from "framer-motion";
import { Gauge, ListChecks, Mic, Award } from "lucide-react";

interface StatsCardsProps {
  readiness: number;
  tasksCompleted: number;
  totalTasks: number;
  mockInterviews: number;
  avgScore: number;
}

function getReadinessColor(score: number) {
  if (score >= 70) return { text: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100" };
  if (score >= 40) return { text: "text-amber-600", bg: "bg-amber-50", ring: "ring-amber-100" };
  return { text: "text-red-500", bg: "bg-red-50", ring: "ring-red-100" };
}

export function StatsCards({
  readiness,
  tasksCompleted,
  totalTasks,
  mockInterviews,
  avgScore,
}: StatsCardsProps) {
  const rc = getReadinessColor(readiness);

  const stats = [
    {
      label: "Readiness",
      value: `${readiness}%`,
      sub: readiness >= 70 ? "Strong" : readiness >= 40 ? "Moderate" : "Needs work",
      icon: Gauge,
      iconColor: rc.text,
      iconBg: rc.bg,
      ring: rc.ring,
    },
    {
      label: "Tasks Done",
      value: `${tasksCompleted}`,
      sub: totalTasks > 0 ? `of ${totalTasks} total` : "No tasks yet",
      icon: ListChecks,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      ring: "ring-emerald-100",
    },
    {
      label: "Mock Interviews",
      value: mockInterviews.toString(),
      sub: mockInterviews > 0 ? "sessions completed" : "None yet",
      icon: Mic,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50",
      ring: "ring-violet-100",
    },
    {
      label: "Avg Score",
      value: avgScore > 0 ? `${avgScore}` : "---",
      sub: avgScore > 0 ? "out of 10" : "Take a mock first",
      icon: Award,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      ring: "ring-blue-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-xl ${stat.iconBg} ring-1 ${stat.ring} flex items-center justify-center flex-shrink-0`}
            >
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl lg:text-2xl font-bold tracking-tight">
                {stat.value}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 mt-2.5 pl-[52px]">
            {stat.sub}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
