import { streamText, stepCountIs, convertToModelMessages } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { buildInterviewerSystemPrompt } from "@/server/prompts/interviewer-system";
import { createMockInterviewTools } from "@/server/agents/tools";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, companyName, interviewType, difficulty } = await req.json();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
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

  const studentId = student?.id;
  const studentContext = student
    ? `Name: ${student.name}\nSkills: ${JSON.stringify(student.skills)}\nReadiness: ${student.readiness}%`
    : "New student — no data available yet.";

  const systemPrompt = buildInterviewerSystemPrompt(
    companyName || "Generic Tech Company",
    interviewType || "technical",
    difficulty || "medium",
    studentContext
  );

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: chatModel,
    system: systemPrompt,
    messages: modelMessages,
    tools: studentId ? createMockInterviewTools(studentId) : {},
    stopWhen: stepCountIs(10),
  });

  return result.toTextStreamResponse();
}
