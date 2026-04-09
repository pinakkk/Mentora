import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: student } = await serviceClient
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!student) return NextResponse.json({ facts: [] });

  const { data: facts } = await serviceClient
    .from("memory_facts")
    .select("id, fact, category, importance, created_at, updated_at")
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ facts: facts || [] });
}
