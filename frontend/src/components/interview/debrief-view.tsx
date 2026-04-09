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
  AlertCircle,
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
  debrief: {
    summary: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  onRetry: () => void;
  onExit: () => void;
}

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color =
    score >= 7 ? "text-emerald-500" : score >= 5 ? "text-amber-500" : "text-red-500";
  const bgColor =
    score >= 7 ? "stroke-emerald-100" : score >= 5 ? "stroke-amber-100" : "stroke-red-100";
  const strokeColor =
    score >= 7 ? "stroke-emerald-500" : score >= 5 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={6}
          className={bgColor}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className={`${strokeColor} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${color}`}>{score.toFixed(1)}</span>
        <span className="text-xs text-gray-400">/10</span>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${(score / 10) * 100}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700 w-8 text-right">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

export function DebriefView({
  companyName,
  interviewType,
  overallScore,
  questions,
  debrief,
  onRetry,
  onExit,
}: DebriefViewProps) {
  return (
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto p-6 space-y-8 pb-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="font-semibold">
              {companyName}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {interviewType.replace("_", " ")}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Complete</h1>

          {/* Score ring */}
          <div className="flex justify-center py-4">
            <ScoreRing score={overallScore} />
          </div>

          <p className="text-gray-600 text-sm max-w-md mx-auto">
            {debrief.summary}
          </p>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debrief.strengths?.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-emerald-800 text-sm">
                  Strengths
                </h3>
              </div>
              <ul className="space-y-2">
                {debrief.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {debrief.improvements?.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-amber-600" />
                <h3 className="font-semibold text-amber-800 text-sm">
                  Areas to Improve
                </h3>
              </div>
              <ul className="space-y-2">
                {debrief.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {debrief.recommendations?.length > 0 && (
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-violet-600" />
              <h3 className="font-semibold text-violet-800 text-sm">
                Recommendations
              </h3>
            </div>
            <ul className="space-y-2">
              {debrief.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-violet-700">
                  <Target className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Per-question breakdown */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Question Breakdown
          </h3>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">
                      Question {i + 1}
                      <Badge
                        variant="outline"
                        className="ml-2 text-[10px] capitalize"
                      >
                        {q.difficulty}
                      </Badge>
                    </p>
                    <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                  </div>
                </div>

                <ScoreBar score={q.score} />

                {q.answer !== "(Skipped)" && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-400 mb-1">
                      Your Answer
                    </p>
                    <p className="text-sm text-gray-700">{q.answer}</p>
                  </div>
                )}

                <p className="text-sm text-gray-600">{q.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            onClick={onExit}
            className="rounded-full px-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onRetry}
            className="rounded-full px-6 bg-violet-500 hover:bg-violet-600"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
