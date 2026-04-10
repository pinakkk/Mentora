"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Target,
  CheckCircle2,
  Brain,
  Loader2,
  RefreshCw,
  Sparkles,
  ListChecks,
  ArrowRight,
} from "lucide-react";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/primitives/progress";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Skeleton } from "@/components/primitives/skeleton";
import { Timeline } from "@/components/dashboard/timeline";
import { TaskList } from "@/components/dashboard/task-list";
import Link from "next/link";
import type { PrepPlan, Task } from "@/types/agents";
import type { Skill } from "@/types/student";

export default function PlanPage() {
  const [plan, setPlan] = useState<PrepPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const [planRes, tasksRes, studentRes] = await Promise.all([
      fetch("/api/students/me/plan"),
      fetch("/api/students/me/tasks"),
      fetch("/api/students/me"),
    ]);

    let currentPlan: PrepPlan | null = null;
    let currentStudent: Record<string, unknown> | null = null;

    if (planRes.ok) {
      const data = await planRes.json();
      currentPlan = data.plan || null;
      setPlan(currentPlan);
    }
    if (tasksRes.ok) {
      const data = await tasksRes.json();
      setTasks(data.tasks || []);
    }
    if (studentRes.ok) {
      currentStudent = await studentRes.json();
      setStudent(currentStudent);
    }

    return { currentPlan, currentStudent };
  }, []);

  const generatePlan = useCallback(async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/students/me/plan/generate", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate plan");
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [loadData]);

  useEffect(() => {
    async function init() {
      const { currentPlan, currentStudent } = await loadData();
      setLoading(false);

      // Auto-generate plan if user is onboarded but has no plan yet
      const isOnboarded = currentStudent?.onboarded as boolean | undefined;
      const hasSkills =
        ((currentStudent?.skills as Skill[]) || []).length > 0;

      if (!currentPlan && isOnboarded && hasSkills) {
        generatePlan();
      }
    }
    init();
  }, [loadData, generatePlan]);

  if (loading) {
    return (
      <div className="p-5 lg:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid lg:grid-cols-2 gap-5">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Auto-generating state — first time after resume upload
  if (generating && !plan) {
    return (
      <div className="p-5 lg:p-8 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c5bf0]/[0.06] via-white to-[#a78bfa]/[0.04] border border-[#7c5bf0]/10 p-8 lg:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(124,91,240,0.08),transparent)] pointer-events-none" />
          <div className="relative flex flex-col items-center text-center max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#7c5bf0]/20 blur-2xl animate-pulse" />
              <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-[#7c5bf0] to-[#6d4ed6] flex items-center justify-center shadow-lg shadow-[#7c5bf0]/30">
                <Brain className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900 mt-6">
              Generating your prep plan...
            </h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              Our AI is analyzing your resume, skills, and target companies to
              build a personalized 4-week preparation timeline.
            </p>
            <div className="flex items-center gap-2 mt-6 text-xs text-[#7c5bf0]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Usually takes 15-20 seconds</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No plan AND not onboarded — point to resume
  if (!plan) {
    const isOnboarded = student?.onboarded as boolean | undefined;
    const hasSkills = ((student?.skills as Skill[]) || []).length > 0;

    return (
      <div className="p-5 lg:p-8 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c5bf0]/[0.06] via-white to-[#a78bfa]/[0.04] border border-[#7c5bf0]/10 p-8 lg:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(124,91,240,0.08),transparent)] pointer-events-none" />
          <div className="relative flex flex-col items-center text-center max-w-md mx-auto">
            <div className="h-16 w-16 rounded-2xl bg-white border border-[#7c5bf0]/20 flex items-center justify-center shadow-sm">
              <CalendarDays className="h-8 w-8 text-[#7c5bf0]" />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900 mt-6">
              {isOnboarded && hasSkills
                ? "Ready to generate your plan"
                : "Upload your resume first"}
            </h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed max-w-sm">
              {isOnboarded && hasSkills
                ? "Click below to create a personalized 4-week prep plan based on your skills and campus companies."
                : "Your prep plan is auto-generated from your resume analysis. Upload your resume to get started."}
            </p>
            {error && (
              <p className="text-xs text-red-500 mt-3">{error}</p>
            )}
            <div className="flex flex-wrap gap-3 justify-center mt-6">
              {isOnboarded && hasSkills ? (
                <Button
                  onClick={generatePlan}
                  disabled={generating}
                  className="rounded-xl text-white shadow-lg shadow-[#7c5bf0]/20 hover:shadow-[#7c5bf0]/30 px-6 gap-2 transition-shadow"
                  style={{
                    background:
                      "linear-gradient(135deg, #7c5bf0, #6d4ed6)",
                  }}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Generate My Plan
                </Button>
              ) : (
                <Link href="/resume">
                  <Button
                    className="rounded-xl text-white shadow-lg shadow-[#7c5bf0]/20 hover:shadow-[#7c5bf0]/30 px-6 gap-2 transition-shadow"
                    style={{
                      background:
                        "linear-gradient(135deg, #7c5bf0, #6d4ed6)",
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Upload Resume
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const progress =
    tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
  const targetCompanies = (plan.targetCompanies as string[]) || [];
  const phases = (plan.phases as Array<{ name: string }>) || [];

  return (
    <div className="p-5 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Hero Header — matches dashboard style */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c5bf0]/[0.06] via-white to-[#a78bfa]/[0.04] border border-[#7c5bf0]/10 p-6 lg:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(ellipse_at_top_right,rgba(124,91,240,0.08),transparent)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
              Your Prep Plan
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {plan.durationWeeks}-week personalized plan
              {targetCompanies.length > 0 &&
                ` targeting ${targetCompanies.join(", ")}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2 text-xs border-gray-200 hover:bg-white"
            onClick={generatePlan}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Regenerate
          </Button>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Duration",
            value: `${plan.durationWeeks}w`,
            sub: `${phases.length} phases`,
            icon: CalendarDays,
            color: "text-[#7c5bf0]",
            bg: "bg-[#7c5bf0]/10",
            ring: "ring-[#7c5bf0]/10",
          },
          {
            label: "Tasks Done",
            value: `${completedTasks}`,
            sub: `of ${tasks.length} total`,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            ring: "ring-emerald-100",
          },
          {
            label: "Progress",
            value: `${Math.round(progress)}%`,
            sub:
              progress >= 70
                ? "On track"
                : progress >= 30
                ? "Building"
                : "Get started",
            icon: Target,
            color: "text-blue-600",
            bg: "bg-blue-50",
            ring: "ring-blue-100",
          },
          {
            label: "Companies",
            value: `${targetCompanies.length}`,
            sub: "in target list",
            icon: Sparkles,
            color: "text-amber-600",
            bg: "bg-amber-50",
            ring: "ring-amber-100",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-10 w-10 rounded-xl ${stat.bg} ring-1 ${stat.ring} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
                  {stat.value}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {stat.label}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-2.5 pl-[52px]">
              {stat.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Overall Progress */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#7c5bf0]/10 flex items-center justify-center">
              <Target className="h-4 w-4 text-[#7c5bf0]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Overall Progress
              </p>
              <p className="text-[11px] text-gray-400">
                {completedTasks}/{tasks.length} tasks completed
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={`text-[11px] font-medium ${
              progress >= 70
                ? "bg-emerald-50 text-emerald-700"
                : progress >= 30
                ? "bg-amber-50 text-amber-700"
                : "bg-gray-50 text-gray-600"
            }`}
          >
            {Math.round(progress)}%
          </Badge>
        </div>
        <Progress value={progress}>
          <ProgressTrack className="h-2 bg-gray-100 rounded-full">
            <ProgressIndicator className="bg-gradient-to-r from-[#7c5bf0] to-[#a78bfa] rounded-full" />
          </ProgressTrack>
        </Progress>
      </motion.div>

      {/* Target companies */}
      {targetCompanies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="flex items-center gap-2 flex-wrap"
        >
          <span className="text-xs text-gray-400 font-medium">Targeting:</span>
          {targetCompanies.map((company) => (
            <Badge
              key={company}
              variant="secondary"
              className="text-[11px] bg-[#7c5bf0]/10 text-[#7c5bf0] ring-1 ring-[#7c5bf0]/20 font-medium"
            >
              {company}
            </Badge>
          ))}
        </motion.div>
      )}

      {/* Timeline + Tasks */}
      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Plan Timeline
              </h3>
              <span className="text-xs text-gray-400">
                {phases.length} phases over {plan.durationWeeks} weeks
              </span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-[#7c5bf0]/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-[#7c5bf0]" />
            </div>
          </div>
          <Timeline plan={plan} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Tasks</h3>
              <span className="text-xs text-gray-400">
                {tasks.filter((t) => t.status !== "completed").length} remaining
              </span>
            </div>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          {tasks.length > 0 ? (
            <TaskList tasks={tasks} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
              <CheckCircle2 className="h-7 w-7 mb-2 text-gray-300" />
              No tasks yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="bg-gradient-to-br from-[#7c5bf0]/[0.04] to-transparent rounded-2xl p-5 border border-[#7c5bf0]/10 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-[#7c5bf0]/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-[#7c5bf0]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Need to adjust your plan?
            </p>
            <p className="text-[11px] text-gray-500">
              Chat with your AI coach to refine goals or add tasks
            </p>
          </div>
        </div>
        <Link href="/chat">
          <Button
            size="sm"
            className="rounded-xl text-white text-xs gap-1.5"
            style={{ background: "linear-gradient(135deg, #7c5bf0, #6d4ed6)" }}
          >
            Talk to Coach
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
