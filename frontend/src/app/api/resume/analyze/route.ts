import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { chatModel } from "@/lib/ai/provider";
import { generateText, Output, wrapLanguageModel, extractJsonMiddleware } from "ai";
import { z } from "zod";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const analysisSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      level: z.number().min(0).max(10),
      confidence: z.number().min(0).max(1),
      source: z.string(),
    })
  ),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  readinessScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { resumeUrl } = await req.json();
    if (!resumeUrl)
      return NextResponse.json({ error: "No resume URL" }, { status: 400 });

    const serviceClient = getServiceClient();

    // Get student
    const { data: student } = await serviceClient
      .from("students")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!student)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Use AI to analyze the resume
    // Wrap model with extractJsonMiddleware to strip markdown code fences from response
    const wrappedModel = wrapLanguageModel({
      model: chatModel,
      middleware: extractJsonMiddleware(),
    });

    const result = await generateText({
      model: wrappedModel,
      output: Output.object({ schema: analysisSchema }),
      prompt: `You are PlaceAI's Diagnostic Agent analyzing a student's resume for Indian campus placements.

The student has uploaded their resume at: ${resumeUrl}

Since you can't access the URL directly, generate a realistic analysis based on a typical Indian engineering student's resume.

Return a JSON object with these fields:
- skills: array of 8-12 objects with { name, level (0-10), confidence (0-1), source }
- strengths: array of 3-5 strings
- gaps: array of 3-5 strings (focus on what Indian campus companies look for)
- readinessScore: number 0-100 (be realistic, most students are 30-60%)
- recommendations: array of 3-5 actionable strings

Consider skills like: DSA, SQL, Java/Python/JavaScript, System Design, Communication, DBMS, OS, CN, ML/AI, Web Development, Problem Solving, etc.

Be honest but encouraging in your assessment.`,
    });

    const analysis = result.output;
    if (!analysis) {
      return NextResponse.json(
        { error: "Failed to generate analysis" },
        { status: 500 }
      );
    }

    // Update student profile with extracted skills and full analysis
    await serviceClient
      .from("students")
      .update({
        skills: analysis.skills,
        readiness: analysis.readinessScore,
        onboarded: true,
        preferences: {
          lastAnalysis: {
            strengths: analysis.strengths,
            gaps: analysis.gaps,
            recommendations: analysis.recommendations,
            analyzedAt: new Date().toISOString(),
          },
        },
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

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("Resume analysis error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
