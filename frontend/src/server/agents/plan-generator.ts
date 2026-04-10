import { createClient as createServiceClient } from "@supabase/supabase-js";
import { chatModel } from "@/lib/ai/provider";
import {
  generateText,
  Output,
  wrapLanguageModel,
  extractJsonMiddleware,
} from "ai";
import { z } from "zod";
import { memoryManager } from "../memory/manager";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const planSchema = z.object({
  targetCompanies: z.array(z.string()),
  durationWeeks: z.number(),
  phases: z.array(
    z.object({
      name: z.string(),
      weekStart: z.number(),
      weekEnd: z.number(),
      focus: z.string(),
      milestones: z.array(z.string()),
    })
  ),
  tasks: z
    .array(
      z.object({
        title: z.string(),
        category: z.string().default("dsa"),
        priority: z.string().default("medium"),
        phase: z.string().default("Phase 1"),
      })
    )
    .default([]),
});

const validCategories = [
  "dsa",
  "project",
  "resume",
  "mock",
  "behavioral",
  "aptitude",
  "system_design",
  "hr",
];
const validPriorities = ["low", "medium", "high", "urgent"];

interface StudentRow {
  id: string;
  skills?: Array<{ name: string; level: number }> | null;
  readiness?: number | null;
  preferences?: Record<string, unknown> | null;
}

/**
 * Generate a personalized prep plan for a student.
 * Stores the plan in DB, creates tasks, and stores summary in shared memory.
 */
export async function generatePlanForStudent(student: StudentRow) {
  const skills = student.skills || [];
  const preferences = student.preferences || {};
  const lastAnalysis = preferences.lastAnalysis as
    | Record<string, unknown>
    | undefined;

  // Get companies for targeting
  const { data: companies } = await serviceClient
    .from("companies")
    .select("name, tier, visit_date, roles")
    .order("visit_date", { ascending: true })
    .limit(10);

  const companyContext =
    companies && companies.length > 0
      ? companies
          .map(
            (c: Record<string, unknown>) =>
              `- ${c.name} (${c.tier}, visits: ${c.visit_date || "TBD"}, roles: ${(c.roles as string[])?.join(", ") || "N/A"})`
          )
          .join("\n")
      : "TCS, Infosys, Wipro, Google, Microsoft (general campus companies)";

  const skillContext =
    skills.length > 0
      ? skills.map((s) => `${s.name}: ${s.level}/10`).join(", ")
      : "General engineering student — assume mid-level DSA, basic SQL, some Java/Python";

  const gapContext = lastAnalysis?.gaps
    ? (lastAnalysis.gaps as string[]).join(", ")
    : "Not assessed yet";

  const strengthContext = lastAnalysis?.strengths
    ? (lastAnalysis.strengths as string[]).join(", ")
    : "Not assessed yet";

  const wrappedModel = wrapLanguageModel({
    model: chatModel,
    middleware: extractJsonMiddleware(),
  });

  const result = await generateText({
    model: wrappedModel,
    output: Output.object({ schema: planSchema }),
    prompt: `You are PlaceAI's Planner Agent. Generate a 4-week campus placement prep plan as JSON.

Student skills: ${skillContext}
Strengths: ${strengthContext}
Gaps: ${gapContext}
Readiness: ${student.readiness || 0}%

Companies on campus:
${companyContext}

Return ONLY valid JSON with this exact structure (no extra fields):
{
  "targetCompanies": ["Company1", "Company2", "Company3"],
  "durationWeeks": 4,
  "phases": [
    {
      "name": "Phase 1: Foundation",
      "weekStart": 1,
      "weekEnd": 1,
      "focus": "Core DSA and fundamentals",
      "milestones": ["Complete 30 easy LC problems", "Review DBMS basics"]
    }
  ],
  "tasks": [
    {"title": "Solve 5 array problems on LeetCode", "category": "dsa", "priority": "high", "phase": "Phase 1: Foundation"},
    {"title": "Build a simple REST API project", "category": "project", "priority": "medium", "phase": "Phase 2: Building"}
  ]
}

Rules:
- 3-4 phases covering weeks 1-4
- 3-5 milestones per phase
- 8-12 total tasks spread across phases
- Valid categories: dsa, project, resume, mock, behavioral, aptitude, system_design, hr
- Valid priorities: low, medium, high, urgent
- Target top 3-5 companies from the list
- Every field must have a value, no nulls or undefined`,
  });

  const plan = result.output;
  if (!plan) {
    throw new Error("AI failed to generate plan");
  }

  // Deactivate any existing active plans
  await serviceClient
    .from("prep_plans")
    .update({ status: "superseded" })
    .eq("student_id", student.id)
    .eq("status", "active");

  // Save the new plan
  const now = new Date().toISOString();
  const { data: savedPlan, error: planError } = await serviceClient
    .from("prep_plans")
    .insert({
      id: crypto.randomUUID(),
      student_id: student.id,
      target_companies: plan.targetCompanies,
      duration_weeks: plan.durationWeeks,
      phases: plan.phases,
      current_phase: 1,
      status: "active",
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (planError) {
    throw new Error(`Plan save failed: ${planError.message}`);
  }

  // Store plan in shared memory (non-blocking)
  try {
    const planSummary = `Prep plan created: ${plan.durationWeeks}-week plan targeting ${plan.targetCompanies.join(", ")}. Phases: ${plan.phases.map((p) => `${p.name} (Week ${p.weekStart}-${p.weekEnd}: ${p.focus})`).join("; ")}`;

    await memoryManager.storeFact(student.id, planSummary, "goal", "high");

    for (const phase of plan.phases) {
      await memoryManager.storeFact(
        student.id,
        `Plan phase "${phase.name}" (Week ${phase.weekStart}-${phase.weekEnd}): Focus on ${phase.focus}. Key milestones: ${phase.milestones.join(", ")}`,
        "goal",
        "medium"
      );
    }
  } catch (memoryErr) {
    console.error("Memory storage error (non-fatal):", memoryErr);
  }

  // Create tasks (non-blocking)
  try {
    const today = new Date();
    for (const task of plan.tasks || []) {
      const matchingPhase = plan.phases.find((p) => p.name === task.phase);
      const weekEnd = matchingPhase?.weekEnd || 2;

      const deadline = new Date(today);
      deadline.setDate(deadline.getDate() + weekEnd * 7);

      const category = validCategories.includes(task.category)
        ? task.category
        : "dsa";
      const priority = validPriorities.includes(task.priority)
        ? task.priority
        : "medium";

      const taskNow = new Date().toISOString();
      await serviceClient.from("tasks").insert({
        id: crypto.randomUUID(),
        student_id: student.id,
        title: task.title,
        description: `Phase: ${task.phase}`,
        deadline: deadline.toISOString(),
        priority,
        category,
        status: "pending",
        created_at: taskNow,
        updated_at: taskNow,
      });
    }
  } catch (taskErr) {
    console.error("Task creation error (non-fatal):", taskErr);
  }

  return savedPlan;
}
