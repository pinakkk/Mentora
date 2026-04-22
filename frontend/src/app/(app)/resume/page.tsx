"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/primitives/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Target,
  TrendingUp,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Skeleton } from "@/components/primitives/skeleton";
import {
  GitHubAnalyzerPanel,
  LinkedInAnalyzerPanel,
} from "@/components/diagnostic-panels";

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

/* ── helpers ─────────────────────────────────────────────── */

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

function scoreTone(score: number) {
  if (score >= 70)
    return {
      stroke: "#10b981",
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      label: "Strong",
    };
  if (score >= 40)
    return {
      stroke: "#f59e0b",
      text: "text-amber-600",
      bg: "bg-amber-50",
      label: "Moderate",
    };
  return {
    stroke: "#ef4444",
    text: "text-red-500",
    bg: "bg-red-50",
    label: "Needs Work",
  };
}

function skillTone(level: number) {
  if (level >= 7)
    return { bar: "linear-gradient(90deg,#10b981,#34d399)", text: "text-emerald-600" };
  if (level >= 4)
    return { bar: "linear-gradient(90deg,#7c5bf0,#a78bfa)", text: "text-[#6f58d9]" };
  return { bar: "linear-gradient(90deg,#f59e0b,#fbbf24)", text: "text-amber-600" };
}

/* ── shared building blocks (landing-page vocabulary) ────── */

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f58d9]">
      {children}
    </span>
  );
}

function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mt-2">
        {title}
      </h1>
      <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function PolishedCard({
  children,
  className = "",
  glow = true,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`group relative ${className}`}>
      {glow && (
        <div
          className="absolute -inset-[1px] rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,91,240,0.18), rgba(167,139,250,0.05) 40%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
      )}
      <div
        className="relative h-full rounded-[26px] border bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(124,91,240,0.06)] hover:shadow-[0_12px_40px_rgba(124,91,240,0.12)] transition-shadow duration-500"
        style={{ borderColor: "rgba(0,0,0,0.06)" }}
      >
        {children}
      </div>
    </div>
  );
}

function CardHeading({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  iconGradient,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div
        className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: iconGradient }}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0 pt-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6f58d9]">
          {eyebrow}
        </span>
        <h3 className="font-heading text-lg font-semibold tracking-tight text-gray-900 mt-0.5">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-500 leading-relaxed mt-1">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Readiness ring ──────────────────────────────────────── */

function ReadinessRing({ score }: { score: number }) {
  const tone = scoreTone(score);
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const R = 56;
  const C = 2 * Math.PI * R;

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
        <defs>
          <linearGradient id="readiness-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c5bf0" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="rgba(124,91,240,0.08)"
          strokeWidth="10"
        />
        <motion.circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="url(#readiness-grad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: C * (1 - pct) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-4xl font-bold tabular-nums text-gray-900">
          {score}
          <span className="text-base text-gray-300 font-normal">/100</span>
        </span>
        <span className={`text-[11px] font-semibold uppercase tracking-wider mt-0.5 ${tone.text}`}>
          {tone.label}
        </span>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */

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
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement | null>(null);

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
      setAnalysis({
        skills: result.skills || [],
        readinessScore: result.readinessScore || 0,
        strengths: result.strengths || [],
        gaps: result.gaps || [],
        recommendations: result.recommendations || [],
      });

      const listRes = await fetch("/api/resume/list");
      if (listRes.ok) {
        const data = await listRes.json();
        setPreviousResumes(data.resumes || []);
      }

      setFile(null);
      setResultDialogOpen(true);
      toast.success("Resume analyzed", {
        description: `Readiness score: ${Math.round(result.readinessScore || 0)}%`,
      });
      // Scroll the inline results into view once React commits the new state.
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
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
      <div className="p-6 max-w-6xl mx-auto space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-5">
          <Skeleton className="h-56 md:col-span-3 rounded-[26px]" />
          <Skeleton className="h-56 md:col-span-2 rounded-[26px]" />
        </div>
        <Skeleton className="h-72 rounded-[26px]" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-full"
      style={{ background: "var(--surface)" }}
    >
      {/* Soft background blobs (landing-page vibe) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(124,91,240,0.08),transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.06),transparent_70%)]" />
      </div>

      <div className="relative p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
        {/* ── Page header ─────────────────────────────────── */}
        <PageHeading
          eyebrow="Resume Diagnostic"
          title={
            <>
              Turn your resume into a{" "}
              <span
                className="italic text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(135deg, #7c5bf0, #a78bfa)",
                }}
              >
                readiness blueprint
              </span>
              .
            </>
          }
          description="Drop your PDF and Mentora extracts your skills, scores your placement readiness, and generates a personalized prep plan in under a minute."
        />

        {/* ── Upload + Score ──────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Upload zone */}
          <div className="lg:col-span-3">
            <PolishedCard>
              <CardHeading
                eyebrow="Step 1"
                title="Upload your resume"
                subtitle="PDF only, up to 10 MB. We extract real text — no hallucinations."
                icon={Upload}
                iconGradient="linear-gradient(135deg,#7c5bf0,#a78bfa)"
              />

              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                className={`relative rounded-2xl p-7 text-center transition-all duration-300 border ${
                  dragOver
                    ? "border-[#7c5bf0]/40 bg-[#7c5bf0]/[0.04] scale-[1.01]"
                    : file
                    ? "border-emerald-200 bg-emerald-50/40"
                    : "border-dashed border-gray-200 hover:border-[#7c5bf0]/30 hover:bg-[#7c5bf0]/[0.02]"
                }`}
              >
                {file ? (
                  <div className="space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(124,91,240,0.08)" }}
                    >
                      <Upload className="h-5 w-5" style={{ color: "#7c5bf0" }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Drop your resume here
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        or click to browse files
                      </p>
                    </div>
                    <label className="inline-block">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <span
                        className="inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-semibold cursor-pointer transition-colors text-white shadow-sm"
                        style={{
                          background: "linear-gradient(135deg,#7c5bf0,#a78bfa)",
                        }}
                      >
                        Browse Files
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-red-50/80 border border-red-100 text-red-600 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {file && (
                <Button
                  className="w-full mt-4 h-11 rounded-2xl text-sm font-semibold text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 transition-shadow"
                  style={{
                    background: "linear-gradient(135deg,#7c5bf0,#a78bfa)",
                  }}
                  onClick={handleUploadAndAnalyze}
                  disabled={uploading || analyzing}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading…
                    </>
                  ) : analyzing ? (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                       Analyze now
                      <ArrowRight className="h-3.5 w-3.5 ml-2 opacity-70" />
                    </>
                  )}
                </Button>
              )}
            </PolishedCard>
          </div>

          {/* Score card */}
          <div className="lg:col-span-2">
            <PolishedCard>
              <CardHeading
                eyebrow="Step 2"
                title="Readiness Score"
                subtitle="Your overall placement readiness."
                icon={Target}
                iconGradient="linear-gradient(135deg,#10b981,#34d399)"
              />
              {analysis ? (
                <div className="flex flex-col items-center justify-center pt-2">
                  <ReadinessRing score={analysis.readinessScore} />
                  <p className="text-xs text-gray-500 mt-4 text-center max-w-[220px]">
                    Computed from skills, strengths, gaps, and prior assessments.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-2 pb-4">
                  <div className="w-32 h-32 rounded-full border-[10px] border-gray-100 flex items-center justify-center">
                    <BarChart3 className="h-7 w-7 text-gray-300" />
                  </div>
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    Upload a resume to see your score
                  </p>
                </div>
              )}
            </PolishedCard>
          </div>
        </div>

        {/* ── Profile Audit (GitHub + LinkedIn) ───────────── */}
        <div>
          <div className="mb-5">
            <SectionEyebrow>Profile Audit</SectionEyebrow>
            <h2 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 mt-2">
              Verify the story your resume{" "}
              <span
                className="italic text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(135deg, #7c5bf0, #a78bfa)",
                }}
              >
                actually tells
              </span>
              .
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">
              Cross-reference your claims against your real GitHub activity and LinkedIn profile.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <GitHubAnalyzerPanel />
            <LinkedInAnalyzerPanel />
          </div>
        </div>

        {/* ── Previous Uploads ────────────────────────────── */}
        {previousResumes.length > 0 && (
          <PolishedCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-start gap-4">
                <div
                  className="h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: "linear-gradient(135deg,#64748b,#94a3b8)" }}
                >
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="pt-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6f58d9]">
                    Archive
                  </span>
                  <h3 className="font-heading text-lg font-semibold tracking-tight text-gray-900 mt-0.5">
                    Uploaded Resumes
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {previousResumes.length} version
                    {previousResumes.length !== 1 ? "s" : ""} archived
                  </p>
                </div>
              </div>
              {previousResumes.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllResumes(!showAllResumes)}
                  className="text-xs text-[#6f58d9] hover:text-[#5b3ec4]"
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
            <div className="space-y-2">
              {displayedResumes.map((resume, i) => (
                <motion.div
                  key={resume.fullName}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border bg-gray-50/40 hover:bg-white transition-colors"
                  style={{ borderColor: "rgba(0,0,0,0.05)" }}
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {resume.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(resume.createdAt)}</span>
                      <span className="text-gray-200">·</span>
                      <span className="tabular-nums">
                        {formatFileSize(resume.size)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {i === 0 && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: "rgba(124,91,240,0.1)",
                          color: "#5b3ec4",
                        }}
                      >
                        Latest
                      </span>
                    )}
                    <button
                      onClick={() => window.open(resume.url, "_blank")}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </PolishedCard>
        )}

        {/* ── Analysis Results ────────────────────────────── */}
        <AnimatePresence>
          {analysis && analysis.skills && analysis.skills.length > 0 && (
            <motion.div
              ref={resultsRef}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 scroll-mt-6"
            >
              <div>
                <SectionEyebrow>Diagnostic Report</SectionEyebrow>
                <h2 className="font-heading text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 mt-2">
                  Here&apos;s what your resume{" "}
                  <span
                    className="italic text-transparent bg-clip-text"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #7c5bf0, #a78bfa)",
                    }}
                  >
                    really says
                  </span>
                  .
                </h2>
              </div>

              {/* Detected Skills */}
              <PolishedCard>
                <CardHeading
                  eyebrow="Skills Map"
                  title="Detected Skills"
                  subtitle={`${analysis.skills.length} skills identified, scored 0–10 with confidence.`}
                  icon={BarChart3}
                  iconGradient="linear-gradient(135deg,#7c5bf0,#a78bfa)"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {analysis.skills
                    .sort((a, b) => b.level - a.level)
                    .map((skill, i) => {
                      const tone = skillTone(skill.level);
                      return (
                        <motion.div
                          key={skill.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="group/skill"
                        >
                          <div className="flex items-baseline justify-between mb-1.5">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {skill.name}
                            </span>
                            <div className="flex items-baseline gap-2 shrink-0">
                              <span
                                className={`text-sm font-bold tabular-nums ${tone.text}`}
                              >
                                {skill.level}
                                <span className="text-[10px] text-black font-normal">
                                  /10
                                </span>
                              </span>
                              <span className="text-[10px] text-black tabular-nums">
                                {Math.round(skill.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.level * 10}%` }}
                              transition={{
                                duration: 0.7,
                                delay: i * 0.03 + 0.2,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="h-full rounded-full"
                              style={{ background: tone.bar }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </PolishedCard>

              {/* Strengths + Gaps */}
              {(analysis.strengths.length > 0 || analysis.gaps.length > 0) && (
                <div className="grid gap-6 lg:grid-cols-2">
                  {analysis.strengths.length > 0 && (
                    <PolishedCard>
                      <CardHeading
                        eyebrow="Wins"
                        title="Strengths"
                        subtitle="What you're already doing well."
                        icon={CheckCircle2}
                        iconGradient="linear-gradient(135deg,#10b981,#34d399)"
                      />
                      <ul className="space-y-2.5">
                        {analysis.strengths.map((s, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100/60"
                          >
                            <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            </div>
                            <span className="text-sm text-gray-700 leading-relaxed">
                              {s}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </PolishedCard>
                  )}

                  {analysis.gaps.length > 0 && (
                    <PolishedCard>
                      <CardHeading
                        eyebrow="Focus"
                        title="Gaps to Address"
                        subtitle="Areas your prep plan will target."
                        icon={TrendingUp}
                        iconGradient="linear-gradient(135deg,#f59e0b,#fbbf24)"
                      />
                      <ul className="space-y-2.5">
                        {analysis.gaps.map((g, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50/40 border border-amber-100/60"
                          >
                            <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                              <TrendingUp className="h-3 w-3 text-amber-600" />
                            </div>
                            <span className="text-sm text-gray-700 leading-relaxed">
                              {g}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </PolishedCard>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <PolishedCard>
                  <CardHeading
                    eyebrow="Action Plan"
                    title="Recommendations"
                    subtitle="Concrete next steps tailored to this resume."
                    icon={Lightbulb}
                    iconGradient="linear-gradient(135deg,#7c5bf0,#a78bfa)"
                  />
                  <div className="space-y-3">
                    {analysis.recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-4 rounded-2xl border bg-gradient-to-br from-[#7c5bf0]/[0.03] to-transparent hover:from-[#7c5bf0]/[0.06] transition-colors"
                        style={{ borderColor: "rgba(124,91,240,0.1)" }}
                      >
                        <div
                          className="h-7 w-7 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold tabular-nums text-white shadow-sm"
                          style={{
                            background:
                              "linear-gradient(135deg,#7c5bf0,#a78bfa)",
                          }}
                        >
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed pt-1">
                          {rec}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </PolishedCard>
              )}

              {/* Plan generated banner */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div
                  className="relative overflow-hidden rounded-[26px] border p-5 sm:p-6"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(124,91,240,0.04))",
                    borderColor: "rgba(16,185,129,0.2)",
                  }}
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{
                          background: "linear-gradient(135deg,#10b981,#34d399)",
                        }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                          Auto-Generated
                        </span>
                        <p className="font-heading text-base font-semibold text-emerald-900 mt-0.5">
                          Your prep plan is ready
                        </p>
                        <p className="text-xs text-emerald-700/80 mt-0.5">
                          A personalized 4-week timeline was created from your resume.
                        </p>
                      </div>
                    </div>
                    <a href="/plan">
                      <Button
                        size="sm"
                        className="rounded-full text-white shadow-md font-medium gap-2"
                        style={{
                          background: "linear-gradient(135deg,#10b981,#059669)",
                        }}
                      >
                        View Plan
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Result popup (auto-opens once analysis returns) ── */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ background: "linear-gradient(135deg,#10b981,#34d399)" }}
              >
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="font-heading">
                  Analysis complete
                </DialogTitle>
                <DialogDescription>
                  Here&apos;s the snapshot — full report is below.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {analysis && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-4 rounded-2xl border bg-gradient-to-br from-emerald-50/60 to-transparent">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Readiness
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums mt-1">
                    {Math.round(analysis.readinessScore)}
                    <span className="text-base text-gray-400 font-normal">/100</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6f58d9]">
                    Skills found
                  </p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums mt-1">
                    {analysis.skills.length}
                  </p>
                </div>
              </div>

              {analysis.strengths.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700 mb-2">
                    Top strengths
                  </p>
                  <ul className="space-y-1.5">
                    {analysis.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.gaps.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700 mb-2">
                    Focus areas
                  </p>
                  <ul className="space-y-1.5">
                    {analysis.gaps.slice(0, 3).map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <TrendingUp className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setResultDialogOpen(false)}
              className="rounded-full"
            >
              View full report
            </Button>
            <a href="/plan" className="inline-flex">
              <Button
                className="rounded-full text-white shadow-md gap-2 w-full"
                style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
              >
                Open prep plan
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
