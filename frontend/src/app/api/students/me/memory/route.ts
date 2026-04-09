import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = getServiceClient();

  const { data: student } = await serviceClient
    .from("students")
    .select("id, name, email, department, cgpa, year, skills, readiness, resume_url, onboarded, created_at")
    .eq("auth_id", user.id)
    .single();

  if (!student) return NextResponse.json({ facts: [], student: null });

  const [factsResult, conversationsResult] = await Promise.all([
    serviceClient
      .from("memory_facts")
      .select("id, fact, category, importance, created_at, updated_at")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false }),
    serviceClient
      .from("conversations")
      .select("id, created_at, messages")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Compute conversation stats
  const conversations = conversationsResult.data || [];
  const totalMessages = conversations.reduce((sum, c) => {
    const msgs = (c.messages as Array<unknown>) || [];
    return sum + msgs.length;
  }, 0);

  return NextResponse.json({
    facts: factsResult.data || [],
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      department: student.department,
      cgpa: student.cgpa,
      year: student.year,
      skills: student.skills || [],
      readiness: student.readiness || 0,
      resumeUrl: student.resume_url,
      onboarded: student.onboarded,
      memberSince: student.created_at,
    },
    stats: {
      totalConversations: conversations.length,
      totalMessages,
    },
  });
}
