/**
 * Seed script for Mentora demo data.
 * Run with: npm run seed
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const companies = [
  {
    name: "TCS",
    description:
      "Tata Consultancy Services - India's largest IT services company. Known for mass hiring and strong training programs.",
    visit_date: "2026-05-15",
    deadline: "2026-05-10",
    tier: "mass",
    roles: ["Software Developer", "Systems Engineer", "Digital Analyst"],
    interview_pattern: {
      rounds: [
        { type: "technical", duration: 45, difficulty: "medium" },
        { type: "hr", duration: 30, difficulty: "easy" },
      ],
    },
    historical_data: {
      avgPackage: 750000,
      studentsHired: 120,
      selectionRate: 0.65,
    },
  },
  {
    name: "Infosys",
    description:
      "Global IT consulting and services leader. Offers InfyTQ program for early engagement.",
    visit_date: "2026-05-20",
    deadline: "2026-05-15",
    tier: "regular",
    roles: ["Systems Engineer", "Digital Specialist", "Power Programmer"],
    interview_pattern: {
      rounds: [
        { type: "coding", duration: 60, difficulty: "medium" },
        { type: "technical", duration: 45, difficulty: "medium" },
        { type: "hr", duration: 20, difficulty: "easy" },
      ],
    },
    historical_data: {
      avgPackage: 850000,
      studentsHired: 80,
      selectionRate: 0.45,
    },
  },
  {
    name: "Wipro",
    description:
      "Leading global IT services company with strong presence in digital transformation.",
    visit_date: "2026-05-25",
    deadline: "2026-05-20",
    tier: "mass",
    roles: ["Project Engineer", "Software Developer"],
    interview_pattern: {
      rounds: [
        { type: "technical", duration: 40, difficulty: "medium" },
        { type: "hr", duration: 20, difficulty: "easy" },
      ],
    },
    historical_data: {
      avgPackage: 650000,
      studentsHired: 100,
      selectionRate: 0.55,
    },
  },
  {
    name: "Google",
    description:
      "World-leading tech company. Extremely competitive campus hiring with focus on DSA and system design.",
    visit_date: "2026-06-10",
    deadline: "2026-06-01",
    tier: "dream",
    roles: ["SDE", "SRE"],
    interview_pattern: {
      rounds: [
        { type: "coding", duration: 45, difficulty: "hard" },
        { type: "coding", duration: 45, difficulty: "hard" },
        { type: "system_design", duration: 45, difficulty: "hard" },
        { type: "behavioral", duration: 30, difficulty: "medium" },
      ],
    },
    historical_data: {
      avgPackage: 4500000,
      studentsHired: 3,
      selectionRate: 0.02,
    },
  },
  {
    name: "Microsoft",
    description:
      "Global technology giant with strong campus presence in India. Values problem-solving and collaboration.",
    visit_date: "2026-06-15",
    deadline: "2026-06-10",
    tier: "dream",
    roles: ["SDE", "PM"],
    interview_pattern: {
      rounds: [
        { type: "coding", duration: 60, difficulty: "hard" },
        { type: "technical", duration: 45, difficulty: "hard" },
        { type: "system_design", duration: 45, difficulty: "medium" },
        { type: "hr", duration: 30, difficulty: "medium" },
      ],
    },
    historical_data: {
      avgPackage: 4200000,
      studentsHired: 5,
      selectionRate: 0.03,
    },
  },
  {
    name: "Amazon",
    description:
      "E-commerce and cloud giant with strong focus on leadership principles and problem-solving.",
    visit_date: "2026-06-20",
    deadline: "2026-06-15",
    tier: "dream",
    roles: ["SDE-1", "QAE"],
    interview_pattern: {
      rounds: [
        { type: "coding", duration: 60, difficulty: "hard" },
        { type: "technical", duration: 45, difficulty: "hard" },
        { type: "behavioral", duration: 45, difficulty: "medium" },
      ],
    },
    historical_data: {
      avgPackage: 4000000,
      studentsHired: 8,
      selectionRate: 0.05,
    },
  },
  {
    name: "Flipkart",
    description: "India's leading e-commerce platform. Strong engineering culture.",
    visit_date: "2026-06-25",
    deadline: "2026-06-20",
    tier: "dream",
    roles: ["SDE-1"],
    interview_pattern: {
      rounds: [
        { type: "coding", duration: 60, difficulty: "hard" },
        { type: "system_design", duration: 45, difficulty: "medium" },
        { type: "behavioral", duration: 30, difficulty: "medium" },
      ],
    },
    historical_data: {
      avgPackage: 3500000,
      studentsHired: 6,
      selectionRate: 0.04,
    },
  },
  {
    name: "Razorpay",
    description: "India's leading fintech company. Fast-paced, product-focused engineering.",
    visit_date: "2026-07-01",
    deadline: "2026-06-25",
    tier: "regular",
    roles: ["Backend Engineer", "Frontend Engineer"],
    interview_pattern: {
      rounds: [
        { type: "coding", duration: 60, difficulty: "hard" },
        { type: "system_design", duration: 45, difficulty: "medium" },
        { type: "hr", duration: 30, difficulty: "easy" },
      ],
    },
    historical_data: {
      avgPackage: 2500000,
      studentsHired: 10,
      selectionRate: 0.08,
    },
  },
  {
    name: "Accenture",
    description: "Global consulting and services company with diverse technology roles.",
    visit_date: "2026-05-10",
    deadline: "2026-05-05",
    tier: "regular",
    roles: ["Associate Software Engineer", "Analyst"],
    interview_pattern: {
      rounds: [
        { type: "technical", duration: 30, difficulty: "easy" },
        { type: "hr", duration: 20, difficulty: "easy" },
      ],
    },
    historical_data: {
      avgPackage: 650000,
      studentsHired: 90,
      selectionRate: 0.5,
    },
  },
  {
    name: "Deloitte",
    description: "Big 4 consulting firm with technology advisory and implementation services.",
    visit_date: "2026-06-05",
    deadline: "2026-06-01",
    tier: "regular",
    roles: ["Analyst", "Consultant"],
    interview_pattern: {
      rounds: [
        { type: "technical", duration: 45, difficulty: "medium" },
        { type: "behavioral", duration: 30, difficulty: "medium" },
        { type: "hr", duration: 20, difficulty: "easy" },
      ],
    },
    historical_data: {
      avgPackage: 1200000,
      studentsHired: 25,
      selectionRate: 0.15,
    },
  },
];

const companyRequirements: Record<string, Array<{ skill: string; priority: string; min_level: number }>> = {
  TCS: [
    { skill: "Java", priority: "required", min_level: 5 },
    { skill: "SQL", priority: "required", min_level: 5 },
    { skill: "Problem Solving", priority: "required", min_level: 4 },
    { skill: "Communication", priority: "required", min_level: 5 },
  ],
  Infosys: [
    { skill: "Java/Python", priority: "required", min_level: 5 },
    { skill: "DSA", priority: "required", min_level: 5 },
    { skill: "SQL", priority: "required", min_level: 5 },
    { skill: "OOPS", priority: "required", min_level: 5 },
  ],
  Google: [
    { skill: "DSA", priority: "required", min_level: 8 },
    { skill: "System Design", priority: "required", min_level: 7 },
    { skill: "Problem Solving", priority: "required", min_level: 9 },
    { skill: "Python/C++/Java", priority: "required", min_level: 7 },
    { skill: "Communication", priority: "preferred", min_level: 6 },
  ],
  Microsoft: [
    { skill: "DSA", priority: "required", min_level: 7 },
    { skill: "System Design", priority: "required", min_level: 6 },
    { skill: "C++/C#/Java", priority: "required", min_level: 7 },
    { skill: "Problem Solving", priority: "required", min_level: 8 },
  ],
  Amazon: [
    { skill: "DSA", priority: "required", min_level: 8 },
    { skill: "System Design", priority: "required", min_level: 7 },
    { skill: "Leadership Principles", priority: "required", min_level: 6 },
    { skill: "Java/Python", priority: "required", min_level: 7 },
  ],
};

async function seed() {
  console.log("Seeding database...");

  // Insert companies
  for (const company of companies) {
    const { data, error } = await supabase
      .from("companies")
      .upsert(company, { onConflict: "name" })
      .select()
      .single();

    if (error) {
      console.error(`Error inserting ${company.name}:`, error);
      continue;
    }

    console.log(`Inserted company: ${company.name}`);

    // Insert requirements
    const reqs = companyRequirements[company.name];
    if (reqs && data) {
      for (const req of reqs) {
        await supabase.from("company_requirements").insert({
          company_id: data.id,
          ...req,
        });
      }
      console.log(`  Added ${reqs.length} requirements`);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
