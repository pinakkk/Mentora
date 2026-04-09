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
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (!student) {
    // Auto-create student record
    const { data: newStudent } = await serviceClient
      .from("students")
      .insert({
        id: crypto.randomUUID(),
        auth_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
        email: user.email!,
        avatar_url: user.user_metadata?.avatar_url,
      })
      .select()
      .single();

    return NextResponse.json(newStudent);
  }

  return NextResponse.json(student);
}

export async function PUT(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { error } = await serviceClient
    .from("students")
    .update(body)
    .eq("auth_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
