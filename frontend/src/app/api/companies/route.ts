import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StudentSkill {
  name: string;
  level: number;
  confidence: number;
  source: string;
}

interface CompanyRequirement {
  id: string;
  company_id: string;
  skill: string;
  priority: string;
  min_level: number;
}

function normalizeSkillName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

/**
 * Fuzzy match a student skill against a company requirement skill.
 * Handles cases like "Java/Python" matching "Java" or "Python".
 */
function skillMatches(studentSkill: string, requiredSkill: string): boolean {
  const sNorm = normalizeSkillName(studentSkill);
  // Required skill may be "Java/Python" or "C++/C#/Java"
  const requiredParts = requiredSkill.split("/").map(normalizeSkillName);
  return requiredParts.some(
    (part) =>
      sNorm === part ||
      sNorm.includes(part) ||
      part.includes(sNorm)
  );
}

function computeMatchScore(
  studentSkills: StudentSkill[],
  requirements: CompanyRequirement[],
  studentCgpa?: number
) {
  if (!requirements || requirements.length === 0) {
    // No requirements listed — give a neutral-ish score based on skill count
    const baseScore = Math.min(50, studentSkills.length * 5);
    return {
      overall: baseScore,
      breakdown: {
        skillMatch: baseScore,
        cgpaScore: studentCgpa ? Math.min(100, (studentCgpa / 10) * 100) : 50,
        gapCount: 0,
        metCount: 0,
        totalRequired: 0,
      },
      matchedSkills: [] as string[],
      missingSkills: [] as string[],
      actionableLevers: [] as Array<{ action: string; impact: number; effort: string }>,
    };
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];
  const levers: Array<{ action: string; impact: number; effort: string }> = [];

  for (const req of requirements) {
    const weight = req.priority === "required" ? 2 : 1;
    totalWeight += weight;

    // Find the best matching student skill
    const match = studentSkills.find((s) => skillMatches(s.name, req.skill));

    if (match) {
      // Skill match score: how close to min_level (capped at 100%)
      const levelRatio = Math.min(match.level / req.min_level, 1.2); // up to 120% if exceeding
      const skillScore = Math.min(100, levelRatio * 100);
      totalWeightedScore += skillScore * weight;
      matchedSkills.push(req.skill);

      if (match.level < req.min_level) {
        const gap = req.min_level - match.level;
        levers.push({
          action: `Improve ${req.skill} from ${match.level}/10 to ${req.min_level}/10`,
          impact: Math.round((gap / req.min_level) * 30),
          effort: gap <= 2 ? "low" : gap <= 4 ? "medium" : "high",
        });
      }
    } else {
      // Skill not found at all
      totalWeightedScore += 0;
      missingSkills.push(req.skill);
      levers.push({
        action: `Learn ${req.skill} (required level: ${req.min_level}/10)`,
        impact: Math.round((weight / totalWeight) * 40),
        effort: req.min_level <= 4 ? "medium" : "high",
      });
    }
  }

  const skillMatch = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  const cgpaScore = studentCgpa ? Math.min(100, (studentCgpa / 10) * 100) : 50;

  // Overall = 75% skill match + 25% CGPA factor
  const overall = Math.round(skillMatch * 0.75 + cgpaScore * 0.25);

  return {
    overall: Math.min(100, Math.max(0, overall)),
    breakdown: {
      skillMatch,
      cgpaScore: Math.round(cgpaScore),
      gapCount: missingSkills.length,
      metCount: matchedSkills.length,
      totalRequired: requirements.length,
    },
    matchedSkills,
    missingSkills,
    actionableLevers: levers.sort((a, b) => b.impact - a.impact).slice(0, 3),
  };
}

export async function GET() {
  // Try to get current user's skills for personalized matching
  let studentSkills: StudentSkill[] = [];
  let studentCgpa: number | undefined;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: student } = await serviceClient
        .from("students")
        .select("skills, cgpa")
        .eq("auth_id", user.id)
        .single();

      if (student) {
        studentSkills = (student.skills as StudentSkill[]) || [];
        studentCgpa = student.cgpa as number | undefined;
      }
    }
  } catch {
    // Not logged in or no student record — return companies without match scores
  }

  const { data: companies } = await serviceClient
    .from("companies")
    .select("*, company_requirements(*)")
    .order("visit_date", { ascending: true });

  if (!companies) {
    return NextResponse.json({ companies: [] });
  }

  // Compute match scores for each company
  const enrichedCompanies = companies.map((company) => {
    const requirements = (company.company_requirements || []) as CompanyRequirement[];
    const matchScore = studentSkills.length > 0
      ? computeMatchScore(studentSkills, requirements, studentCgpa)
      : null;

    return {
      ...company,
      requirements: requirements.map((r: CompanyRequirement) => ({
        id: r.id,
        companyId: r.company_id,
        skill: r.skill,
        priority: r.priority,
        minLevel: r.min_level,
      })),
      matchScore,
    };
  });

  return NextResponse.json({ companies: enrichedCompanies });
}
