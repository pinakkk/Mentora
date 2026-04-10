import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { memoryManager } from "../memory/manager";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── TOOL FACTORIES (studentId bound at call-time) ──────

export function createCoachTools(studentId: string) {
  return {
    store_memory: tool({
      description:
        "Store an important fact about the student in long-term memory. Use this after learning something significant about the student's goals, skills, struggles, preferences, milestones, or behavioral patterns.",
      inputSchema: z.object({
        fact: z
          .string()
          .describe("The fact to store, written as a clear statement"),
        category: z
          .enum([
            "goal",
            "skill",
            "struggle",
            "milestone",
            "preference",
            "behavioral",
          ])
          .describe("Category of the fact"),
        importance: z
          .enum(["high", "medium", "low"])
          .describe("Importance level"),
      }),
      execute: async ({ fact, category, importance }) => {
        const id = await memoryManager.storeFact(
          studentId,
          fact,
          category,
          importance
        );
        return id
          ? { success: true, id, message: `Stored: "${fact}"` }
          : { success: false, message: "Duplicate fact, already stored." };
      },
    }),

    recall_memory: tool({
      description:
        "Search the student's memory for facts relevant to a query. Returns the most similar stored facts.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("What to search for in memory"),
        limit: z.number().optional().describe("Max results (default 10)"),
      }),
      execute: async ({ query, limit }) => {
        const facts = await memoryManager.recall(studentId, query, limit || 10);
        return { facts, count: facts.length };
      },
    }),

    create_task: tool({
      description:
        "Create a new task for the student. Use this to assign specific, actionable items with deadlines.",
      inputSchema: z.object({
        title: z.string().describe("Clear, actionable task title"),
        description: z.string().optional().describe("Detailed description"),
        deadline: z
          .string()
          .optional()
          .describe("ISO date string for deadline"),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        category: z.enum([
          "dsa",
          "project",
          "resume",
          "mock",
          "behavioral",
          "aptitude",
          "system_design",
          "hr",
        ]),
      }),
      execute: async ({ title, description, deadline, priority, category }) => {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            id: crypto.randomUUID(),
            student_id: studentId,
            title,
            description,
            deadline: deadline || null,
            priority,
            category,
            status: "pending",
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, task: data };
      },
    }),

    get_student_tasks: tool({
      description:
        "Get all tasks for the student, optionally filtered by status.",
      inputSchema: z.object({
        status: z
          .enum(["pending", "in_progress", "completed", "all"])
          .optional()
          .describe("Filter by status"),
      }),
      execute: async ({ status }) => {
        let query = supabase
          .from("tasks")
          .select("*")
          .eq("student_id", studentId)
          .order("deadline", { ascending: true });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        const { data, error } = await query;
        if (error) return { success: false, error: error.message };
        return { success: true, tasks: data || [], count: data?.length || 0 };
      },
    }),

    update_task_status: tool({
      description: "Update a task's status (e.g., mark as completed).",
      inputSchema: z.object({
        taskId: z.string(),
        status: z.enum(["pending", "in_progress", "completed"]),
      }),
      execute: async ({ taskId, status }) => {
        const { error } = await supabase
          .from("tasks")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", taskId);

        if (error) return { success: false, error: error.message };
        return { success: true, message: `Task updated to ${status}` };
      },
    }),

    create_plan: tool({
      description:
        "Create a personalized prep plan for the student with phases and milestones.",
      inputSchema: z.object({
        targetCompanies: z
          .array(z.string())
          .describe("Company names the plan targets"),
        durationWeeks: z
          .number()
          .describe("Plan duration in weeks (2, 4, or 8)"),
        phases: z
          .array(
            z.object({
              name: z.string(),
              weekStart: z.number(),
              weekEnd: z.number(),
              focus: z.string(),
              milestones: z.array(z.string()),
            })
          )
          .describe("Plan phases with milestones"),
      }),
      execute: async ({ targetCompanies, durationWeeks, phases }) => {
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from("prep_plans")
          .insert({
            id: crypto.randomUUID(),
            student_id: studentId,
            target_companies: targetCompanies,
            duration_weeks: durationWeeks,
            phases,
            current_phase: 1,
            status: "active",
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, plan: data };
      },
    }),

    get_student_profile: tool({
      description:
        "Get the full profile of the student including skills and readiness.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, student: data };
      },
    }),

    update_student_profile: tool({
      description:
        "Update specific fields of the student's profile (skills, readiness, etc.).",
      inputSchema: z.object({
        updates: z.object({
          skills: z
            .array(
              z.object({
                name: z.string(),
                level: z.number(),
                confidence: z.number(),
                source: z.string(),
              })
            )
            .optional(),
          readiness: z.number().optional(),
          onboarded: z.boolean().optional(),
        }),
      }),
      execute: async ({ updates }) => {
        const { error } = await supabase
          .from("students")
          .update(updates)
          .eq("id", studentId);

        if (error) return { success: false, error: error.message };
        return { success: true, message: "Profile updated" };
      },
    }),

    get_companies: tool({
      description:
        "Get list of companies with their requirements and visit dates.",
      inputSchema: z.object({
        upcoming: z
          .boolean()
          .optional()
          .describe("Only show companies visiting in next 30 days"),
      }),
      execute: async ({ upcoming }) => {
        let query = supabase
          .from("companies")
          .select("*, company_requirements(*)")
          .order("visit_date", { ascending: true });

        if (upcoming) {
          const thirtyDaysFromNow = new Date();
          thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
          query = query.lte(
            "visit_date",
            thirtyDaysFromNow.toISOString()
          );
        }

        const { data, error } = await query;
        if (error) return { success: false, error: error.message };
        return { success: true, companies: data || [] };
      },
    }),

    compute_readiness: tool({
      description:
        "Compute and update the student's overall readiness score based on current skills, tasks, and assessments.",
      inputSchema: z.object({}),
      execute: async () => {
        const [{ data: student }, { data: tasks }, { data: assessments }] =
          await Promise.all([
            supabase.from("students").select("*").eq("id", studentId).single(),
            supabase.from("tasks").select("*").eq("student_id", studentId),
            supabase
              .from("assessments")
              .select("*")
              .eq("student_id", studentId)
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

        if (!student) return { success: false, error: "Student not found" };

        const skills = (student.skills as Array<{ level: number }>) || [];
        const avgSkillLevel =
          skills.length > 0
            ? skills.reduce((sum, s) => sum + s.level, 0) / skills.length
            : 0;

        const completedTasks = (tasks || []).filter(
          (t: { status: string }) => t.status === "completed"
        ).length;
        const totalTasks = (tasks || []).length;
        const taskCompletion =
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const avgAssessmentScore =
          assessments && assessments.length > 0
            ? assessments.reduce(
                (sum: number, a: { overall_score: number | null }) =>
                  sum + (a.overall_score || 0),
                0
              ) / assessments.length
            : 0;

        const readiness = Math.round(
          avgSkillLevel * 10 * 0.3 +
            taskCompletion * 0.3 +
            avgAssessmentScore * 10 * 0.4
        );

        const clampedReadiness = Math.min(100, Math.max(0, readiness));

        await supabase
          .from("students")
          .update({ readiness: clampedReadiness })
          .eq("id", studentId);

        return {
          success: true,
          readiness: clampedReadiness,
          breakdown: {
            skillScore: Math.round(avgSkillLevel * 10),
            taskCompletion: Math.round(taskCompletion),
            assessmentScore: Math.round(avgAssessmentScore * 10),
          },
        };
      },
    }),

    save_assessment: tool({
      description:
        "Save a mock interview or assessment result with scores and feedback.",
      inputSchema: z.object({
        companyId: z.string().optional(),
        type: z.enum(["technical", "behavioral", "hr", "system_design"]),
        questions: z.array(
          z.object({
            text: z.string(),
            type: z.string(),
            difficulty: z.string(),
          })
        ),
        answers: z.array(z.string()),
        scores: z.record(z.string(), z.number()),
        feedback: z.string(),
        overallScore: z.number(),
      }),
      execute: async ({
        companyId,
        type,
        questions,
        answers,
        scores,
        feedback,
        overallScore,
      }) => {
        const { data, error } = await supabase
          .from("assessments")
          .insert({
            id: crypto.randomUUID(),
            student_id: studentId,
            company_id: companyId || null,
            type,
            questions,
            answers,
            scores,
            feedback,
            overall_score: overallScore,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, assessment: data };
      },
    }),

    alert_tpc: tool({
      description:
        "Create an alert for TPC (Training & Placement Cell) about a student who needs intervention.",
      inputSchema: z.object({
        severity: z.enum(["low", "medium", "high", "critical"]),
        pattern: z
          .string()
          .describe("Description of the concerning pattern observed"),
        recommendation: z
          .string()
          .describe("Recommended action for TPC to take"),
      }),
      execute: async ({ severity, pattern, recommendation }) => {
        const { data, error } = await supabase
          .from("tpc_alerts")
          .insert({
            id: crypto.randomUUID(),
            student_id: studentId,
            severity,
            pattern,
            recommendation,
            status: "new_alert",
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) return { success: false, error: error.message };
        return { success: true, alert: data };
      },
    }),
  };
}

// ─── MOCK INTERVIEW TOOLS ───────────────────────────────

export function createMockInterviewTools(studentId: string) {
  const allTools = createCoachTools(studentId);
  return {
    store_memory: allTools.store_memory,
    get_student_profile: allTools.get_student_profile,
    get_companies: allTools.get_companies,
    save_assessment: allTools.save_assessment,
    compute_readiness: allTools.compute_readiness,
  };
}
