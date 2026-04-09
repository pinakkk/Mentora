import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
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
    return Response.json({ success: true, history: [] });
  }

  const { data: assessments } = await serviceClient
    .from("assessments")
    .select("id, type, overall_score, scores, feedback, created_at")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const history = (assessments || []).map((a) => ({
    id: a.id,
    type: a.type,
    score: a.overall_score,
    feedback: a.feedback,
    date: a.created_at,
  }));

  return Response.json({ success: true, history });
}
