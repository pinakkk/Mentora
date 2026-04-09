"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Target, CheckCircle2, Clock, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Progress } from "@/components/primitives/progress";
import { Button } from "@/components/primitives/button";
import { Skeleton } from "@/components/primitives/skeleton";
import { Timeline } from "@/components/dashboard/timeline";
import { TaskList } from "@/components/dashboard/task-list";
import Link from "next/link";
import type { PrepPlan, Task } from "@/types/agents";

export default function PlanPage() {
  const [plan, setPlan] = useState<PrepPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [planRes, tasksRes] = await Promise.all([
        fetch("/api/students/me/plan"),
        fetch("/api/students/me/tasks"),
      ]);

      if (planRes.ok) {
        const data = await planRes.json();
        setPlan(data.plan || null);
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center">
            <CalendarDays className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold">No Prep Plan Yet</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Ask your AI coach to create a personalized prep plan. Upload your
              resume first for the best results.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Link href="/resume">
                <Button variant="outline" className="rounded-full">
                  Upload Resume
                </Button>
              </Link>
              <Link href="/chat">
                <Button className="rounded-full bg-gray-900 hover:bg-gray-800">
                  <Brain className="h-4 w-4 mr-2" />
                  Ask Coach for a Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Prep Plan</h1>
        <p className="text-gray-500 text-sm mt-1">
          {plan.durationWeeks}-week plan targeting{" "}
          {(plan.targetCompanies as string[]).join(", ")}
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-500">
              {completedTasks}/{tasks.length} tasks
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline plan={plan} />
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tasks ({tasks.filter((t) => t.status !== "completed").length}{" "}
              remaining)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TaskList tasks={tasks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
