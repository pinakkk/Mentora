import { generateText } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { companyName, interviewType, difficulty } = await req.json();
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
    .select("*")
    .eq("auth_id", user.id)
    .single();

  const studentContext = student
    ? `Name: ${student.name}\nDepartment: ${student.department || "N/A"}\nCGPA: ${student.cgpa || "N/A"}\nSkills: ${JSON.stringify(student.skills || [])}\nReadiness: ${student.readiness || 0}%`
    : "New student — no profile data available.";

  const prompt = `You are preparing a structured mock interview for a student.

## Context
- Company: ${companyName}
- Interview Type: ${interviewType}
- Difficulty: ${difficulty}
- Student Profile:
${studentContext}

## Task
Generate a personalized mock interview. Return ONLY valid JSON (no markdown, no code fences).

The JSON must have this exact structure:
{
  "introduction": "A brief, natural introduction the AI interviewer would say to start the interview (2-3 sentences, mentioning the company and interview type)",
  "questions": [
    {
      "id": 1,
      "text": "The question to ask the student",
      "type": "${interviewType}",
      "difficulty": "easy|medium|hard",
      "expectedApproach": "Brief description of what a good answer would cover",
      "scoringRubric": "Key criteria to evaluate the answer (2-3 bullet points as a single string)",
      "followUp": "An optional follow-up question if the student gives a partial answer",
      "maxScore": 10
    }
  ]
}

## Rules
- Generate exactly 6 questions
- Tailor questions to ${companyName}'s known interview style
- Start with an easier question, build up difficulty
- For technical: focus on DSA, coding, problem-solving
- For behavioral: use STAR method scenarios
- For HR: career goals, company fit, situational
- For system_design: architecture, scaling, trade-offs
- Make questions specific and realistic, not generic
- The introduction should be warm and professional`;

  const result = await generateText({
    model: chatModel,
    prompt,
    temperature: 0.7,
  });

  try {
    // Parse the JSON response, handling potential markdown code fences
    let jsonText = result.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const data = JSON.parse(jsonText);

    return Response.json({
      success: true,
      studentId: student?.id,
      ...data,
    });
  } catch {
    return Response.json(
      { error: "Failed to parse interview questions", raw: result.text },
      { status: 500 }
    );
  }
}
