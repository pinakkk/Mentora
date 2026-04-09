import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/groq/client";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question, rubric, answer, questionNumber, totalQuestions, interviewType } =
    await req.json();

  if (!question || !answer) {
    return Response.json({ error: "Missing question or answer" }, { status: 400 });
  }

  const systemPrompt = `You are an expert interview evaluator. Score the candidate's answer objectively.

CRITICAL SCORING RULES:
- If the candidate says "I don't know", "no idea", "I'm not sure", "pass", gives a blank answer, or clearly does not attempt the question: score MUST be 0 or 1.
- If the candidate gives a vague or very incomplete answer with minimal effort: score 2-3.
- A partial but reasonable attempt: score 4-6.
- A good answer: score 7-8.
- An excellent, comprehensive answer: score 9-10.

Return ONLY valid JSON (no markdown, no code fences):
{
  "score": <number 0-10>,
  "feedback": "<2-3 sentences: what was good, what could be improved>",
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>"],
  "suggestion": "<one specific actionable tip>"
}`;

  const userMessage = `## Interview Type: ${interviewType}
## Question ${questionNumber}/${totalQuestions}:
${question}

## Scoring Rubric:
${rubric}

## Candidate's Answer:
${answer}

Evaluate this answer against the rubric. Be fair but rigorous.`;

  const response = await chatCompletion(systemPrompt, userMessage);

  try {
    let jsonText = response.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const evaluation = JSON.parse(jsonText);
    return Response.json({ success: true, ...evaluation });
  } catch {
    // Fallback: return a basic evaluation
    return Response.json({
      success: true,
      score: 5,
      feedback: response.slice(0, 300),
      strengths: [],
      weaknesses: [],
      suggestion: "Keep practicing!",
    });
  }
}
