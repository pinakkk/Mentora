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

  if (!student) return NextResponse.json({ plan: null });

  const { data: plan } = await serviceClient
    .from("prep_plans")
    .select("*")
    .eq("student_id", student.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ plan: plan || null });
}
