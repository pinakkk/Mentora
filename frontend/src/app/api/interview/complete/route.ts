import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { chatCompletion } from "@/lib/groq/client";
import { memoryManager } from "@/server/memory/manager";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!student) {
    return Response.json({ error: "Student not found" }, { status: 404 });
  }

  const { companyName, interviewType, difficulty, questions, durationMs } =
    await req.json();

  // Calculate scores
  const questionScores = questions.map(
    (q: { score?: number }) => q.score || 0
  );
  const overallScore =
    questionScores.length > 0
      ? questionScores.reduce((a: number, b: number) => a + b, 0) /
        questionScores.length
      : 0;

  // Generate debrief using Groq LLM
  const debriefPrompt = `You are an expert interview coach. Generate a comprehensive debrief.

Return ONLY valid JSON (no markdown, no code fences):
{
  "summary": "<2-3 sentence overall assessment>",
  "overallScore": ${overallScore.toFixed(1)},
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<area1>", "<area2>", "<area3>"],
  "recommendations": ["<specific actionable tip 1>", "<specific actionable tip 2>"]
}`;

  const questionsDetail = questions
    .map(
      (q: { questionText: string; answer: string; score: number; feedback: string }, i: number) =>
        `Q${i + 1}: ${q.questionText}\nAnswer: ${q.answer}\nScore: ${q.score}/10\nFeedback: ${q.feedback}`
    )
    .join("\n\n");

  let debrief;
  try {
    const debriefResponse = await chatCompletion(
      debriefPrompt,
      `Company: ${companyName}\nType: ${interviewType}\nDifficulty: ${difficulty}\n\n${questionsDetail}`
    );
    let jsonText = debriefResponse.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    debrief = JSON.parse(jsonText);
  } catch {
    debrief = {
      summary: `Completed ${interviewType} interview for ${companyName}. Overall score: ${overallScore.toFixed(1)}/10.`,
      overallScore,
      strengths: [],
      improvements: [],
      recommendations: ["Keep practicing regularly."],
    };
  }

  // Save assessment to DB
  const { data: assessment, error: assessmentError } = await serviceClient
    .from("assessments")
    .insert({
      student_id: student.id,
      type: interviewType,
      questions: questions.map((q: { questionText: string; difficulty: string }) => ({
        text: q.questionText,
        type: interviewType,
        difficulty: q.difficulty || difficulty,
      })),
      answers: questions.map((q: { answer: string }) => q.answer),
      scores: Object.fromEntries(
        questions.map((q: { score: number }, i: number) => [`q${i + 1}`, q.score])
      ),
      feedback: debrief.summary,
      overall_score: overallScore,
    })
    .select()
    .single();

  if (assessmentError) {
    console.error("Failed to save assessment:", assessmentError);
  }

  // Store memory facts asynchronously
  storeInterviewMemory(
    student.id,
    companyName,
    interviewType,
    overallScore,
    debrief,
    questions
  ).catch((err) => console.error("Memory storage error:", err));

  // Update readiness score
  updateReadiness(student.id).catch((err) =>
    console.error("Readiness update error:", err)
  );

  return Response.json({
    success: true,
    assessmentId: assessment?.id,
    debrief,
    overallScore,
    durationMs,
  });
}

async function storeInterviewMemory(
  studentId: string,
  companyName: string,
  interviewType: string,
  overallScore: number,
  debrief: { strengths?: string[]; improvements?: string[] },
  questions: Array<{ score: number; questionText: string; feedback: string }>
) {
  // Store milestone
  await memoryManager.storeFact(
    studentId,
    `Completed ${interviewType} mock interview for ${companyName}: scored ${overallScore.toFixed(1)}/10`,
    "milestone",
    overallScore >= 7 ? "high" : "medium"
  );

  // Store top strengths
  if (debrief.strengths?.length) {
    await memoryManager.storeFact(
      studentId,
      `Strengths in ${companyName} ${interviewType} mock: ${debrief.strengths.join(", ")}`,
      "skill",
      "medium"
    );
  }

  // Store top struggles
  if (debrief.improvements?.length) {
    await memoryManager.storeFact(
      studentId,
      `Needs improvement after ${companyName} ${interviewType} mock: ${debrief.improvements.join(", ")}`,
      "struggle",
      "high"
    );
  }

  // Store specific low-scoring question struggles
  for (const q of questions) {
    if (q.score <= 4) {
      await memoryManager.storeFact(
        studentId,
        `Struggled with: "${q.questionText.slice(0, 100)}" — ${q.feedback}`,
        "struggle",
        "high"
      );
    }
  }
}

async function updateReadiness(studentId: string) {
  const svc = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: student }, { data: tasks }, { data: assessments }] =
    await Promise.all([
      svc.from("students").select("skills").eq("id", studentId).single(),
      svc.from("tasks").select("status").eq("student_id", studentId),
      svc
        .from("assessments")
        .select("overall_score")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skills = ((student as any)?.skills as Array<{ level: number }>) || [];
  const avgSkill =
    skills.length > 0
      ? skills.reduce((s, sk) => s + sk.level, 0) / skills.length
      : 0;

  const completed = (tasks || []).filter(
    (t: { status: string }) => t.status === "completed"
  ).length;
  const total = (tasks || []).length;
  const taskRate = total > 0 ? (completed / total) * 100 : 0;

  const avgAssessment =
    assessments && assessments.length > 0
      ? assessments.reduce(
          (s: number, a: { overall_score: number | null }) =>
            s + (a.overall_score || 0),
          0
        ) / assessments.length
      : 0;

  const readiness = Math.min(
    100,
    Math.max(
      0,
      Math.round(avgSkill * 10 * 0.3 + taskRate * 0.3 + avgAssessment * 10 * 0.4)
    )
  );

  await svc
    .from("students")
    .update({ readiness })
    .eq("id", studentId);
}
