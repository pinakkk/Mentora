"use client";

import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import { ScrollArea } from "@/components/primitives/scroll-area";
import {
  ArrowLeft,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface AnsweredQuestion {
  questionText: string;
  answer: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  difficulty: string;
}

interface DebriefViewProps {
  companyName: string;
  interviewType: string;
  overallScore: number;
  questions: AnsweredQuestion[];
  debrief: { summary: string; strengths: string[]; improvements: string[]; recommendations: string[] };
  onRetry: () => void;
  onExit: () => void;
}

function ScoreRing({ score, size = 130 }: { score: number; size?: number }) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const p = (score / 10) * c;
  const col = score >= 7 ? "#10b981" : score >= 5 ? "#f59e0b" : "#f43f5e";
  const bg = score >= 7 ? "#d1fae5" : score >= 5 ? "#fef3c7" : "#ffe4e6";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7} stroke={bg} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={7} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - p} stroke={col} className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: col }}>{score.toFixed(1)}</span>
        <span className="text-xs text-slate-400">/10</span>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const col = score >= 7 ? "bg-emerald-400" : score >= 5 ? "bg-amber-400" : "bg-rose-400";
  const textCol = score >= 7 ? "text-emerald-600" : score >= 5 ? "text-amber-600" : "text-rose-500";

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${col} rounded-full transition-all duration-700`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums w-8 text-right ${textCol}`}>{score.toFixed(1)}</span>
    </div>
  );
}

export function DebriefView({ companyName, interviewType, overallScore, questions, debrief, onRetry, onExit }: DebriefViewProps) {
  return (
    <ScrollArea className="h-full" style={{ background: "#f8f6fc" }}>
      <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-8 pb-20">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="font-semibold bg-violet-100/60 text-violet-700 border-violet-200/50">{companyName}</Badge>
            <Badge variant="outline" className="capitalize border-slate-200 text-slate-500">{interviewType.replace("_", " ")}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Interview Complete</h1>

          <div className="flex justify-center py-4">
            <ScoreRing score={overallScore} />
          </div>

          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">{debrief.summary}</p>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debrief.strengths?.length > 0 && (
            <div className="bg-white rounded-2xl border border-emerald-100/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-emerald-700 text-sm">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {debrief.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {debrief.improvements?.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-100/60 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-amber-700 text-sm">Areas to Improve</h3>
              </div>
              <ul className="space-y-2">
                {debrief.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {debrief.recommendations?.length > 0 && (
          <div className="bg-white rounded-2xl border border-violet-100/60 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <Lightbulb className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <h3 className="font-semibold text-violet-700 text-sm">Recommendations</h3>
            </div>
            <ul className="space-y-2">
              {debrief.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-violet-600">
                  <Target className="h-3.5 w-3.5 mt-0.5 shrink-0" />{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Question breakdown */}
        <div>
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-violet-500" /> Question Breakdown
          </h3>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={i} className="bg-white border border-slate-200/60 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-400 mb-1">
                      Question {i + 1}
                      <Badge variant="outline" className="ml-2 text-[10px] capitalize border-slate-200 text-slate-400">{q.difficulty}</Badge>
                    </p>
                    <p className="text-sm font-medium text-slate-700">{q.questionText}</p>
                  </div>
                </div>
                <ScoreBar score={q.score} />
                {q.answer !== "(Skipped)" && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Your Answer</p>
                    <p className="text-sm text-slate-600">{q.answer}</p>
                  </div>
                )}
                <p className="text-sm text-slate-500">{q.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" onClick={onExit} className="rounded-xl px-6 border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button onClick={onRetry} className="rounded-xl px-6 shadow-lg shadow-violet-200/60" style={{ background: "linear-gradient(135deg, #7c5bf0, #a78bfa)" }}>
            <RotateCcw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
