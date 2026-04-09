export interface Company {
  id: string;
  name: string;
  description?: string;
  visitDate?: string;
  deadline?: string;
  tier: "dream" | "regular" | "mass";
  roles?: string[];
  jdText?: string;
  interviewPattern?: InterviewPattern;
  historicalData?: HistoricalData;
  createdAt: string;
  updatedAt: string;
  requirements?: CompanyRequirement[];
}

export interface CompanyRequirement {
  id: string;
  companyId: string;
  skill: string;
  priority: string;
  minLevel: number;
}

export interface InterviewPattern {
  rounds: InterviewRound[];
  typicalDuration?: string;
  notes?: string;
}

export interface InterviewRound {
  type: "technical" | "behavioral" | "hr" | "system_design" | "coding";
  duration?: number;
  description?: string;
  difficulty?: "easy" | "medium" | "hard";
}

export interface HistoricalData {
  avgPackage?: number;
  studentsHired?: number;
  selectionRate?: number;
  commonSkills?: string[];
}

export interface MatchScore {
  overall: number;
  breakdown: {
    skillMatch: number;
    cgpa: number;
    projects: number;
    historical: number;
    competition: number;
  };
  actionableLevers: ActionableLever[];
}

export interface ActionableLever {
  action: string;
  impact: number; // percentage increase
  effort: "low" | "medium" | "high";
  timeEstimate?: string;
}
