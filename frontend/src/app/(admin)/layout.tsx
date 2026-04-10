import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";

/**
 * Admin route layout — server component, runs on every request to /admin/*
 *
 *   1. If not logged in            → redirect to /login
 *   2. If logged in but not admin  → redirect to /dashboard (student app)
 *   3. Otherwise                   → render the AdminShell wrapper
 *
 * The student `(app)` layout has no awareness of /admin and the student
 * sidebar no longer links here, so this is the only entry point.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Look up the role with the service-role client. RLS would otherwise force
  // an extra round-trip through the SECURITY DEFINER helper.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: student } = await serviceClient
    .from("students")
    .select("id, role, name")
    .eq("auth_id", user.id)
    .single();

  if (!student || student.role !== "tpc_admin") {
    redirect("/dashboard");
  }

  return (
    <AdminShell user={user} adminName={student.name}>
      {children}
    </AdminShell>
  );
}
