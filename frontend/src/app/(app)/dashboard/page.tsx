"use client";

import { useEffect, useState } from "react";
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
  BarChart3,
  Radar,
  Mic,
  ListTodo,
  CalendarRange,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import type { Task, PrepPlan, Assessment } from "@/types/agents";
import type { Skill } from "@/types/student";

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

  return (
    <div className="p-5 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Here&apos;s your placement prep at a glance
          </p>
        </div>
        <Link href="/chat">
          <Button className="rounded-xl bg-violet-500 hover:bg-violet-600 text-white shadow-sm px-5 gap-2">
            <MessageSquare className="h-4 w-4" />
            Talk to Coach
            <ArrowRight className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsCards
        readiness={Number(student?.readiness) || 0}
        tasksCompleted={completedTasks}
        totalTasks={tasks.length}
        mockInterviews={assessments.length}
        avgScore={avgScore}
      />

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Readiness Score</h3>
              <span className="text-xs text-gray-400">Overall placement readiness</span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
          </div>
          <ReadinessGauge score={Number(student?.readiness) || 0} />
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Skill Profile</h3>
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
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Interview Scores</h3>
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
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Your Tasks</h3>
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
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Prep Plan</h3>
              <span className="text-xs text-gray-400">
                {plan ? "Active preparation timeline" : "Ask coach to create one"}
              </span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-pink-50 flex items-center justify-center">
              <CalendarRange className="w-4 h-4 text-pink-500" />
            </div>
          </div>
          <Timeline plan={plan} />
        </div>
      </div>
    </div>
  );
}
