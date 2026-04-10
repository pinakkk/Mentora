import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { generatePlanForStudent } from "@/server/agents/plan-generator";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: student } = await serviceClient
      .from("students")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (!student)
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );

    const savedPlan = await generatePlanForStudent(student);

    return NextResponse.json({ plan: savedPlan });
  } catch (err) {
    console.error("Plan generation error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Plan generation failed",
      },
      { status: 500 }
    );
  }
}
