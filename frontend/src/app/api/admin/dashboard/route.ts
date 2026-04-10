import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StudentRow {
  id: string;
  name: string | null;
  department: string | null;
  readiness: number | null;
  onboarded: boolean | null;
  role: string | null;
  created_at: string;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof Response) return auth;

  // Pull every student row, then filter in JS. The previous version used
  // .eq("role", "student") which silently dropped rows where the role
  // column was null (legacy data) and counted 0 even when there were
  // hundreds of students. Filtering in JS is also defensive against any
  // future enum changes.
  const { data: rawStudents, error: studentsError } = await serviceClient
    .from("students")
    .select("id, name, department, readiness, onboarded, role, created_at");

  if (studentsError) {
    return NextResponse.json(
      { error: studentsError.message },
      { status: 500 }
    );
  }

  const allStudents = (rawStudents || []) as StudentRow[];
  // Anything that isn't explicitly an admin counts as a student.
  const students = allStudents.filter((s) => s.role !== "tpc_admin");

  const totalStudents = students.length;
  const avgReadiness =
    totalStudents > 0
      ? Math.round(
          students.reduce((sum, s) => sum + (s.readiness || 0), 0) /
            totalStudents
        )
      : 0;
  const atRiskCount = students.filter((s) => (s.readiness || 0) < 30).length;
  const onboardedCount = students.filter((s) => s.onboarded === true).length;

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSignups = students.filter(
    (s) => new Date(s.created_at).getTime() > sevenDaysAgo
  ).length;

  const atRiskStudents = students
    .filter((s) => (s.readiness || 0) < 30)
    .sort((a, b) => (a.readiness || 0) - (b.readiness || 0))
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      name: s.name || "Unknown",
      readiness: s.readiness || 0,
      department: s.department,
    }));

  const topPerformers = students
    .filter((s) => (s.readiness || 0) > 0)
    .sort((a, b) => (b.readiness || 0) - (a.readiness || 0))
    .slice(0, 8)
    .map((s) => ({
      id: s.id,
      name: s.name || "Unknown",
      readiness: s.readiness || 0,
      department: s.department,
    }));

  // Count placed students (offers landed)
  const { count: placedCount } = await serviceClient
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "offer");

  return NextResponse.json({
    totalStudents,
    avgReadiness,
    atRiskCount,
    onboardedCount,
    recentSignups,
    placedCount: placedCount || 0,
    atRiskStudents,
    topPerformers,
  });
}
