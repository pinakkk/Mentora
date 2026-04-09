"use client";

import { useState } from "react";
import { Button } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select";
import {
  Mic,
  Play,
  Clock,
  Building2,
  Loader2,
  Zap,
  Target,
  MessageSquare,
  Cpu,
  Users,
  Briefcase,
} from "lucide-react";
import { LiveInterview } from "@/components/interview/live-interview";
import { DebriefView } from "@/components/interview/debrief-view";

// ─── CONFIG ─────────────────────────────────────────────

const interviewTypes = [
  {
    value: "technical",
    label: "Technical",
    description: "DSA, coding, problem-solving",
    icon: Cpu,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    selectedColor: "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
  },
  {
    value: "behavioral",
    label: "Behavioral",
    description: "STAR method, teamwork, leadership",
    icon: Users,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    selectedColor: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200",
  },
  {
    value: "hr",
    label: "HR",
    description: "Goals, salary, culture fit",
    icon: Briefcase,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    selectedColor: "border-amber-500 bg-amber-50 ring-2 ring-amber-200",
  },
  {
    value: "system_design",
    label: "System Design",
    description: "Architecture, scaling, trade-offs",
    icon: Target,
    color: "text-violet-600 bg-violet-50 border-violet-200",
    selectedColor: "border-violet-500 bg-violet-50 ring-2 ring-violet-200",
  },
];

const companies = [
  { value: "TCS", label: "TCS" },
  { value: "Infosys", label: "Infosys" },
  { value: "Wipro", label: "Wipro" },
  { value: "Google", label: "Google" },
  { value: "Microsoft", label: "Microsoft" },
  { value: "Amazon", label: "Amazon" },
  { value: "Flipkart", label: "Flipkart" },
  { value: "Razorpay", label: "Razorpay" },
  { value: "Generic", label: "Generic Tech Company" },
];

const difficulties = [
  { value: "easy", label: "Easy", desc: "Fundamentals & basics" },
  { value: "medium", label: "Medium", desc: "Standard interview level" },
  { value: "hard", label: "Hard", desc: "Senior / dream company" },
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

type PageState = "setup" | "preparing" | "interview" | "debrief";

// ─── PAGE ───────────────────────────────────────────────

export default function MockInterviewPage() {
  const [pageState, setPageState] = useState<PageState>("setup");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [error, setError] = useState<string | null>(null);

  // Interview data
  const [interviewData, setInterviewData] = useState<{
    introduction: string;
    questions: Question[];
    studentId: string;
  } | null>(null);
  const [results, setResults] = useState<InterviewResults | null>(null);

  const startInterview = async () => {
    setPageState("preparing");
    setError(null);

    try {
      const res = await fetch("/api/interview/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company,
          interviewType: type,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.questions) {
        setError(data.error || "Failed to prepare interview questions.");
        setPageState("setup");
        return;
      }

      setInterviewData({
        introduction: data.introduction,
        questions: data.questions,
        studentId: data.studentId,
      });
      setPageState("interview");
    } catch {
      setError("Network error. Please try again.");
      setPageState("setup");
    }
  };

  const handleComplete = (r: InterviewResults) => {
    setResults(r);
    setPageState("debrief");
  };

  const handleRetry = () => {
    setResults(null);
    setInterviewData(null);
    setPageState("setup");
  };

  const handleExit = () => {
    setResults(null);
    setInterviewData(null);
    setPageState("setup");
  };

  // ─── INTERVIEW VIEW ─────────────────────────────────

  if (pageState === "interview" && interviewData) {
    return (
      <div className="h-full">
        <LiveInterview
          companyName={company}
          interviewType={type}
          difficulty={difficulty}
          introduction={interviewData.introduction}
          questions={interviewData.questions}
          studentId={interviewData.studentId}
          onComplete={handleComplete}
          onExit={handleExit}
        />
      </div>
    );
  }

  // ─── DEBRIEF VIEW ───────────────────────────────────

  if (pageState === "debrief" && results) {
    return (
      <div className="h-full">
        <DebriefView
          companyName={company}
          interviewType={type}
          overallScore={results.overallScore}
          questions={results.questions}
          debrief={results.debrief}
          onRetry={handleRetry}
          onExit={handleExit}
        />
      </div>
    );
  }

  // ─── SETUP VIEW ─────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Mic className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mock Interview</h1>
              <p className="text-sm text-gray-500">
                Voice-powered AI interview with instant feedback
              </p>
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="secondary"
            className="bg-violet-50 text-violet-700 border-violet-200"
          >
            <Mic className="h-3 w-3 mr-1" />
            Voice Interview
          </Badge>
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            <Zap className="h-3 w-3 mr-1" />
            AI-Scored
          </Badge>
          <Badge
            variant="secondary"
            className="bg-amber-50 text-amber-700 border-amber-200"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Detailed Feedback
          </Badge>
        </div>

        {/* Setup card */}
        <Card className="border-gray-200 shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Company */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" />
                Target Company
              </label>
              <Select value={company} onValueChange={(v) => setCompany(v ?? "")}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Interview Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {interviewTypes.map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        isSelected ? t.selectedColor : `${t.color} hover:shadow-sm`
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="font-semibold text-sm">{t.label}</span>
                      </div>
                      <p className="text-xs opacity-70">{t.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-3">
                {difficulties.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      difficulty === d.value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-semibold text-sm">{d.label}</p>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        difficulty === d.value ? "text-gray-300" : "text-gray-400"
                      }`}
                    >
                      {d.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Start button */}
            <Button
              className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 py-6 text-base font-semibold shadow-lg shadow-violet-200"
              disabled={!company || !type || pageState === "preparing"}
              onClick={startInterview}
            >
              {pageState === "preparing" ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Preparing Questions...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Voice Interview
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" />
              ~10-15 minutes &middot; 6 questions &middot; Mic required
            </p>
          </CardContent>
        </Card>

        {/* How it works */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">How it works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                step: "1",
                title: "AI asks questions",
                desc: "Personalized to your profile and target company",
              },
              {
                step: "2",
                title: "You answer by voice",
                desc: "Speak naturally — your answer is transcribed and scored",
              },
              {
                step: "3",
                title: "Get instant feedback",
                desc: "Per-question scores, strengths, and improvement areas",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
              >
                <div className="h-6 w-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center mb-2">
                  {item.step}
                </div>
                <p className="text-sm font-medium text-gray-800">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
