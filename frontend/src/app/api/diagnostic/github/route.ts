/**
 * F2 — GitHub audit endpoint.
 *
 * POST /api/diagnostic/github
 * body: { url?: string, username?: string }
 *
 * Fetches the public GitHub profile, summarizes it, asks Sonnet to
 * cross-reference the activity against the student's claimed skills,
 * and stores the result as memory facts.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { auditGitHub } from "@/server/agents/github-audit";
import { rateLimitOrReject } from "@/lib/ratelimit";
import { memoryManager } from "@/server/memory/manager";
import { fastModel } from "@/lib/ai/provider";
import { generateJson } from "@/lib/ai/json";
import { z } from "zod";

export const maxDuration = 60;

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const auditSchema = z.object({
  coherenceScore: z.number().min(0).max(10),
  verifiedSkills: z.array(
    z.object({
      skill: z.string(),
      evidence: z.string(),
      confidence: z.number().min(0).max(1),
    })
  ),
  inconsistencies: z.array(z.string()),
  strengths: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = await rateLimitOrReject("diagnostic", user.id);
  if (rl) return rl;

  const body = await req.json().catch(() => ({}));
  const target = body.url || body.username;
  if (!target) {
    return NextResponse.json(
      { error: "Provide a GitHub username or profile URL." },
      { status: 400 }
    );
  }

  const { data: student } = await serviceClient
    .from("students")
    .select("id, skills, github_url")
    .eq("auth_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

  // 1. Fetch public GitHub data (no AI yet — cheap and verifiable)
  let audit;
  try {
    audit = await auditGitHub(target);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "GitHub fetch failed" },
      { status: 422 }
    );
  }

  // 2. Ask Haiku to cross-reference against the student's claimed skills
  const claimedSkills = (student.skills as Array<{ name: string; level: number }> | null) || [];
  const claimedSkillsList = claimedSkills.length
    ? claimedSkills.map((s) => `${s.name} (claimed ${s.level}/10)`).join(", ")
    : "(none yet)";

  const repoSummary = audit.highlightedRepos
    .map(
      (r) =>
        `- ${r.name} [${r.language || "?"}, ★${r.stars}, ${r.pushedAt?.slice(0, 10) || "?"}]: ${r.description || "no description"}`
    )
    .join("\n");

  const langSummary = audit.topLanguages
    .map((l) => `${l.language} (${l.repoCount} repos)`)
    .join(", ");

  let aiAudit;
  try {
    aiAudit = await generateJson({
      model: fastModel,
      schema: auditSchema,
      prompt: `You are Mentora's Diagnostic Agent doing a GitHub coherence audit. Cross-reference the student's CLAIMED skills against what their PUBLIC GitHub actually shows.

CLAIMED SKILLS:
${claimedSkillsList}

GITHUB DATA:
- Username: ${audit.username}
- Public repos: ${audit.publicRepos}
- Followers: ${audit.followers}
- Total stars: ${audit.totalStars}
- Recently active (90d): ${audit.recentlyActive ? "yes" : "no"}
- Top languages by repo: ${langSummary || "(none)"}

TOP REPOS:
${repoSummary || "(none)"}

YOUR JOB:
Return JSON with:
- coherenceScore (0–10): how well does GitHub back up the claimed skills?
                          0 = total mismatch, 10 = strong alignment.
- verifiedSkills: skills the GitHub data REALLY supports, each with:
    { skill, evidence (specific repo or pattern), confidence (0–1) }
- inconsistencies: claimed skills with no GitHub evidence (be specific).
- strengths: 2–4 concrete things this profile does well.
- recommendations: 2–4 actionable improvements (e.g. "add a README to repo X",
                   "build one project with measurable impact metrics").

OUTPUT SHAPE (exact):
{
  "coherenceScore": 0,
  "verifiedSkills": [{"skill": "...", "evidence": "...", "confidence": 0.0}],
  "inconsistencies": ["..."],
  "strengths": ["..."],
  "recommendations": ["..."]
}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "AI audit failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // 3. Save the GitHub URL on the student profile (if it wasn't already)
  if (!student.github_url) {
    await serviceClient
      .from("students")
      .update({ github_url: `https://github.com/${audit.username}` })
      .eq("id", student.id);
  }

  // 4. Persist the audit summary as memory facts (non-blocking)
  Promise.allSettled([
    memoryManager.storeFact(
      student.id,
      `GitHub coherence ${aiAudit.coherenceScore}/10. Top langs: ${langSummary || "none"}. Active: ${audit.recentlyActive ? "yes" : "no"}.`,
      "skill",
      "high"
    ),
    ...aiAudit.verifiedSkills.slice(0, 5).map((s) =>
      memoryManager.storeFact(
        student.id,
        `Verified skill from GitHub: ${s.skill} — ${s.evidence}`,
        "skill",
        "medium"
      )
    ),
    ...aiAudit.inconsistencies.slice(0, 3).map((i) =>
      memoryManager.storeFact(
        student.id,
        `GitHub inconsistency: ${i}`,
        "struggle",
        "medium"
      )
    ),
  ]).catch(() => {});

  return NextResponse.json({
    audit: {
      ...audit,
      // Trim raw repos out of the response — too noisy for the UI
      rawRepos: undefined,
    },
    aiAudit,
  });
}
