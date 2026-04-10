import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getOrCreateStudent } from "@/server/db/students";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Ensure the row exists (race-safe). Then fetch the full record.
    await getOrCreateStudent(user, {}, serviceClient);
  } catch (err) {
    console.error("Failed to create student:", err);
    return NextResponse.json(
      { error: "Failed to create student", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  const { data: student, error } = await serviceClient
    .from("students")
    .select("*")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
