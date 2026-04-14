import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { chatModel } from "@/lib/ai/provider";
import { generateText, Output, wrapLanguageModel, extractJsonMiddleware } from "ai";
import { z } from "zod";
import { parseResumeFromUrl } from "@/lib/pdf";
import { rateLimitOrReject } from "@/lib/ratelimit";
import { getOrCreateStudent } from "@/server/db/students";

export const maxDuration = 60;

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// NOTE: do NOT use .min()/.max() on z.number() here. The Vercel AI SDK
// translates those into JSON-schema `minimum`/`maximum`, which OpenRouter's
// Azure provider rejects with "For 'number' type, properties maximum, minimum
// are not supported". The bounds are described in the prompt and clamped
// after the fact below.
const analysisSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.number().describe("0-10"),
      confidence: z.number().describe("0-1"),
      source: z.string(),
    })
  ),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  readinessScore: z.number().describe("0-100"),
  recommendations: z.array(z.string()),
});

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Rate limit: resume analysis is the most expensive call (Sonnet + plan gen)
    const rl = await rateLimitOrReject("resume", user.id);
    if (rl) return rl;

    const { resumeUrl } = await req.json();
    if (!resumeUrl)
      return NextResponse.json({ error: "No resume URL" }, { status: 400 });

    const serviceClient = getServiceClient();

    // Get or create student (race-safe upsert)
    let student: { id: string };
    try {
      student = await getOrCreateStudent(user, {}, serviceClient);
    } catch (err) {
      console.error("Failed to create student:", err);
      return NextResponse.json(
        {
          error: "Failed to create student",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 500 }
      );
    }

    // ─── REAL PDF PARSING ─────────────────────────────────
    let resumeText = "";
    let pdfPages = 0;
    try {
      const parsed = await parseResumeFromUrl(resumeUrl);
      resumeText = parsed.text;
      pdfPages = parsed.numPages;
      if (!resumeText || resumeText.length < 50) {
        return NextResponse.json(
          { error: "Resume PDF appears empty or unreadable. Try re-uploading." },
          { status: 422 }
        );
      }
    } catch (err) {
      console.error("[resume] PDF parse failed:", err);
      return NextResponse.json(
        {
          error: "Could not read your resume PDF. Make sure the URL is publicly accessible and the file is a valid PDF.",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 422 }
      );
    }

    // Wrap the model to strip any stray markdown fences from JSON output.
    const wrappedModel = wrapLanguageModel({
      model: chatModel,
      middleware: extractJsonMiddleware(),
    });

    const result = await generateText({
      model: wrappedModel,
      output: Output.object({ schema: analysisSchema }),
      prompt: `You are PlaceAI's Diagnostic Agent. Analyze this REAL resume text for an Indian campus placement context. Be specific — your analysis must reference what's actually in the resume, not generic advice.

# RESUME (extracted from PDF, ${pdfPages} page(s))
"""
${resumeText}
"""

# YOUR TASK
Return a JSON object with these fields:
- skills:           8–12 objects { name, level (0-10), confidence (0-1), source }
                    "source" should be a short evidence snippet from the resume
                    (e.g. "AWS project Q3 2025", "DSA course 9.2 grade").
                    Do NOT invent skills the resume doesn't mention.
- strengths:        3–5 short phrases describing what stands out
- gaps:             3–5 specific weaknesses (vs. what Indian campus tech
                    companies look for: DSA, SQL, projects with measurable
                    impact, CS fundamentals, communication evidence)
- readinessScore:   0–100. Be honest, not flattering. Most students 30–60.
- recommendations:  3–5 concrete next actions tailored to THIS resume.

Return ONLY the JSON object — no markdown fences, no commentary.`,
    });

    const rawAnalysis = result.output;
    if (!rawAnalysis) {
      return NextResponse.json(
        { error: "Failed to generate analysis" },
        { status: 500 }
      );
    }

    // Clamp numeric ranges (the JSON-schema bounds were stripped to satisfy
    // OpenRouter's Azure provider, so we enforce them here instead).
    const analysis = {
      ...rawAnalysis,
      skills: rawAnalysis.skills.map((s) => ({
        ...s,
        level: clamp(s.level, 0, 10),
        confidence: clamp(s.confidence, 0, 1),
      })),
      readinessScore: clamp(rawAnalysis.readinessScore, 0, 100),
    };

    // Update student profile with extracted skills and full analysis
    const updatedPreferences = {
      lastAnalysis: {
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        recommendations: analysis.recommendations,
        analyzedAt: new Date().toISOString(),
        resumeChars: resumeText.length,
        resumePages: pdfPages,
      },
    };

    await serviceClient
      .from("students")
      .update({
        skills: analysis.skills,
        readiness: analysis.readinessScore,
        onboarded: true,
        preferences: updatedPreferences,
      })
      .eq("id", student.id);

    // Store key findings as memory facts (non-blocking — don't fail the response)
    try {
      const { memoryManager } = await import("@/server/memory/manager");

      await Promise.all([
        memoryManager.storeFact(
          student.id,
          `Readiness score: ${analysis.readinessScore}%. Top skills: ${analysis.skills
            .sort((a, b) => b.level - a.level)
            .slice(0, 3)
            .map((s) => `${s.name} (${s.level}/10)`)
            .join(", ")}`,
          "skill",
          "high"
        ),
        ...analysis.gaps.map((gap) =>
          memoryManager.storeFact(
            student.id,
            `Skill gap: ${gap}`,
            "struggle",
            "high"
          )
        ),
        ...analysis.strengths.map((strength) =>
          memoryManager.storeFact(
            student.id,
            `Strength: ${strength}`,
            "milestone",
            "medium"
          )
        ),
      ]);
    } catch (memoryErr) {
      console.error("Memory storage error (non-fatal):", memoryErr);
    }

    // Auto-generate prep plan AFTER the response is sent so the client gets the
    // analysis immediately. Plan generation is a second Sonnet call that can take
    // 10–30s; awaiting it here used to push the route past Vercel's maxDuration
    // and the client never saw the analysis (it only appeared after a refresh,
    // because the DB writes above had already succeeded).
    after(async () => {
      try {
        const { generatePlanForStudent } = await import(
          "@/server/agents/plan-generator"
        );
        await generatePlanForStudent({
          id: student.id,
          skills: analysis.skills,
          readiness: analysis.readinessScore,
          preferences: updatedPreferences,
        });
      } catch (planErr) {
        console.error("Auto plan generation error (non-fatal):", planErr);
      }
    });

    return NextResponse.json({
      ...analysis,
      _meta: { resumePages: pdfPages, resumeChars: resumeText.length },
    });
  } catch (err) {
    console.error("Resume analysis error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
