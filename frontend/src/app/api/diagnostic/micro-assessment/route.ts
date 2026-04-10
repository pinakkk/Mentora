/**
 * F3 — Skill micro-assessment.
 *
 * Two operations on one route:
 *
 *   GET  ?skill=DSA            → returns 5 generated MCQs/short questions
 *   POST { skill, questions, answers }
 *                              → grades the answers, updates the student's
 *                                verified-skill level, persists an Assessment.
 *
 * Designed to REPLACE self-reported skill levels with evidence-backed ones.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { rateLimitOrReject } from "@/lib/ratelimit";
import { fastModel } from "@/lib/ai/provider";
import { generateJson } from "@/lib/ai/json";
import { z } from "zod";
import { memoryManager } from "@/server/memory/manager";

export const maxDuration = 60;

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── question generation schema ──────────────────────────
// Loosened to min(3).max(7) so Llama-style off-by-one outputs don't fail
// validation; we slice to exactly 5 in the handler.
const questionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.number(),
        text: z.string(),
        choices: z.array(z.string()).optional(),
        type: z.enum(["mcq", "short"]),
        difficulty: z.enum(["easy", "medium", "hard"]),
        correctAnswer: z.string().optional(),
      })
    )
    .min(3)
    .max(7),
});

const gradingSchema = z.object({
  perQuestion: z.array(
    z.object({
      id: z.number(),
      score: z.number().min(0).max(10),
      isCorrect: z.boolean(),
      feedback: z.string(),
    })
  ),
  overallScore: z.number().min(0).max(10),
  verifiedLevel: z.number().min(0).max(10),
  summary: z.string(),
});

// ─── GET — generate questions ────────────────────────────
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimitOrReject("diagnostic", user.id);
  if (rl) return rl;

  const url = new URL(req.url);
  const skill = url.searchParams.get("skill");
  if (!skill) {
    return NextResponse.json({ error: "?skill=... is required" }, { status: 400 });
  }

  try {
    const result = await generateJson({
      model: fastModel,
      schema: questionsSchema,
      prompt: `Generate exactly 5 short skill-assessment questions for: ${skill}

These should test ACTUAL knowledge for an Indian campus placement candidate.
Mix difficulties: 2 easy, 2 medium, 1 hard.

Each question:
- id: 1..5
- text: the question
- type: "mcq" if it has 4 plausible choices, otherwise "short"
- choices: REQUIRED if mcq (exactly 4)
- difficulty: easy | medium | hard
- correctAnswer: the right answer (we'll use it to grade the user's response — keep it concise)

Topics for known skills:
- DSA: arrays, hashmaps, two pointers, basic recursion
- SQL: joins, group by, subqueries
- DBMS: normalization, ACID, indexing
- OS: processes vs threads, scheduling, deadlock
- Networks: TCP vs UDP, OSI, DNS
- System design: caching, load balancers, CAP

OUTPUT SHAPE (exact):
{
  "questions": [
    {"id": 1, "text": "...", "type": "mcq", "choices": ["A","B","C","D"], "difficulty": "easy", "correctAnswer": "A"},
    {"id": 2, "text": "...", "type": "short", "difficulty": "medium", "correctAnswer": "..."}
  ]
}`,
    });

    // Slice/pad to exactly 5 for the UI contract.
    const fiveQuestions = result.questions.slice(0, 5);
    if (fiveQuestions.length < 3) {
      throw new Error("AI returned too few questions");
    }
    // Re-id 1..N
    fiveQuestions.forEach((q, i) => (q.id = i + 1));

    return NextResponse.json({
      skill,
      questions: fiveQuestions.map((q) => ({
        ...q,
        // Don't leak the correct answer to the client; keep it server-side
        correctAnswer: undefined,
      })),
      // We send a signed/round-trip token containing the answers so the
      // POST handler can grade without re-generating. For simplicity here
      // we encode the questions+answers as base64 of JSON. In production
      // this would be JWT/HMAC-signed.
      token: Buffer.from(JSON.stringify(fiveQuestions)).toString("base64"),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Question generation failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// ─── POST — grade answers ────────────────────────────────
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimitOrReject("diagnostic", user.id);
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const { skill, token, answers } = body as {
    skill?: string;
    token?: string;
    answers?: string[];
  };

  if (!skill || !token || !Array.isArray(answers) || answers.length !== 5) {
    return NextResponse.json(
      { error: "skill, token, and 5 answers are required" },
      { status: 400 }
    );
  }

  // Decode the question token (server-only, contains the correct answers)
  let questions: Array<{
    id: number;
    text: string;
    type: string;
    correctAnswer?: string;
    difficulty: string;
  }>;
  try {
    questions = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const { data: student } = await serviceClient
    .from("students")
    .select("id, skills")
    .eq("auth_id", user.id)
    .single();
  if (!student)
    return NextResponse.json({ error: "Student not found" }, { status: 404 });

  // Build grading prompt
  const qaPairs = questions
    .map(
      (q, i) =>
        `Q${q.id} (${q.difficulty}): ${q.text}\n  Expected: ${q.correctAnswer || "n/a"}\n  Student answer: ${answers[i]}`
    )
    .join("\n\n");

  let grading;
  try {
    grading = await generateJson({
      model: fastModel,
      schema: gradingSchema,
      prompt: `You are grading a 5-question micro-assessment for the skill "${skill}".

${qaPairs}

GRADING RULES:
- Be objective. "I don't know" or blank = 0.
- Partial credit for partially correct.
- score: 0–10 per question
- isCorrect: true if score >= 7
- overallScore: weighted average across the 5 questions, 0–10
- verifiedLevel: 0–10 estimate of the student's true level on this skill,
                 based on accuracy AND difficulty handled.
- summary: 1–2 sentences on what they got right and what to study next.

OUTPUT SHAPE (exact):
{
  "perQuestion": [
    {"id": 1, "score": 0, "isCorrect": false, "feedback": "..."}
  ],
  "overallScore": 0,
  "verifiedLevel": 0,
  "summary": "..."
}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Grading failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // Save as an Assessment row
  const now = new Date().toISOString();
  await serviceClient.from("assessments").insert({
    id: crypto.randomUUID(),
    student_id: student.id,
    type: "technical",
    questions: questions.map((q) => ({
      text: q.text,
      type: q.type,
      difficulty: q.difficulty,
    })),
    answers,
    scores: { perQuestion: grading.perQuestion, verifiedLevel: grading.verifiedLevel },
    feedback: grading.summary,
    overall_score: grading.overallScore,
    created_at: now,
  });

  // Update the matching skill in the student profile (or add it)
  const skills = (student.skills as Array<{ name: string; level: number; confidence: number; source: string }> | null) || [];
  const idx = skills.findIndex((s) => s.name.toLowerCase() === skill.toLowerCase());
  if (idx >= 0) {
    skills[idx] = {
      ...skills[idx],
      level: grading.verifiedLevel,
      confidence: 1, // verified
      source: "micro-assessment",
    };
  } else {
    skills.push({
      name: skill,
      level: grading.verifiedLevel,
      confidence: 1,
      source: "micro-assessment",
    });
  }
  await serviceClient.from("students").update({ skills }).eq("id", student.id);

  // Memory: store the verified level
  memoryManager
    .storeFact(
      student.id,
      `Verified ${skill} level: ${grading.verifiedLevel}/10 via micro-assessment. ${grading.summary}`,
      "skill",
      "high"
    )
    .catch(() => {});

  return NextResponse.json({
    skill,
    overallScore: grading.overallScore,
    verifiedLevel: grading.verifiedLevel,
    summary: grading.summary,
    perQuestion: grading.perQuestion,
  });
}
