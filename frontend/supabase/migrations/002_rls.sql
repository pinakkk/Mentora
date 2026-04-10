-- ============================================================================
--  002_rls.sql — Row Level Security policies
--
--  Enables RLS on every per-student table and locks rows to their owner.
--  Service-role keys bypass RLS by design, so existing API routes that use
--  the service role keep working unchanged. Anything reached with the user's
--  anon JWT (PostgREST direct, supabase-js client) is now protected.
--
--  Convention:
--    - Students reach their OWN row via auth.uid() == students.auth_id
--    - All child tables (memory_facts, tasks, plans, etc.) match by joining
--      back to students for auth.uid().
--    - tpc_admin role gets read access to everything via a JWT-claim check.
--    - Companies and CompanyRequirement are public-read for any signed-in
--      user (everyone needs to see the campus drives).
-- ============================================================================

-- Helper: is the current JWT a tpc_admin?
create or replace function public.is_tpc_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students
    where auth_id = (auth.uid())::text
      and role = 'tpc_admin'
  );
$$;

-- Helper: get current user's student.id
create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.students
  where auth_id = (auth.uid())::text
  limit 1;
$$;

-- ─── students ────────────────────────────────────────────
alter table public.students enable row level security;

drop policy if exists "students_self_select" on public.students;
create policy "students_self_select"
  on public.students
  for select
  using (auth_id = (auth.uid())::text or public.is_tpc_admin());

drop policy if exists "students_self_update" on public.students;
create policy "students_self_update"
  on public.students
  for update
  using (auth_id = (auth.uid())::text)
  with check (auth_id = (auth.uid())::text);

drop policy if exists "students_self_insert" on public.students;
create policy "students_self_insert"
  on public.students
  for insert
  with check (auth_id = (auth.uid())::text);

-- ─── memory_facts ────────────────────────────────────────
alter table public.memory_facts enable row level security;

drop policy if exists "memory_self" on public.memory_facts;
create policy "memory_self"
  on public.memory_facts
  for all
  using (
    student_id = public.current_student_id()
    or public.is_tpc_admin()
  )
  with check (student_id = public.current_student_id());

-- ─── tasks ───────────────────────────────────────────────
alter table public.tasks enable row level security;

drop policy if exists "tasks_self" on public.tasks;
create policy "tasks_self"
  on public.tasks
  for all
  using (
    student_id = public.current_student_id()
    or public.is_tpc_admin()
  )
  with check (student_id = public.current_student_id());

-- ─── prep_plans ──────────────────────────────────────────
alter table public.prep_plans enable row level security;

drop policy if exists "plans_self" on public.prep_plans;
create policy "plans_self"
  on public.prep_plans
  for all
  using (
    student_id = public.current_student_id()
    or public.is_tpc_admin()
  )
  with check (student_id = public.current_student_id());

-- ─── assessments ─────────────────────────────────────────
alter table public.assessments enable row level security;

drop policy if exists "assessments_self" on public.assessments;
create policy "assessments_self"
  on public.assessments
  for all
  using (
    student_id = public.current_student_id()
    or public.is_tpc_admin()
  )
  with check (student_id = public.current_student_id());

-- ─── conversations ───────────────────────────────────────
alter table public.conversations enable row level security;

drop policy if exists "conversations_self" on public.conversations;
create policy "conversations_self"
  on public.conversations
  for all
  using (
    student_id = public.current_student_id()
    or public.is_tpc_admin()
  )
  with check (student_id = public.current_student_id());

-- ─── nudges ──────────────────────────────────────────────
alter table public.nudges enable row level security;

drop policy if exists "nudges_self_read" on public.nudges;
create policy "nudges_self_read"
  on public.nudges
  for select
  using (
    student_id = public.current_student_id()
    or public.is_tpc_admin()
  );

-- Nudges are written by the cron worker (service-role), not by users.

-- ─── tpc_alerts ──────────────────────────────────────────
alter table public.tpc_alerts enable row level security;

-- Only admins can read alerts. Inserts come from service-role workers.
drop policy if exists "alerts_admin_only" on public.tpc_alerts;
create policy "alerts_admin_only"
  on public.tpc_alerts
  for select
  using (public.is_tpc_admin());

drop policy if exists "alerts_admin_update" on public.tpc_alerts;
create policy "alerts_admin_update"
  on public.tpc_alerts
  for update
  using (public.is_tpc_admin())
  with check (public.is_tpc_admin());

-- ─── applications ────────────────────────────────────────
alter table public.applications enable row level security;

drop policy if exists "applications_self" on public.applications;
create policy "applications_self"
  on public.applications
  for all
  using (
    student_id = public.current_student_id()
    or public.is_tpc_admin()
  )
  with check (student_id = public.current_student_id());

-- ─── companies (public-ish) ──────────────────────────────
alter table public.companies enable row level security;

drop policy if exists "companies_authed_read" on public.companies;
create policy "companies_authed_read"
  on public.companies
  for select
  using (auth.uid() is not null);

drop policy if exists "companies_admin_write" on public.companies;
create policy "companies_admin_write"
  on public.companies
  for all
  using (public.is_tpc_admin())
  with check (public.is_tpc_admin());

-- ─── company_requirements ────────────────────────────────
alter table public.company_requirements enable row level security;

drop policy if exists "company_reqs_authed_read" on public.company_requirements;
create policy "company_reqs_authed_read"
  on public.company_requirements
  for select
  using (auth.uid() is not null);

drop policy if exists "company_reqs_admin_write" on public.company_requirements;
create policy "company_reqs_admin_write"
  on public.company_requirements
  for all
  using (public.is_tpc_admin())
  with check (public.is_tpc_admin());

-- ============================================================================
--  Grants — needed for the RLS-aware anon role to actually see the rows
--  it's allowed to see. Without these, RLS policies are dead letters.
-- ============================================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.students        to authenticated;
grant select, insert, update, delete on public.memory_facts  to authenticated;
grant select, insert, update, delete on public.tasks         to authenticated;
grant select, insert, update, delete on public.prep_plans    to authenticated;
grant select, insert, update, delete on public.assessments   to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select on public.nudges        to authenticated;
grant select, update on public.tpc_alerts to authenticated;
grant select, insert, update, delete on public.applications  to authenticated;
grant select on public.companies to authenticated;
grant select on public.company_requirements to authenticated;
