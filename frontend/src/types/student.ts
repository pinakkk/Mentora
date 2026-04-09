export interface Student {
  id: string;
  authId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  department?: string;
  cgpa?: number;
  year?: number;
  resumeUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  preferences?: StudentPreferences;
  skills?: Skill[];
  readiness?: number;
  role: "student" | "tpc_admin";
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentPreferences {
  targetCompanies?: string[];
  preferredRoles?: string[];
  prepDuration?: number;
  studyHoursPerDay?: number;
}

export interface Skill {
  name: string;
  level: number;       // 0-10
  confidence: number;  // 0-1, how confident the AI is in this assessment
  source: "resume" | "github" | "assessment" | "self_reported";
  lastUpdated?: string;
}

export interface ReadinessScore {
  overall: number;
  technical: number;
  behavioral: number;
  communication: number;
  projectDepth: number;
  companySpecific?: Record<string, number>;
}
