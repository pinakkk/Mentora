import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: students } = await serviceClient
    .from("students")
    .select("readiness, role")
    .eq("role", "student");

  const allStudents = students || [];
  const totalStudents = allStudents.length;
  const avgReadiness = totalStudents > 0
    ? Math.round(
        allStudents.reduce((sum, s) => sum + (s.readiness || 0), 0) / totalStudents
      )
    : 0;
  const atRiskCount = allStudents.filter((s) => (s.readiness || 0) < 30).length;

  // Count placed students (those with 'offer' status applications)
  const { count: placedCount } = await serviceClient
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "offer");

  return NextResponse.json({
    totalStudents,
    avgReadiness,
    atRiskCount,
    placedCount: placedCount || 0,
  });
}
