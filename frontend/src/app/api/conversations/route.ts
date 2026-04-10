import { NextResponse, after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  extractAndStoreFacts,
  summarizeConversation,
} from "@/server/memory/fact-extractor";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET /api/conversations — Load the student's single conversation history
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = getServiceClient();

  const { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ messages: [] });
  }

  const { data: conversation } = await serviceClient
    .from("conversations")
    .select("id, messages")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    return NextResponse.json({ messages: [] });
  }

  return NextResponse.json({
    conversationId: conversation.id,
    messages: conversation.messages || [],
  });
}

/**
 * POST /api/conversations — Save messages to the student's conversation
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = await req.json();
  const serviceClient = getServiceClient();

  const { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Upsert: find existing conversation or create new one
  const { data: existing } = await serviceClient
    .from("conversations")
    .select("id")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let conversationId: string;

  if (existing) {
    await serviceClient
      .from("conversations")
      .update({ messages })
      .eq("id", existing.id);
    conversationId = existing.id;
  } else {
    const { data: newConv, error } = await serviceClient
      .from("conversations")
      .insert({
        id: crypto.randomUUID(),
        student_id: student.id,
        messages,
        agent_type: "coach",
      })
      .select("id")
      .single();

    if (error || !newConv) {
      return NextResponse.json({ error: error?.message || "insert failed" }, { status: 500 });
    }
    conversationId = newConv.id;
  }

  // ─── BACKGROUND WORK ─────────────────────────────────────
  // `after()` keeps the serverless function alive past the response,
  // so async fact extraction + summarization actually run to completion.
  if (messages.length >= 2) {
    const studentId = student.id;
    after(async () => {
      try {
        await Promise.allSettled([
          extractAndStoreFacts(studentId, messages),
          summarizeConversation(studentId, conversationId, messages),
        ]);
      } catch (e) {
        console.error("[conversations:after] background tasks failed:", e);
      }
    });
  }

  return NextResponse.json({ conversationId });
}
