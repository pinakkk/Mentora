import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: alerts } = await serviceClient
    .from("tpc_alerts")
    .select("*, students(name)")
    .order("created_at", { ascending: false })
    .limit(20);

  const formatted = (alerts || []).map((a: Record<string, unknown>) => ({
    id: a.id,
    studentId: a.student_id,
    studentName: (a.students as Record<string, string>)?.name || "Unknown",
    severity: a.severity,
    pattern: a.pattern,
    context: a.context,
    recommendation: a.recommendation,
    status: a.status,
    createdAt: a.created_at,
  }));

  return NextResponse.json({ alerts: formatted });
}
