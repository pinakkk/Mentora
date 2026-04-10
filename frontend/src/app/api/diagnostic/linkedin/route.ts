/**
 * F2 — LinkedIn audit (paste-content variant).
 *
 * LinkedIn blocks unauthenticated scraping. The realistic SaaS path is:
 *   1. User pastes the text of their public LinkedIn profile (or uploads
 *      the LinkedIn data export ZIP — handled separately).
 *   2. We run a Haiku extraction over it to pull experience, education,
 *      skills, certifications, projects.
 *   3. We cross-reference vs. the resume / GitHub picture and store the
 *      coherence summary as memory facts.
 *
 * POST body: { profileText: string, linkedinUrl?: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
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

const linkedinSchema = z.object({
  headline: z.string().nullable(),
  experiences: z.array(
    z.object({
      title: z.string(),
      org: z.string(),
      duration: z.string(),
      summary: z.string(),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      year: z.string(),
    })
  ),
  skills: z.array(z.string()),
  certifications: z.array(z.string()),
  coherenceScore: z.number().min(0).max(10),
  inconsistencies: z.array(z.string()),
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
  const { profileText, linkedinUrl } = body as {
    profileText?: string;
    linkedinUrl?: string;
  };

  if (!profileText || profileText.length < 100) {
    return NextResponse.json(
      {
        error:
          "Paste at least 100 characters of your LinkedIn profile (Experience + Education + Skills sections).",
      },
      { status: 400 }
    );
  }

  const { data: student } = await serviceClient
    .from("students")
    .select("id, skills, preferences")
    .eq("auth_id", user.id)
    .single();

  if (!student) {
    return NextResponse.json({ error: "Student record not found" }, { status: 404 });
  }

  const claimedSkills =
    (student.skills as Array<{ name: string; level: number }> | null) || [];
  const claimedSkillsList = claimedSkills.length
    ? claimedSkills.map((s) => `${s.name} (claimed ${s.level}/10)`).join(", ")
    : "(none yet)";

  let parsed;
  try {
    parsed = await generateJson({
      model: fastModel,
      schema: linkedinSchema,
      prompt: `You are extracting structured data from a pasted LinkedIn profile.

PASTED PROFILE TEXT:
"""
${profileText.slice(0, 12000)}
"""

CLAIMED SKILLS (from prior diagnostics):
${claimedSkillsList}

Return JSON with:
- headline: their LinkedIn headline (or null)
- experiences: list of { title, org, duration, summary } — pull from "Experience" section
- education:   list of { degree, institution, year }
- skills:      flat list of skills they list (max 30, dedupe)
- certifications: any certs mentioned
- coherenceScore (0–10): how well does the LinkedIn data line up with the claimed skills?
- inconsistencies: bullet phrases describing claim-vs-evidence mismatches
- recommendations: 2–4 short actions to improve the LinkedIn profile

OUTPUT SHAPE (exact):
{
  "headline": "..." | null,
  "experiences": [{"title": "...", "org": "...", "duration": "...", "summary": "..."}],
  "education": [{"degree": "...", "institution": "...", "year": "..."}],
  "skills": ["..."],
  "certifications": ["..."],
  "coherenceScore": 0,
  "inconsistencies": ["..."],
  "recommendations": ["..."]
}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "LinkedIn parse failed", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  // Save URL if user provided one
  if (linkedinUrl) {
    await serviceClient
      .from("students")
      .update({ linkedin_url: linkedinUrl })
      .eq("id", student.id);
  }

  // Persist key findings to memory (non-blocking)
  Promise.allSettled([
    memoryManager.storeFact(
      student.id,
      `LinkedIn coherence ${parsed.coherenceScore}/10. Headline: ${parsed.headline || "n/a"}. Skills listed: ${parsed.skills.slice(0, 6).join(", ")}.`,
      "skill",
      "high"
    ),
    ...parsed.experiences.slice(0, 3).map((e) =>
      memoryManager.storeFact(
        student.id,
        `Experience: ${e.title} @ ${e.org} (${e.duration}). ${e.summary}`,
        "milestone",
        "medium"
      )
    ),
    ...parsed.inconsistencies.slice(0, 3).map((i) =>
      memoryManager.storeFact(student.id, `LinkedIn inconsistency: ${i}`, "struggle", "medium")
    ),
  ]).catch(() => {});

  return NextResponse.json({ linkedin: parsed });
}
