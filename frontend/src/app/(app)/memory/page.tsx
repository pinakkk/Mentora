"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Brain,
  Target,
  Zap,
  AlertTriangle,
  Star,
  Heart,
  User,
  GraduationCap,
  FileText,
  TrendingUp,
  Calendar,
  MessageSquare,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Skeleton } from "@/components/primitives/skeleton";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/primitives/progress";

interface MemoryFact {
  id: string;
  fact: string;
  category: string;
  importance: string;
  created_at: string;
  updated_at: string;
}

interface Skill {
  name: string;
  level: number;
  confidence: number;
  source: string;
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  department?: string;
  cgpa?: number;
  year?: number;
  skills: Skill[];
  readiness: number;
  resumeUrl?: string;
  onboarded: boolean;
  memberSince: string;
}

const categoryConfig: Record<
  string,
  { icon: typeof Brain; color: string; bgColor: string; label: string }
> = {
  goal: {
    icon: Target,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "Goals",
  },
  skill: {
    icon: Zap,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    label: "Skills",
  },
  struggle: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "Struggles",
  },
  milestone: {
    icon: Star,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    label: "Milestones",
  },
  preference: {
    icon: Heart,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    label: "Preferences",
  },
  behavioral: {
    icon: User,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Behavioral",
  },
};

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

const categories = [
  "all",
  "goal",
  "skill",
  "struggle",
  "milestone",
  "preference",
  "behavioral",
];

function getScoreColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
}

function getBarColor(level: number) {
  if (level >= 7) return "#10b981";
  if (level >= 4) return "#3b82f6";
  return "#f59e0b";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function MemoryPage() {
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState({ totalConversations: 0, totalMessages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/students/me/memory");
        if (res.ok) {
          const data = await res.json();
          setFacts(data.facts || []);
          setStudent(data.student || null);
          setStats(data.stats || { totalConversations: 0, totalMessages: 0 });
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered =
    filter === "all" ? facts : facts.filter((f) => f.category === filter);

  // Build chart data
  const categoryDistribution = categories
    .filter((c) => c !== "all")
    .map((cat) => ({
      name: categoryConfig[cat]?.label || cat,
      value: facts.filter((f) => f.category === cat).length,
      category: cat,
    }))
    .filter((d) => d.value > 0);

  const skillsData = (student?.skills || [])
    .sort((a, b) => b.level - a.level)
    .slice(0, 8)
    .map((s) => ({
      name: s.name.length > 14 ? s.name.slice(0, 12) + "..." : s.name,
      fullName: s.name,
      level: s.level,
      confidence: Math.round(s.confidence * 100),
    }));

  const radarData = (student?.skills || []).slice(0, 8).map((s) => ({
    subject: s.name.length > 10 ? s.name.slice(0, 8) + "..." : s.name,
    score: s.level * 10,
    fullMark: 100,
  }));

  const importanceCounts = {
    high: facts.filter((f) => f.importance === "high").length,
    medium: facts.filter((f) => f.importance === "medium").length,
    low: facts.filter((f) => f.importance === "low").length,
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
            <Brain className="h-5 w-5 text-violet-600" />
          </div>
          Coach&apos;s Notebook
        </h1>
        <p className="text-muted-foreground text-sm mt-1.5 ml-[46px]">
          Everything your AI coach has learned about you — transparent memory,
          no black boxes.
        </p>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {student?.readiness || 0}
                  <span className="text-sm text-muted-foreground font-normal">
                    %
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">Readiness</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Brain className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{facts.length}</p>
                <p className="text-[11px] text-muted-foreground">
                  Memories
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(student?.skills || []).length}
                </p>
                <p className="text-[11px] text-muted-foreground">Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-[11px] text-muted-foreground">
                  Messages
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {((student?.skills || []).length > 0 || facts.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Skills Radar Chart */}
          {radarData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  Skill Radar
                </CardTitle>
                <CardDescription className="text-xs">
                  Your competency profile across key areas
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#7c3aed"
                        fill="#7c3aed"
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Memory Distribution Pie */}
          {categoryDistribution.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-emerald-500" />
                  Memory Distribution
                </CardTitle>
                <CardDescription className="text-xs">
                  What your coach remembers about you, by category
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="h-[220px] flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryDistribution.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            fontSize: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 pr-2">
                    {categoryDistribution.map((d, i) => (
                      <div key={d.category} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor:
                              PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {d.name}
                        </span>
                        <span className="text-xs font-semibold ml-auto">
                          {d.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Skills Bar Chart as fallback if no memory distribution yet
            skillsData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Skills Breakdown
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Proficiency levels from resume analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={skillsData}
                        layout="vertical"
                        margin={{ left: 0, right: 16, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          type="number"
                          domain={[0, 10]}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={90}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            fontSize: "12px",
                            border: "1px solid #e5e7eb",
                          }}
                        />
                        <Bar dataKey="level" radius={[0, 4, 4, 0]}>
                          {skillsData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={getBarColor(entry.level)}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}

      {/* Skills Bar when we also have memory distribution */}
      {categoryDistribution.length > 0 && skillsData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Skills Proficiency
            </CardTitle>
            <CardDescription className="text-xs">
              {skillsData.length} skills detected — proficiency out of 10
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-2.5 sm:grid-cols-2">
              {(student?.skills || [])
                .sort((a, b) => b.level - a.level)
                .map((skill) => (
                  <div key={skill.name} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium truncate">
                          {skill.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-2 tabular-nums">
                          {skill.level}/10
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.level * 10}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: getBarColor(skill.level) }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Profile Card */}
      {student && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-violet-500" />
              Student Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Name
                </p>
                <p className="text-sm font-medium mt-0.5">{student.name}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Department
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {student.department || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  CGPA
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {student.cgpa || "Not set"}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Member Since
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {new Date(student.memberSince).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Readiness Score
                </p>
                <p
                  className={`text-sm font-bold mt-0.5 ${getScoreColor(
                    student.readiness
                  )}`}
                >
                  {student.readiness}%
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Resume
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {student.resumeUrl ? (
                    <a
                      href={student.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-3 w-3" />
                      View resume
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not uploaded</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Onboarded
                </p>
                <p className="text-sm font-medium mt-0.5">
                  {student.onboarded ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 text-[10px]"
                    >
                      Yes
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-amber-50 text-amber-700 text-[10px]"
                    >
                      Pending
                    </Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Priority Memories
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className="bg-red-50 text-red-600 text-[10px]"
                  >
                    {importanceCounts.high} high
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="bg-amber-50 text-amber-600 text-[10px]"
                  >
                    {importanceCounts.medium} med
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Memory Facts Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Memory Timeline</h2>
          <span className="text-xs text-muted-foreground">
            {filtered.length} {filter === "all" ? "total" : filter}{" "}
            {filtered.length === 1 ? "memory" : "memories"}
          </span>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1.5 flex-wrap mb-4">
          {categories.map((cat) => {
            const count =
              cat === "all"
                ? facts.length
                : facts.filter((f) => f.category === cat).length;
            const cfg = categoryConfig[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filter === cat
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                }`}
              >
                {cat === "all"
                  ? "All"
                  : cfg?.label || cat.charAt(0).toUpperCase() + cat.slice(1)}
                <span
                  className={`ml-1 ${
                    filter === cat ? "opacity-70" : "opacity-50"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Facts List */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <Brain className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-medium text-muted-foreground">
                No memories yet
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Start chatting with your AI coach or upload your resume. Your
                coach will automatically learn and remember key things about you.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((fact, i) => {
                const cfg = categoryConfig[fact.category] || {
                  icon: Brain,
                  color: "text-gray-600",
                  bgColor: "bg-gray-100",
                  label: fact.category,
                };
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={fact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3.5 flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bgColor}`}
                        >
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-relaxed">
                            {fact.fact}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${cfg.bgColor} ${cfg.color} border-0`}
                            >
                              {cfg.label}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] ${
                                fact.importance === "high"
                                  ? "bg-red-50 text-red-600"
                                  : fact.importance === "medium"
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-gray-50 text-gray-500"
                              } border-0`}
                            >
                              {fact.importance}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {formatDate(fact.created_at)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
