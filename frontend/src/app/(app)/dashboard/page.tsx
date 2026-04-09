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
import { MessageSquare, Info } from "lucide-react";
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

  return (
    <div className="p-5 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">
            Welcome back, {(student?.name as string) || "Student"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s your placement prep overview
          </p>
        </div>
        <Link href="/chat">
          <Button className="rounded-full bg-violet-500 hover:bg-violet-600 text-white shadow-sm px-5">
            <MessageSquare className="h-4 w-4 mr-2" />
            Talk to Coach
          </Button>
        </Link>
      </div>

      <StatsCards
        readiness={Number(student?.readiness) || 0}
        tasksCompleted={completedTasks}
        totalTasks={tasks.length}
        mockInterviews={assessments.length}
        avgScore={avgScore}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">Readiness</h3>
              <span className="text-sm text-gray-500">Your overall score</span>
            </div>
            <Info className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <ReadinessGauge score={Number(student?.readiness) || 0} />
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">Skill Profile</h3>
              <span className="text-sm text-gray-500">See your skill breakdown</span>
            </div>
            <Info className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <SkillRadar skills={skills} />
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-gray-900">Interview Scores</h3>
              <span className="text-sm text-gray-500">Mock performance history</span>
            </div>
            <Info className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <InterviewHistory assessments={assessments} />
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Your Tasks</h3>
              <span className="text-sm text-gray-500">AI-assigned action items</span>
            </div>
            <Info className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <TaskList tasks={tasks.slice(0, 8)} />
        </div>

        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Prep Plan</h3>
              <span className="text-sm text-gray-500">Your preparation timeline</span>
            </div>
            <Info className="w-4.5 h-4.5 text-violet-400" />
          </div>
          <Timeline plan={plan} />
        </div>
      </div>
    </div>
  );
}
