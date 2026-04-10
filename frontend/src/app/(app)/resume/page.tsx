"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Target,
  TrendingUp,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/primitives/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import {
  Progress,
  ProgressTrack,
  ProgressIndicator,
} from "@/components/primitives/progress";
import { Skeleton } from "@/components/primitives/skeleton";

interface AnalysisResult {
  skills: Array<{
    name: string;
    level: number;
    confidence: number;
    source: string;
  }>;
  strengths: string[];
  gaps: string[];
  readinessScore: number;
  recommendations: string[];
}

interface ResumeFile {
  name: string;
  fullName: string;
  url: string;
  createdAt: string;
  size: number;
}

function formatFileSize(bytes: number) {
  if (!bytes) return "---";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-500";
}

function getScoreLabel(score: number) {
  if (score >= 70) return "Strong";
  if (score >= 40) return "Moderate";
  return "Needs Work";
}

function getSkillBarColor(level: number) {
  if (level >= 7) return "bg-emerald-500";
  if (level >= 4) return "bg-blue-500";
  return "bg-amber-500";
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [previousResumes, setPreviousResumes] = useState<ResumeFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllResumes, setShowAllResumes] = useState(false);

  // Load existing data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/resume/list");
        if (res.ok) {
          const data = await res.json();
          setPreviousResumes(data.resumes || []);
          if (data.analysis?.skills && data.analysis.skills.length > 0) {
            setAnalysis({
              skills: data.analysis.skills,
              readinessScore: data.analysis.readinessScore || 0,
              strengths: data.analysis.strengths || [],
              gaps: data.analysis.gaps || [],
              recommendations: data.analysis.recommendations || [],
            });
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please upload a PDF file");
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError("");
    }
  };

  async function handleUploadAndAnalyze() {
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }
      const { url } = await uploadRes.json();

      setUploading(false);
      setAnalyzing(true);

      const analyzeRes = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl: url }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({}));
        throw new Error(errData.error || "Analysis failed");
      }
      const result = await analyzeRes.json();
      setAnalysis(result);

      // Refresh the resume list
      const listRes = await fetch("/api/resume/list");
      if (listRes.ok) {
        const data = await listRes.json();
        setPreviousResumes(data.resumes || []);
      }

      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }

  const displayedResumes = showAllResumes
    ? previousResumes
    : previousResumes.slice(0, 3);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-32 md:col-span-2" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resume Analysis</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload your resume to get AI-powered skill assessment and placement
          readiness insights
        </p>
      </div>

      {/* Top Section: Upload + Quick Score */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* Upload Zone */}
        <Card className="md:col-span-3">
          <CardContent className="p-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragOver
                  ? "border-violet-400 bg-violet-50/50 scale-[1.01]"
                  : file
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
              }`}
            >
              {file ? (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                    }}
                    className="text-xs text-muted-foreground"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Drop your resume PDF here
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF format, up to 10 MB
                    </p>
                  </div>
                  <label>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <span className="inline-flex h-8 items-center justify-center rounded-lg border bg-background px-3 text-xs font-medium cursor-pointer hover:bg-accent transition-colors">
                      Browse Files
                    </span>
                  </label>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-3 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {file && (
              <Button
                className="w-full mt-4 h-10 rounded-lg bg-gray-900 hover:bg-gray-800 text-sm"
                onClick={handleUploadAndAnalyze}
                disabled={uploading || analyzing}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : analyzing ? (
                  <>
                    <Brain className="h-4 w-4 animate-pulse mr-2" />
                    Analyzing & generating plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Upload & Analyze
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Score Card */}
        <Card className="md:col-span-2">
          <CardContent className="p-6 flex flex-col items-center justify-center h-full">
            {analysis ? (
              <div className="text-center space-y-3 w-full">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
                  <Target className="h-7 w-7 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Readiness Score
                  </p>
                  <p
                    className={`text-4xl font-bold mt-1 ${getScoreColor(
                      analysis.readinessScore
                    )}`}
                  >
                    {analysis.readinessScore}
                    <span className="text-lg text-muted-foreground font-normal">
                      /100
                    </span>
                  </p>
                  <Badge
                    variant="secondary"
                    className={`mt-2 ${
                      analysis.readinessScore >= 70
                        ? "bg-emerald-50 text-emerald-700"
                        : analysis.readinessScore >= 40
                        ? "bg-amber-50 text-amber-700"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {getScoreLabel(analysis.readinessScore)}
                  </Badge>
                </div>
                <div className="w-full px-2">
                  <Progress value={analysis.readinessScore}>
                    <ProgressTrack className="h-2 bg-gray-100">
                      <ProgressIndicator
                        className={
                          analysis.readinessScore >= 70
                            ? "bg-emerald-500"
                            : analysis.readinessScore >= 40
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }
                      />
                    </ProgressTrack>
                  </Progress>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <BarChart3 className="h-7 w-7 text-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No analysis yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a resume to see your score
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Previous Uploads */}
      {previousResumes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Uploaded Resumes</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  {previousResumes.length} resume
                  {previousResumes.length !== 1 ? "s" : ""} uploaded
                </CardDescription>
              </div>
              {previousResumes.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllResumes(!showAllResumes)}
                  className="text-xs"
                >
                  {showAllResumes ? (
                    <>
                      Show less <ChevronUp className="h-3 w-3 ml-1" />
                    </>
                  ) : (
                    <>
                      View all ({previousResumes.length}){" "}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-gray-100">
              {displayedResumes.map((resume, i) => (
                <motion.div
                  key={resume.fullName}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {resume.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(resume.createdAt)}</span>
                      <span className="text-gray-300">|</span>
                      <span>{formatFileSize(resume.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {i === 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-violet-50 text-violet-700 text-[10px] mr-1"
                      >
                        Latest
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => window.open(resume.url, "_blank")}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && analysis.skills && analysis.skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Skills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                  Detected Skills
                </CardTitle>
                <CardDescription className="text-xs">
                  {analysis.skills.length} skills identified from your resume
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.skills
                    .sort((a, b) => b.level - a.level)
                    .map((skill, i) => (
                      <motion.div
                        key={skill.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-3 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">
                              {skill.name}
                            </span>
                            <span className="text-xs text-muted-foreground ml-2 tabular-nums">
                              {skill.level}/10
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.level * 10}%` }}
                              transition={{
                                duration: 0.6,
                                delay: i * 0.03 + 0.2,
                              }}
                              className={`h-full rounded-full ${getSkillBarColor(
                                skill.level
                              )}`}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                          {Math.round(skill.confidence * 100)}%
                        </span>
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Gaps */}
            {(analysis.strengths.length > 0 || analysis.gaps.length > 0) && (
              <div className="grid gap-6 md:grid-cols-2">
                {analysis.strengths.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2.5">
                        {analysis.strengths.map((s, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2.5 text-sm"
                          >
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="text-gray-700">{s}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.gaps.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                        <TrendingUp className="h-4 w-4" />
                        Gaps to Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2.5">
                        {analysis.gaps.map((g, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-2.5 text-sm"
                          >
                            <div className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span className="text-gray-700">{g}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Recommendations
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Actionable steps to improve your placement readiness
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50/80 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-6 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {rec}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-emerald-200 bg-emerald-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900">
                          Prep plan auto-generated
                        </p>
                        <p className="text-xs text-emerald-600 mt-0.5">
                          A personalized 4-week timeline was created from your
                          resume
                        </p>
                      </div>
                    </div>
                    <a href="/plan">
                      <Button
                        size="sm"
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      >
                        View Plan
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
