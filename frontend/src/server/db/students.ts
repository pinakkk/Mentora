import { createClient as createServiceClient, SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Returns a Supabase client using the service-role key.
 * The service role bypasses RLS, so this must only be called from server code.
 */
function getServiceClient(): SupabaseClient {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type StudentRow = { id: string };

/**
 * Idempotently fetches or creates the `students` row for an authenticated user.
 *
 * Concurrency note: multiple API routes (chat, resume, /students/me, dashboard)
 * can fire in parallel on first login. A naive "select then insert" races and
 * the losers hit the `auth_id` / `email` unique constraint, which used to
 * surface to the user as "Failed to create student". This helper uses upsert
 * with `onConflict: "auth_id"` so only the first writer inserts and the rest
 * are no-ops, and then re-selects to return the canonical row.
 */
export async function getOrCreateStudent(
  user: User,
  extra: { resume_url?: string } = {},
  client?: SupabaseClient
): Promise<StudentRow> {
  const db = client ?? getServiceClient();

  // Fast path: row already exists for this auth_id.
  const existing = await db
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`students lookup failed: ${existing.error.message}`);
  }
  if (existing.data) {
    if (extra.resume_url) {
      await db
        .from("students")
        .update({ resume_url: extra.resume_url, updated_at: new Date().toISOString() })
        .eq("auth_id", user.id);
    }
    return existing.data;
  }

  // Second fast path: a row exists for this email but is linked to a stale
  // auth_id (e.g. the user deleted their Supabase auth account and signed up
  // again). Re-link the row to the new auth_id instead of inserting a dup.
  // Use ilike for a case-insensitive match — Supabase auth lowercases emails
  // on signup, but rows from older signups may have mixed case.
  if (user.email) {
    const relinked = await relinkByEmail(db, user.email, user.id, extra);
    if (relinked) return relinked;
  }

  // Slow path: race-safe upsert.
  const now = new Date().toISOString();
  const name =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Student";

  const upsert = await db
    .from("students")
    .upsert(
      {
        id: crypto.randomUUID(),
        auth_id: user.id,
        name,
        email: user.email!,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: "student",
        skills: [],
        readiness: 0,
        onboarded: false,
        preferences: {},
        ...(extra.resume_url ? { resume_url: extra.resume_url } : {}),
        created_at: now,
        updated_at: now,
      },
      { onConflict: "auth_id", ignoreDuplicates: true }
    )
    .select("id");

  if (upsert.error) {
    // Email unique-constraint conflict. Could happen if the byEmail relink path
    // missed the row (e.g. trailing whitespace, invisible chars, race window).
    // Fall back to a relink one more time.
    const isEmailDup =
      upsert.error.code === "23505" &&
      /students_email_key|email/i.test(upsert.error.message);
    if (isEmailDup && user.email) {
      const relinked = await relinkByEmail(db, user.email, user.id, extra);
      if (relinked) return relinked;
    }
    throw new Error(`students upsert failed: ${upsert.error.message}`);
  }

  if (upsert.data && upsert.data.length > 0) {
    return upsert.data[0];
  }

  // ignoreDuplicates: the row was inserted concurrently by another request.
  // Re-select to get the canonical id.
  const reselect = await db
    .from("students")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (reselect.error || !reselect.data) {
    throw new Error(
      `students post-upsert lookup failed: ${reselect.error?.message ?? "not found"}`
    );
  }
  return reselect.data;
}

/**
 * Looks up a `students` row by email (case-insensitively) and re-links it to a
 * new auth_id. Returns the row if found, null otherwise.
 */
async function relinkByEmail(
  db: SupabaseClient,
  email: string,
  newAuthId: string,
  extra: { resume_url?: string }
): Promise<StudentRow | null> {
  const byEmail = await db
    .from("students")
    .select("id, auth_id")
    .ilike("email", email)
    .maybeSingle();

  if (byEmail.error) {
    throw new Error(`students email lookup failed: ${byEmail.error.message}`);
  }
  if (!byEmail.data) return null;

  // Already linked to this auth_id — nothing to relink, just optionally patch.
  const patch: Record<string, unknown> = {
    auth_id: newAuthId,
    updated_at: new Date().toISOString(),
  };
  if (extra.resume_url) patch.resume_url = extra.resume_url;

  const relink = await db
    .from("students")
    .update(patch)
    .eq("id", byEmail.data.id)
    .select("id")
    .maybeSingle();

  if (relink.error || !relink.data) {
    throw new Error(
      `students relink failed: ${relink.error?.message ?? "not found"}`
    );
  }
  return relink.data;
}
