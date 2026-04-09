import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // List all files in the user's folder
    const { data: files, error } = await serviceClient.storage
      .from("resumes")
      .list(user.id, {
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("List resumes error:", error);
      return NextResponse.json({ resumes: [] });
    }

    const resumes = (files || [])
      .filter((f) => f.name.endsWith(".pdf"))
      .map((f) => {
        const { data: urlData } = serviceClient.storage
          .from("resumes")
          .getPublicUrl(`${user.id}/${f.name}`);
        return {
          name: f.name.replace(/^\d+-/, ""),
          fullName: f.name,
          url: urlData.publicUrl,
          createdAt: f.created_at,
          size: f.metadata?.size || 0,
        };
      });

    // Get student's latest analysis data
    const { data: student } = await serviceClient
      .from("students")
      .select("skills, readiness, resume_url, preferences")
      .eq("auth_id", user.id)
      .single();

    const prefs = (student?.preferences as Record<string, unknown>) || {};
    const lastAnalysis = prefs.lastAnalysis as Record<string, unknown> | undefined;

    return NextResponse.json({
      resumes,
      analysis: student?.skills && Array.isArray(student.skills) && student.skills.length > 0
        ? {
            skills: student.skills,
            readinessScore: student.readiness || 0,
            resumeUrl: student.resume_url,
            strengths: lastAnalysis?.strengths || [],
            gaps: lastAnalysis?.gaps || [],
            recommendations: lastAnalysis?.recommendations || [],
          }
        : null,
    });
  } catch (err) {
    console.error("List resumes error:", err);
    return NextResponse.json({ resumes: [], analysis: null });
  }
}
