import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET  /api/students/me/nudges                  → unread + recent nudges
 * PATCH /api/students/me/nudges  { id, status } → mark a nudge read/acted
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!student) return NextResponse.json({ nudges: [] });

  const { data: nudges } = await serviceClient
    .from("nudges")
    .select("id, content, type, urgency, status, sent_at")
    .eq("student_id", student.id)
    .order("sent_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ nudges: nudges || [] });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };
  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }
  if (!["sent", "read", "acted"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!student) return NextResponse.json({ error: "no student" }, { status: 404 });

  // Verify ownership before update
  const { error } = await serviceClient
    .from("nudges")
    .update({ status })
    .eq("id", id)
    .eq("student_id", student.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
