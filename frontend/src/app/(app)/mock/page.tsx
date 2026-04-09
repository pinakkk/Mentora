"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import { ScrollArea } from "@/components/primitives/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select";
import {
  AudioLines,
  CirclePlay,
  Timer,
  Landmark,
  Loader2,
  Sparkles,
  BarChart3,
  BrainCircuit,
  Handshake,
  Network,
  History,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { LiveInterview } from "@/components/interview/live-interview";
import { DebriefView } from "@/components/interview/debrief-view";

// ─── CONFIG ─────────────────────────────────────────────

const interviewTypes = [
  {
    value: "technical",
    label: "Technical",
    description: "DSA, coding, problem-solving",
    icon: BrainCircuit,
    gradient: "from-blue-500/10 to-indigo-500/10",
    border: "border-blue-200/60",
    selectedBorder: "border-blue-400 ring-2 ring-blue-100",
    iconColor: "text-blue-600",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    description: "STAR method, teamwork, leadership",
    icon: Handshake,
    gradient: "from-emerald-500/10 to-teal-500/10",
    border: "border-emerald-200/60",
    selectedBorder: "border-emerald-400 ring-2 ring-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    value: "hr",
    label: "HR",
    description: "Goals, salary, culture fit",
    icon: Landmark,
    gradient: "from-amber-500/10 to-orange-500/10",
    border: "border-amber-200/60",
    selectedBorder: "border-amber-400 ring-2 ring-amber-100",
    iconColor: "text-amber-600",
  },
  {
    value: "system_design",
    label: "System Design",
    description: "Architecture, scaling, trade-offs",
    icon: Network,
    gradient: "from-violet-500/10 to-purple-500/10",
    border: "border-violet-200/60",
    selectedBorder: "border-violet-400 ring-2 ring-violet-100",
    iconColor: "text-violet-600",
  },
];

const companies = [
  "TCS", "Infosys", "Wipro", "Google", "Microsoft",
  "Amazon", "Flipkart", "Razorpay", "Generic Tech Company",
];

const difficulties = [
  { value: "easy", label: "Easy", desc: "Fundamentals" },
  { value: "medium", label: "Medium", desc: "Standard level" },
  { value: "hard", label: "Hard", desc: "Dream company" },
];

// ─── TYPES ──────────────────────────────────────────────

interface Question {
  id: number;
  text: string;
  type: string;
  difficulty: string;
  expectedApproach: string;
  scoringRubric: string;
  followUp: string;
  maxScore: number;
}

interface AnsweredQuestion {
  questionText: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  difficulty: string;
}

interface InterviewResults {
  questions: AnsweredQuestion[];
  overallScore: number;
  debrief: {
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

interface HistoryItem {
  id: string;
  type: string;
  score: number;
  feedback: string;
  date: string;
}

type PageState = "setup" | "preparing" | "interview" | "debrief";

// ─── PAGE ───────────────────────────────────────────────

export default function MockInterviewPage() {
  const [pageState, setPageState] = useState<PageState>("setup");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const [interviewData, setInterviewData] = useState<{
    introduction: string;
    questions: Question[];
    studentId: string;
  } | null>(null);
  const [results, setResults] = useState<InterviewResults | null>(null);

  // Fetch history on mount
  useEffect(() => {
    fetch("/api/interview/history")
      .then((r) => r.json())
      .then((d) => { if (d.history) setHistory(d.history); })
      .catch(() => {});
  }, []);

  const getCacheKey = (c: string, t: string, d: string) =>
    `interview_cache_${c}_${t}_${d}`;

  const startInterview = async () => {
    setPageState("preparing");
    setError(null);

    const cacheKey = getCacheKey(company, type, difficulty);
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        setInterviewData({ introduction: data.introduction, questions: data.questions, studentId: data.studentId });
        setPageState("interview");
        return;
      }
    } catch { /* cache miss */ }

    try {
      const res = await fetch("/api/interview/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: company, interviewType: type, difficulty }),
      });
      const data = await res.json();

      if (!res.ok || !data.questions) {
        setError(data.error || "Failed to prepare questions.");
        setPageState("setup");
        return;
      }

      try { sessionStorage.setItem(cacheKey, JSON.stringify(data)); } catch { /* ignore */ }
      setInterviewData({ introduction: data.introduction, questions: data.questions, studentId: data.studentId });
      setPageState("interview");
    } catch {
      setError("Network error. Please try again.");
      setPageState("setup");
    }
  };

  const handleComplete = (r: InterviewResults) => {
    setResults(r);
    setPageState("debrief");
    // Refresh history
    fetch("/api/interview/history").then((r) => r.json()).then((d) => { if (d.history) setHistory(d.history); }).catch(() => {});
  };

  const handleRetry = () => {
    try { sessionStorage.removeItem(getCacheKey(company, type, difficulty)); } catch { /* ignore */ }
    setResults(null);
    setInterviewData(null);
    setPageState("setup");
  };

  const handleExit = () => {
    setResults(null);
    setInterviewData(null);
    setPageState("setup");
  };

  // ─── INTERVIEW / DEBRIEF VIEWS ──────────────────────

  if (pageState === "interview" && interviewData) {
    return (
      <div className="h-full">
        <LiveInterview
          companyName={company} interviewType={type} difficulty={difficulty}
          introduction={interviewData.introduction} questions={interviewData.questions}
          studentId={interviewData.studentId} onComplete={handleComplete} onExit={handleExit}
        />
      </div>
    );
  }

  if (pageState === "debrief" && results) {
    return (
      <div className="h-full">
        <DebriefView
          companyName={company} interviewType={type} overallScore={results.overallScore}
          questions={results.questions} debrief={results.debrief}
          onRetry={handleRetry} onExit={handleExit}
        />
      </div>
    );
  }

  // ─── SETUP VIEW ─────────────────────────────────────

  const scoreColor = (s: number) =>
    s >= 7 ? "text-emerald-600" : s >= 5 ? "text-amber-600" : "text-rose-500";

  const bestScore = history.length > 0 ? Math.max(...history.map((h) => h.score || 0)) : null;

  return (
    <div className="h-full overflow-y-auto" style={{ background: "#f8f6fc" }}>
      <div className="flex flex-col lg:flex-row gap-6 p-5 lg:p-8 max-w-6xl mx-auto">
        {/* Main setup column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
              <AudioLines className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Mock Interview</h1>
              <p className="text-sm text-slate-500">AI-powered voice interview with real-time scoring</p>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-violet-100/60 text-violet-700 border-violet-200/50 font-medium">
              <AudioLines className="h-3 w-3 mr-1" /> Voice Powered
            </Badge>
            <Badge variant="secondary" className="bg-emerald-100/60 text-emerald-700 border-emerald-200/50 font-medium">
              <Sparkles className="h-3 w-3 mr-1" /> AI Scored
            </Badge>
            <Badge variant="secondary" className="bg-amber-100/60 text-amber-700 border-amber-200/50 font-medium">
              <BarChart3 className="h-3 w-3 mr-1" /> Detailed Feedback
            </Badge>
          </div>

          {/* Setup card */}
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-6">
            {/* Company */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Landmark className="h-3.5 w-3.5 text-slate-400" /> Target Company
              </label>
              <Select value={company} onValueChange={(v) => setCompany(v ?? "")}>
                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type cards */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-600">Interview Type</label>
              <div className="grid grid-cols-2 gap-3">
                {interviewTypes.map((t) => {
                  const Icon = t.icon;
                  const selected = type === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`p-4 rounded-2xl border text-left transition-all bg-gradient-to-br ${t.gradient} ${
                        selected ? t.selectedBorder : `${t.border} hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`h-7 w-7 rounded-lg bg-white/80 flex items-center justify-center ${t.iconColor}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-semibold text-sm text-slate-700">{t.label}</span>
                      </div>
                      <p className="text-xs text-slate-500">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-600">Difficulty</label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      difficulty === d.value
                        ? "border-violet-400 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <p className="font-semibold text-sm">{d.label}</p>
                    <p className={`text-[10px] mt-0.5 ${difficulty === d.value ? "text-violet-100" : "text-slate-400"}`}>
                      {d.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            {/* Start */}
            <Button
              className="w-full rounded-xl py-6 text-base font-semibold shadow-lg shadow-violet-200/60"
              style={{ background: "linear-gradient(135deg, #7c5bf0, #a78bfa)" }}
              disabled={!company || !type || pageState === "preparing"}
              onClick={startInterview}
            >
              {pageState === "preparing" ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Preparing Questions...</>
              ) : (
                <><CirclePlay className="h-5 w-5 mr-2" /> Start Voice Interview</>
              )}
            </Button>

            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
              <Timer className="h-3 w-3" /> ~10-15 min &middot; 6 questions &middot; Mic required
            </p>
          </div>

          {/* How it works */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-600">How it works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: "1", title: "AI asks questions", desc: "Personalized to your profile and target company" },
                { step: "2", title: "You answer by voice", desc: "Speak naturally — answer is transcribed & scored" },
                { step: "3", title: "Get instant feedback", desc: "Per-question scores, strengths & improvements" },
              ].map((item) => (
                <div key={item.step} className="bg-white/80 rounded-2xl p-4 border border-slate-100">
                  <div className="h-6 w-6 rounded-lg bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center mb-2">
                    {item.step}
                  </div>
                  <p className="text-sm font-medium text-slate-700">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* History sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Past Interviews</h3>
              </div>
              {bestScore !== null && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  <span className="text-xs font-semibold text-amber-600">{bestScore.toFixed(1)}</span>
                </div>
              )}
            </div>

            {history.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm text-slate-400">No interviews yet</p>
                <p className="text-xs text-slate-300 mt-1">Your results will appear here</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[420px]">
                <div className="p-3 space-y-2">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="outline" className="text-[10px] capitalize border-slate-200 text-slate-500 font-medium">
                          {h.type.replace("_", " ")}
                        </Badge>
                        <span className={`text-sm font-bold tabular-nums ${scoreColor(h.score)}`}>
                          {(h.score || 0).toFixed(1)}
                        </span>
                      </div>
                      {h.feedback && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {h.feedback}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-300 mt-1.5">
                        {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
