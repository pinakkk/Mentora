"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Calendar,
  Users,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
  Zap,
  ArrowUpRight,
  Sparkles,
  Filter,
} from "lucide-react";
import { Card, CardContent } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Skeleton } from "@/components/primitives/skeleton";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/primitives/progress";

interface MatchScore {
  overall: number;
  breakdown: {
    skillMatch: number;
    cgpaScore: number;
    gapCount: number;
    metCount: number;
    totalRequired: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  actionableLevers: Array<{
    action: string;
    impact: number;
    effort: string;
  }>;
}

interface Company {
  id: string;
  name: string;
  description?: string;
  visit_date?: string;
  deadline?: string;
  tier: "dream" | "regular" | "mass";
  roles?: string[];
  interview_pattern?: {
    rounds: Array<{
      type: string;
      duration?: number;
      difficulty?: string;
    }>;
  };
  historical_data?: {
    avgPackage?: number;
    studentsHired?: number;
    selectionRate?: number;
  };
  requirements?: Array<{
    id: string;
    companyId: string;
    skill: string;
    priority: string;
    minLevel: number;
  }>;
  matchScore?: MatchScore | null;
}

const tierConfig: Record<
  string,
  { label: string; color: string; bg: string; ring: string }
> = {
  dream: {
    label: "Dream",
    color: "text-violet-700",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
  },
  regular: {
    label: "Regular",
    color: "text-blue-700",
    bg: "bg-blue-50",
    ring: "ring-blue-200",
  },
  mass: {
    label: "Mass",
    color: "text-gray-600",
    bg: "bg-gray-50",
    ring: "ring-gray-200",
  },
};

function getMatchColor(score: number) {
  if (score >= 70) return { text: "text-emerald-600", bg: "bg-emerald-500", light: "bg-emerald-50" };
  if (score >= 45) return { text: "text-amber-600", bg: "bg-amber-500", light: "bg-amber-50" };
  return { text: "text-red-500", bg: "bg-red-500", light: "bg-red-50" };
}

function getMatchLabel(score: number) {
  if (score >= 70) return "Strong Fit";
  if (score >= 45) return "Moderate Fit";
  return "Needs Work";
}

function formatPackage(amount?: number) {
  if (!amount) return "---";
  if (amount >= 1000000) return `${(amount / 100000).toFixed(1)}L`;
  return `${(amount / 1000).toFixed(0)}K`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CompanyCard({
  company,
  index,
}: {
  company: Company;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const tier = tierConfig[company.tier] || tierConfig.regular;
  const match = company.matchScore;
  const matchColor = match ? getMatchColor(match.overall) : null;
  const historical = company.historical_data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
    >
      <Card className="group hover:shadow-lg transition-all duration-300 border-gray-100 overflow-hidden">
        <CardContent className="p-0">
          {/* Match score bar at top */}
          {match && (
            <div className={`h-1 ${matchColor!.bg}`} style={{ width: `${match.overall}%` }} />
          )}

          <div className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {company.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                      className={`text-[10px] px-1.5 py-0 ring-1 ${tier.bg} ${tier.color} ${tier.ring}`}
                    >
                      {tier.label}
                    </Badge>
                    {company.roles && company.roles.length > 0 && (
                      <span className="text-[11px] text-gray-400">
                        {(company.roles as string[]).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match score circle */}
              {match && (
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`h-12 w-12 rounded-full ${matchColor!.light} flex items-center justify-center ring-1 ${matchColor!.text === "text-emerald-600" ? "ring-emerald-200" : matchColor!.text === "text-amber-600" ? "ring-amber-200" : "ring-red-200"}`}
                  >
                    <span className={`text-base font-bold ${matchColor!.text}`}>
                      {match.overall}
                    </span>
                  </div>
                  <span className={`text-[9px] font-medium mt-1 ${matchColor!.text}`}>
                    {getMatchLabel(match.overall)}
                  </span>
                </div>
              )}
            </div>

            {company.description && (
              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {company.description}
              </p>
            )}

            {/* Quick stats row */}
            <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
              {company.visit_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(company.visit_date)}</span>
                </div>
              )}
              {historical?.avgPackage && (
                <div className="flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" />
                  <span>{formatPackage(historical.avgPackage)} CTC</span>
                </div>
              )}
              {historical?.selectionRate != null && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>{Math.round(historical.selectionRate * 100)}% selection</span>
                </div>
              )}
              {historical?.studentsHired && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{historical.studentsHired} hired</span>
                </div>
              )}
            </div>

            {/* Skill match progress */}
            {match && match.breakdown.totalRequired > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-gray-500 font-medium">
                    Skill Alignment
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {match.breakdown.metCount}/{match.breakdown.totalRequired} skills
                    matched
                  </span>
                </div>
                <Progress value={match.breakdown.skillMatch}>
                  <ProgressTrack className="h-1.5 bg-gray-100 rounded-full">
                    <ProgressIndicator
                      className={`rounded-full ${matchColor!.bg}`}
                    />
                  </ProgressTrack>
                </Progress>
              </div>
            )}

            {/* Required skills tags */}
            {company.requirements && company.requirements.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {company.requirements.map((req, j) => {
                  const isMatched = match?.matchedSkills.includes(req.skill);
                  const isMissing = match?.missingSkills.includes(req.skill);
                  return (
                    <Badge
                      key={j}
                      variant="secondary"
                      className={`text-[10px] gap-1 ${
                        isMatched
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : isMissing
                          ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                          : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {isMatched && <CheckCircle2 className="h-2.5 w-2.5" />}
                      {isMissing && <AlertTriangle className="h-2.5 w-2.5" />}
                      {req.skill}
                      <span className="opacity-50">({req.minLevel}+)</span>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Expand/collapse for details */}
            {match && match.actionableLevers.length > 0 && (
              <>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1.5 text-[11px] text-violet-600 hover:text-violet-700 font-medium transition-colors"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" /> Hide improvement tips
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" /> How to improve your
                      match
                    </>
                  )}
                </button>

                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2 pt-1"
                  >
                    {match.actionableLevers.map((lever, k) => (
                      <div
                        key={k}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50/80 text-xs"
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 font-medium">{lever.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className={`text-[9px] ${
                                lever.effort === "low"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : lever.effort === "medium"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {lever.effort} effort
                            </Badge>
                            <span className="text-gray-400">
                              +{lever.impact}% potential boost
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </>
            )}

            {/* Interview rounds */}
            {company.interview_pattern?.rounds &&
              company.interview_pattern.rounds.length > 0 && expanded && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[11px] font-medium text-gray-500 mb-2">
                    Interview Process
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {company.interview_pattern.rounds.map(
                      (round: { type: string; difficulty?: string }, r: number) => (
                        <div key={r} className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize ${
                              round.difficulty === "hard"
                                ? "border-red-200 text-red-600"
                                : round.difficulty === "medium"
                                ? "border-amber-200 text-amber-600"
                                : "border-gray-200 text-gray-500"
                            }`}
                          >
                            {round.type.replace("_", " ")}
                          </Badge>
                          {r < company.interview_pattern!.rounds.length - 1 && (
                            <ArrowUpRight className="h-3 w-3 text-gray-300" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"match" | "date" | "package">("match");
  const [filterTier, setFilterTier] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/companies");
      if (res.ok) {
        const data = await res.json();
        setCompanies(data.companies || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  const hasMatchScores = companies.some((c) => c.matchScore);

  const filtered = companies.filter(
    (c) => filterTier === "all" || c.tier === filterTier
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "match" && hasMatchScores) {
      return (b.matchScore?.overall || 0) - (a.matchScore?.overall || 0);
    }
    if (sortBy === "package") {
      return (
        (b.historical_data?.avgPackage || 0) -
        (a.historical_data?.avgPackage || 0)
      );
    }
    // date
    return (
      new Date(a.visit_date || "9999").getTime() -
      new Date(b.visit_date || "9999").getTime()
    );
  });

  if (loading) {
    return (
      <div className="p-5 lg:p-8 space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
            Companies
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {companies.length} companies visiting campus
            {hasMatchScores && " — match scores personalized to your skills"}
          </p>
        </div>

        {/* Sort & Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
            {(["all", "dream", "regular", "mass"] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  filterTier === tier
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tier === "all" ? "All" : tierConfig[tier].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-0.5">
            {(
              [
                { key: "match", label: "Best Match" },
                { key: "date", label: "Visit Date" },
                { key: "package", label: "Package" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortBy(opt.key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  sortBy === opt.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      {hasMatchScores && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "Strong Fit",
              count: companies.filter(
                (c) => c.matchScore && c.matchScore.overall >= 70
              ).length,
              icon: Sparkles,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Moderate Fit",
              count: companies.filter(
                (c) =>
                  c.matchScore &&
                  c.matchScore.overall >= 45 &&
                  c.matchScore.overall < 70
              ).length,
              icon: Target,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Needs Work",
              count: companies.filter(
                (c) => c.matchScore && c.matchScore.overall < 45
              ).length,
              icon: TrendingUp,
              color: "text-red-500",
              bg: "bg-red-50",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-3"
            >
              <div
                className={`h-9 w-9 rounded-lg ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold">{stat.count}</p>
                <p className="text-[11px] text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Company Grid */}
      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="font-medium">No companies found</p>
            <p className="text-xs mt-1">
              {filterTier !== "all"
                ? "Try changing the filter"
                : "Companies will appear once your TPC adds them"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map((company, i) => (
            <CompanyCard key={company.id} company={company} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
