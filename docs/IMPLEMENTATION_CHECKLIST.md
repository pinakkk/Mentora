# PlaceAI — Implementation Checklist

> Snapshot of what's implemented vs. remaining after this session.
> Date: 2026-04-10

---

## ✅ Completed in this session

### SaaS hardening

- [x] **Real PDF parsing** for resume diagnostic
  - New: `src/lib/pdf.ts` (uses `unpdf`, serverless-safe pdfjs build)
  - `src/app/api/resume/analyze/route.ts` now fetches the PDF, extracts text,
    and feeds the actual content to the Diagnostic Agent — no more
    "generate a typical Indian student" prompt.
  - Returns `_meta: { resumePages, resumeChars }` for transparency.
  - 422 on unreadable / non-PDF / empty files.

- [x] **Row-Level Security**
  - New: `frontend/supabase/migrations/002_rls.sql`
  - RLS enabled on: `students`, `memory_facts`, `tasks`, `prep_plans`,
    `assessments`, `conversations`, `nudges`, `tpc_alerts`, `applications`,
    `companies`, `company_requirements`.
  - Helper functions: `is_tpc_admin()`, `current_student_id()`.
  - Service-role usage in existing routes is unaffected (bypasses RLS as
    intended); future authed-client paths get protection automatically.
  - **Action required:** Run the migration against the Supabase project:
    `supabase db push` (or apply via dashboard SQL editor).

- [x] **Admin auth** on all `/api/admin/*` routes
  - New: `src/lib/auth.ts` exporting `requireUser()` and `requireAdmin()`.
  - Applied to `/api/admin/dashboard` and `/api/admin/alerts` — both now
    return 403 unless the caller is `role = 'tpc_admin'`.

- [x] **Rate limiting** (Upstash sliding-window)
  - New: `src/lib/ratelimit.ts` with quotas tuned per route kind:
    - `chat`: 30 req/min
    - `interview`: 20 req/min
    - `resume`: 5 req/hour (most expensive)
    - `diagnostic`: 10 req/hour (GitHub/LinkedIn/micro-assess)
  - Applied to: chat, mock chat, resume/analyze, interview/prepare,
    interview/evaluate, diagnostic/github, diagnostic/linkedin,
    diagnostic/micro-assessment.
  - Returns 429 with `Retry-After` header. Safe-degrades when Upstash env
    is missing (logs warning, allows request).

### Cost optimization

- [x] **Two-tier model routing**
  - `src/lib/ai/provider.ts` exports `chatModel` (Sonnet 4 via OpenRouter)
    and `fastModel` (Llama 3.3 70B via Groq's OpenAI-compatible API).
  - Both model IDs env-overridable: `OPENROUTER_SONNET_MODEL`,
    `GROQ_FAST_MODEL`.
  - Groq is wired through `@ai-sdk/openai`'s `createOpenAI` pointing at
    `https://api.groq.com/openai/v1`, so the whole codebase keeps using the
    Vercel AI SDK (`generateText`, `streamText`, `wrapLanguageModel`, tool
    calls) without learning a second SDK.
  - **Sonnet 4** stays on: Coach reasoning, mock interview generation,
    resume diagnostic, plan generation.
  - **Llama 3.3 70B** handles: `fact-extractor.ts`, `burnout-detector.ts`,
    `accountability.ts` (nudge text), `diagnostic/github`,
    `diagnostic/linkedin`, `diagnostic/micro-assessment`.

### 3-layer memory architecture

- [x] **Layer 1 — Working memory:** in-request `messages` array (existing,
      formalized in context builder).
- [x] **Layer 2 — Episodic memory (Redis):**
  - New: `src/lib/redis.ts` (lazy Upstash client, safe-degrades to null).
  - New: `src/server/memory/episodic.ts` with:
    - `pushSummary` / `getRecentSummaries` (capped FIFO, 7d TTL)
    - `pushHotFact` / `getHotFacts` (3d TTL, mirror of Layer 3 writes)
    - `setEpisodicState` / `getEpisodicState` (last interaction, emotional
      state, consecutive low-engagement count, 14d TTL)
- [x] **Layer 3 — Semantic memory (pgvector):** existing `memoryManager`
      now mirrors writes into Layer 2 hot cache automatically.
- [x] **Context builder** (`src/server/memory/context-builder.ts`) reads
      from all three layers, dedupes facts across episodic/semantic, falls
      back to durable Postgres summaries when Redis is empty, and exposes
      `emotionalState` to the Coach prompt.

### Background work correctness

- [x] **`after()` from `next/server`** wraps fact extraction, conversation
      summarization, emotion detection, and `touchInteraction`. This
      replaces the previous fire-and-forget pattern that could be killed by
      Vercel before completing.
- [x] **Conversation summarizer** added (`summarizeConversation` in
      `fact-extractor.ts`) — uses Haiku, runs after ≥10 turns, persists to
      both Postgres `conversations.summary` and Redis episodic.

### Feature checklist (F1–F12)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| F1 | Resume Deep Dive | ✅ | Real PDF parsing via unpdf; Sonnet diagnostic with actual text. |
| F2 | GitHub / LinkedIn Audit | ✅ | `/api/diagnostic/github` (real GitHub REST), `/api/diagnostic/linkedin` (paste-content variant — LinkedIn blocks scraping). Both run AI cross-reference vs. claimed skills, persist findings as memory facts. |
| F3 | Skill Gap Detection (verified) | ✅ | `/api/diagnostic/micro-assessment` GET generates 5 Q's, POST grades and updates `students.skills` with `confidence: 1` and `source: micro-assessment`. |
| F4 | Personalized Prep Plan | ✅ | Pre-existing `plan-generator.ts`, unchanged. |
| F5 | Adaptive Mock Interviews | ✅ | Pre-existing routes; rate-limited now. (Real-time difficulty adaptation still pending — see Remaining.) |
| F6 | Coaching Chat with Memory | ✅ | Now consumes the full 3-layer memory + emotional state. |
| F7 | Proactive Nudges | ✅* | `/api/cron/nudges` route + accountability sweep + `/api/students/me/nudges` GET/PATCH inbox. *Auto-scheduling deferred — Vercel Cron requires Pro. Trigger manually with `Authorization: Bearer $CRON_SECRET` or wire to any external scheduler (cron-job.org, GitHub Actions, EasyCron). See "Remaining". |
| F8 | Task Tracking & Follow-up | ✅* | Accountability sweep detects overdue tasks and sends graduated nudges. *Same caveat as F7 — runs on demand until a scheduler is wired. |
| F9 | TPC Escalation | ✅* | Auto-escalation to `tpc_alerts` when L3 hit; deduped to 1 alert per 72h per student. *Same caveat as F7. |
| F10 | Coach's Notebook | ✅ | Pre-existing, unchanged. |
| F11 | Burnout & Emotion Detection | ✅ | New `src/server/agents/burnout-detector.ts`. Runs on every chat turn via `after()`, classifies into neutral/engaged/frustrated/anxious/burnout, stores in episodic state, auto-raises a TPC alert after 3 consecutive burnout turns. |
| F12 | Progress Dashboard | ✅ | Pre-existing, unchanged. |

### Build / quality gates

- [x] `npx tsc --noEmit` — passes
- [x] `npx eslint <new files>` — passes
- [x] `npx next build` — passes (42 routes, all new endpoints picked up)

---

## 🟡 Remaining (out of scope for this session)

### High-priority SaaS gaps

- [ ] **Multi-tenancy** — add `Organization` (college) entity and scope
      `Student.organization_id`. Cheap to add now, expensive later.
- [ ] **Stripe billing + plan tiers** — free/college/enterprise with quota
      enforcement on LLM calls.
- [ ] **Per-user usage metering** — track tokens spent per student so we can
      enforce "10 mock interviews per month" etc.
- [ ] **Switch routes to authed Supabase client** where possible — RLS now
      exists but most routes still use the service-role key. The reads in
      `students/me/*` are good candidates for migration first.
- [ ] **Tracing** — Helicone (via OpenRouter) or Langfuse for tool-call
      debugging and per-user cost attribution.
- [ ] **Rename `middleware.ts` → `proxy.ts`** — Next 16 deprecates the
      `middleware` file convention. Build currently shows a deprecation
      warning. Pure rename, zero behavior change.
- [ ] **Auto-schedule cron jobs** — `/api/cron/nudges` and
      `/api/cron/accountability` are implemented and authenticated with
      `CRON_SECRET`, but Vercel's free tier doesn't include Cron. Options
      when ready:
      1. Upgrade to Vercel Pro and re-add `vercel.json` with `crons[]`
         (the old config is in git history).
      2. Use a free external scheduler — `cron-job.org`, `EasyCron`, GitHub
         Actions on a schedule, or Upstash QStash — to GET the routes with
         the `Authorization: Bearer $CRON_SECRET` header.
      Until then F7/F8/F9 still work on demand: `curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/nudges`.

### Schema / data-model improvements

- [ ] **Decompose `conversations.messages` JSON blob** into a proper
      `messages` table — current single-row-per-student pattern will become
      a multi-MB blob after 200+ turns.
- [ ] **`conversation_summaries` table** referenced from old code — either
      create it or remove the dead reference. Currently we persist summaries
      via `conversations.summary` directly, which works.
- [ ] **Pick one DB layer** — Prisma is configured but nothing uses it at
      runtime; everything goes through `supabase.from(...)`. Migrate to
      Prisma Client OR delete the Prisma schema and keep raw Supabase.
- [ ] **`pgvector-prisma`** — so embedding columns aren't `Unsupported`
      and Prisma can read them.

### Feature gaps (Bonus PS1 features still missing)

- [ ] **B1 — Selection Probability Engine** —
      `P(selection) = f(skill_match, cgpa, projects, competition)`
- [ ] **B2 — Company Intelligence Cards** — currently just lists rows; add
      JD extraction, interview-pattern AI, culture notes.
- [ ] **B3 — TPC Admin Dashboard (full)** — current is "lite" (4 numbers).
      Need: skill-gap heatmap, batch readiness chart, AI-generated insights.
- [ ] **B4 — Skill-Market Alignment View**
- [ ] **B5 — Smart Application Strategy**

### Polish / nice-to-haves

- [ ] **F5 real-time difficulty adaptation** — currently mock interviews
      pre-generate 6 questions. The Mock Interview Agent should escalate
      difficulty after correct answers and de-escalate after wrong ones.
- [ ] **GitHub OAuth** for richer repo access (private repos, contribution
      heatmap) instead of just public REST API.
- [ ] **LinkedIn data-export ZIP upload** as a more reliable alternative
      to paste-text in `/api/diagnostic/linkedin`.
- [ ] **Tests** — `TEST_PLAN.md` exists but no test runner is wired.
- [ ] **Frontend wiring** — the new endpoints (`/api/diagnostic/*`,
      `/api/students/me/nudges`) need UI components in
      `(app)/resume`, `(app)/dashboard`, etc. The endpoints are correct
      and ready; just no buttons yet.
- [ ] **Embedding cache** — `manager.ts:isDuplicate` re-embeds on every
      store. Cache by content hash to halve embedding cost.

---

## 📋 Operator setup checklist

To get the new code fully working in production:

1. **Apply the RLS migration**
   ```bash
   cd frontend
   supabase db push
   # OR run frontend/supabase/migrations/002_rls.sql via the dashboard
   ```

2. **Set required env vars**
   ```env
   # Already needed
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   OPENROUTER_API_KEY=...
   GROQ_API_KEY=...

   # NEW — Upstash Redis (rate limiting + episodic memory)
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...

   # NEW — Cron auth (used by manual triggers + future external scheduler)
   CRON_SECRET=<random-32-char-string>

   # OPTIONAL — model overrides
   OPENROUTER_SONNET_MODEL=anthropic/claude-sonnet-4
   GROQ_FAST_MODEL=llama-3.3-70b-versatile

   # OPTIONAL — lifts GitHub API rate limit from 60 → 5000 req/hr
   GITHUB_TOKEN=ghp_...
   ```

3. **Promote yourself to TPC admin** (otherwise `/api/admin/*` returns 403):
   ```sql
   update students set role = 'tpc_admin' where email = 'you@college.edu';
   ```

4. **Cron jobs — manual / external for now** *(Vercel Pro deferred)*
   The two cron routes still work; they just aren't auto-scheduled.
   Trigger them on demand:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/nudges
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/accountability
   ```
   When you're ready to automate, point any external scheduler
   (`cron-job.org`, GitHub Actions, Upstash QStash, etc.) at those URLs
   with the `Authorization` header — or upgrade to Vercel Pro and add a
   `vercel.json` with a `crons[]` block (see git history for the prior
   config).

5. **First-time test flow**
   - Sign in → upload a real PDF resume → confirm `/api/resume/analyze` 200s
     and skills appear that match the actual resume content
   - POST `/api/diagnostic/github` `{ "url": "github.com/your-handle" }` →
     confirm coherence audit returns
   - GET `/api/diagnostic/micro-assessment?skill=DSA` then POST answers →
     confirm `students.skills` updates
   - Trigger `/api/cron/nudges` manually with `Authorization: Bearer $CRON_SECRET`
     → confirm nudges appear at `/api/students/me/nudges`
