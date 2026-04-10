import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Authentication / authorization helpers used by API routes.
 *
 * Why service-role for the lookup?
 * --------------------------------
 * The student row stores `role` (student | tpc_admin). We can't read it via
 * the user-scoped client until RLS policies + a SECURITY DEFINER helper exist
 * for "is current user an admin", and even then we'd be doing a round-trip per
 * request. Using the service role here is fine because:
 *  1. The auth check itself comes from the user's session cookie, not a
 *     service-role bypass.
 *  2. We only return the boolean / a minimal student record.
 */

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthedStudent {
  user: User;
  studentId: string;
  role: "student" | "tpc_admin";
}

/**
 * Returns the authenticated user + linked student row, or a 401 Response.
 *
 * Use in any API route that should be reachable by signed-in users:
 *
 *   const auth = await requireUser();
 *   if (auth instanceof Response) return auth;
 *   const { user, studentId, role } = auth;
 */
export async function requireUser(): Promise<AuthedStudent | Response> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: student } = await serviceClient
    .from("students")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();

  if (!student) {
    // Student row doesn't exist yet — caller is responsible for creating it.
    // We still return the user so create-on-first-use flows can run.
    return {
      user,
      studentId: "",
      role: "student",
    };
  }

  return {
    user,
    studentId: student.id,
    role: (student.role as "student" | "tpc_admin") || "student",
  };
}

/**
 * Same as requireUser, but additionally requires `role === 'tpc_admin'`.
 * Returns 401 if not signed in, 403 if not an admin.
 *
 * Use this in /api/admin/* routes:
 *
 *   const auth = await requireAdmin();
 *   if (auth instanceof Response) return auth;
 */
export async function requireAdmin(): Promise<AuthedStudent | Response> {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;

  if (auth.role !== "tpc_admin") {
    return new Response(
      JSON.stringify({ error: "Forbidden — admin access required" }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return auth;
}
