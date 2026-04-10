"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ReadinessGauge } from "@/components/dashboard/readiness-gauge";
import { SkillRadar } from "@/components/dashboard/skill-radar";
import { TaskList } from "@/components/dashboard/task-list";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Timeline } from "@/components/dashboard/timeline";
import { InterviewHistory } from "@/components/dashboard/interview-history";
import { Skeleton } from "@/components/primitives/skeleton";
import { Button } from "@/components/primitives/button";
import {
  MessageSquare,
  Sparkles,
  Radar,
  Mic,
  ListTodo,
  CalendarRange,
  ArrowRight,
  FileSearch,
  Building2,
} from "lucide-react";
import Link from "next/link";
import type { Task, PrepPlan, Assessment } from "@/types/agents";
import type { Skill } from "@/types/student";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function QuickAction({
  href,
  icon: Icon,
  label,
  color,
  bg,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
      >
        <div className={`h-9 w-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
          {label}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
      </motion.div>
    </Link>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<PrepPlan | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [studentRes, tasksRes, planRes, assessmentsRes] = await Promise.all(
        [
          fetch("/api/students/me"),
          fetch("/api/students/me/tasks"),
          fetch("/api/students/me/plan"),
          fetch("/api/students/me/readiness"),
        ]
      );

      if (studentRes.ok) setStudent(await studentRes.json());
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (planRes.ok) {
        const data = await planRes.json();
        setPlan(data.plan || null);
      }
      if (assessmentsRes.ok) {
        const data = await assessmentsRes.json();
        setAssessments(data.assessments || []);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-5 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-5">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const skills = ((student?.skills as Skill[]) || []).map((s) => ({
    name: s.name,
    level: s.level,
  }));

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const avgScore =
    assessments.length > 0
      ? Math.round(
          (assessments.reduce((sum, a) => sum + (a.overallScore || 0), 0) /
            assessments.length) *
            10
        ) / 10
      : 0;

  const firstName = ((student?.name as string) || "Student").split(" ")[0];
  const isOnboarded = student?.onboarded as boolean;

  return (
    <div className="p-5 lg:p-8 space-y-6">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c5bf0]/[0.06] via-white to-[#a78bfa]/[0.04] border border-[#7c5bf0]/10 p-6 lg:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(124,91,240,0.08),transparent)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900"
            >
              Welcome back, {firstName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-gray-400 text-sm mt-1"
            >
              {isOnboarded
                ? "Here's your placement prep at a glance"
                : "Get started by uploading your resume"}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Link href="/chat">
              <Button className="rounded-xl text-white shadow-lg shadow-[#7c5bf0]/20 hover:shadow-[#7c5bf0]/30 px-6 gap-2 transition-shadow" style={{ background: "linear-gradient(135deg, #7c5bf0, #6d4ed6)" }}>
                <MessageSquare className="h-4 w-4" />
                Talk to Coach
                <ArrowRight className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <StatsCards
        readiness={Number(student?.readiness) || 0}
        tasksCompleted={completedTasks}
        totalTasks={tasks.length}
        mockInterviews={assessments.length}
        avgScore={avgScore}
      />

      {/* Quick Actions (shown when not fully onboarded or few tasks) */}
      {(!isOnboarded || tasks.length === 0) && (
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3"
        >
          <motion.div custom={0} variants={fadeUp}>
            <QuickAction
              href="/resume"
              icon={FileSearch}
              label="Analyze Resume"
              color="text-violet-600"
              bg="bg-violet-50"
            />
          </motion.div>
          <motion.div custom={1} variants={fadeUp}>
            <QuickAction
              href="/mock"
              icon={Mic}
              label="Mock Interview"
              color="text-amber-600"
              bg="bg-amber-50"
            />
          </motion.div>
          <motion.div custom={2} variants={fadeUp}>
            <QuickAction
              href="/companies"
              icon={Building2}
              label="View Companies"
              color="text-blue-600"
              bg="bg-blue-50"
            />
          </motion.div>
          <motion.div custom={3} variants={fadeUp}>
            <QuickAction
              href="/plan"
              icon={CalendarRange}
              label="Prep Plan"
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
          </motion.div>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Readiness Score
              </h3>
              <span className="text-xs text-gray-400">
                Overall placement readiness
              </span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-[#7c5bf0]/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#7c5bf0]" />
            </div>
          </div>
          <ReadinessGauge score={Number(student?.readiness) || 0} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Skill Profile
              </h3>
              <span className="text-xs text-gray-400">
                {skills.length > 0
                  ? `${skills.length} skills detected`
                  : "Upload resume to analyze"}
              </span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Radar className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <SkillRadar skills={skills} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Interview Scores
              </h3>
              <span className="text-xs text-gray-400">
                {assessments.length > 0
                  ? `${assessments.length} mock sessions`
                  : "No mocks taken yet"}
              </span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Mic className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <InterviewHistory assessments={assessments} />
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Your Tasks
              </h3>
              <span className="text-xs text-gray-400">
                {tasks.length > 0
                  ? `${completedTasks}/${tasks.length} completed`
                  : "AI-assigned action items"}
              </span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ListTodo className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <TaskList tasks={tasks.slice(0, 8)} />
          {tasks.length > 8 && (
            <Link
              href="/plan"
              className="flex items-center gap-1.5 text-xs text-[#7c5bf0] font-medium mt-3 hover:underline"
            >
              View all tasks <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Prep Plan
              </h3>
              <span className="text-xs text-gray-400">
                {plan ? "Active preparation timeline" : "Upload resume to auto-generate"}
              </span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-pink-50 flex items-center justify-center">
              <CalendarRange className="w-4 h-4 text-pink-500" />
            </div>
          </div>
          <Timeline plan={plan} />
          {plan && (
            <Link
              href="/plan"
              className="flex items-center gap-1.5 text-xs text-[#7c5bf0] font-medium mt-3 hover:underline"
            >
              View full plan <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
}
