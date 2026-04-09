"use client";

import { motion } from "framer-motion";
import {
  Target,
  BookOpen,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

interface StatsCardsProps {
  readiness: number;
  tasksCompleted: number;
  totalTasks: number;
  mockInterviews: number;
  avgScore: number;
}

export function StatsCards({
  readiness,
  tasksCompleted,
  totalTasks,
  mockInterviews,
  avgScore,
}: StatsCardsProps) {
  const stats = [
    {
      label: "Readiness Score",
      value: `${readiness}%`,
      icon: Target,
      iconColor: "text-violet-500",
      iconBg: "bg-violet-100",
    },
    {
      label: "Tasks Done",
      value: `${tasksCompleted}/${totalTasks}`,
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-100",
    },
    {
      label: "Mock Interviews",
      value: mockInterviews.toString(),
      icon: BookOpen,
      iconColor: "text-orange-500",
      iconBg: "bg-orange-100",
    },
    {
      label: "Avg Score",
      value: avgScore > 0 ? `${avgScore}/10` : "N/A",
      icon: TrendingUp,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
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
          className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}
            >
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl lg:text-2xl font-semibold tracking-tight">{stat.value}</p>
              <p className="text-xs text-gray-500 truncate">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
