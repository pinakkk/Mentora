"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Briefcase,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Star,
  Sparkles,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Input } from "@/components/primitives/input";
import { Textarea } from "@/components/primitives/textarea";

/* ────────────────────────────────────────────────────────── */
/*                         TYPES                              */
/* ────────────────────────────────────────────────────────── */

interface GitHubAuditResponse {
  audit: {
    username: string;
    name: string | null;
    bio: string | null;
    publicRepos: number;
    followers: number;
    totalStars: number;
    recentlyActive: boolean;
    topLanguages: Array<{ language: string; repoCount: number }>;
    highlightedRepos: Array<{
      name: string;
      description: string | null;
      language: string | null;
      stars: number;
      pushedAt: string;
    }>;
  };
  aiAudit: {
    coherenceScore: number;
    verifiedSkills: Array<{
      skill: string;
      evidence: string;
      confidence: number;
    }>;
    inconsistencies: string[];
    strengths: string[];
    recommendations: string[];
  };
}

interface LinkedInAuditResponse {
  linkedin: {
    headline: string | null;
    experiences: Array<{
      title: string;
      org: string;
      duration: string;
      summary: string;
    }>;
    education: Array<{ degree: string; institution: string; year: string }>;
    skills: string[];
    certifications: string[];
    coherenceScore: number;
    inconsistencies: string[];
    recommendations: string[];
  };
}

/* ────────────────────────────────────────────────────────── */
/*                       SHARED UI                            */
/* ────────────────────────────────────────────────────────── */

function PanelShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  iconGradient,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      {/* Glow halo on hover */}
      <div
        className="absolute -inset-[1px] rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,91,240,0.18), rgba(167,139,250,0.05) 40%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />
      <div
        className="relative rounded-[26px] border bg-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(124,91,240,0.06)] hover:shadow-[0_12px_40px_rgba(124,91,240,0.12)] transition-shadow duration-500"
        style={{ borderColor: "rgba(0,0,0,0.06)" }}
      >
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
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              {description}
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function CoherenceRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(10, score)) / 10;
  const C = 2 * Math.PI * 16; // radius 16
  const tone =
    score >= 7
      ? { stroke: "#10b981", text: "text-emerald-600", label: "Strong" }
      : score >= 4
      ? { stroke: "#f59e0b", text: "text-amber-600", label: "Moderate" }
      : { stroke: "#ef4444", text: "text-red-500", label: "Weak" };

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-10 w-10 shrink-0">
        <svg viewBox="0 0 40 40" className="h-10 w-10 -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="3"
          />
          <motion.circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={tone.stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - pct) }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-[10px] font-bold tabular-nums ${tone.text}`}>
            {score}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
          Coherence
        </p>
        <p className={`text-xs font-semibold ${tone.text}`}>{tone.label}</p>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
      style={{
        background: "rgba(124,91,240,0.06)",
        color: "#5b3ec4",
      }}
    >
      {Icon && <Icon className="h-3 w-3" />}
      <span className="tabular-nums">{value}</span>
      <span className="font-normal text-[#7c5bf0]/70">{label}</span>
    </div>
  );
}

function SectionLabel({
  children,
  tone = "violet",
  icon: Icon,
}: {
  children: React.ReactNode;
  tone?: "violet" | "emerald" | "amber";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const colors = {
    violet: "text-[#6f58d9]",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  };
  return (
    <div className="flex items-center gap-1.5 mb-2">
      {Icon && <Icon className={`h-3 w-3 ${colors[tone]}`} />}
      <span
        className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${colors[tone]}`}
      >
        {children}
      </span>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center">
      <div className="mx-auto h-9 w-9 rounded-xl bg-gray-50 flex items-center justify-center mb-2">
        <Icon className="h-4 w-4 text-gray-300" />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*                      GITHUB PANEL                          */
/* ────────────────────────────────────────────────────────── */

export function GitHubAnalyzerPanel() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GitHubAuditResponse | null>(null);

  async function run() {
    if (!input.trim()) {
      setError("Enter a GitHub username or URL");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/diagnostic/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PanelShell
      eyebrow="Code Evidence"
      title="GitHub Audit"
      description="Cross-reference your public repos against the skills on your resume."
      icon={GitBranch}
      iconGradient="linear-gradient(135deg,#1f2937,#4b5563)"
    >
      <div className="flex gap-2 mb-1">
        <Input
          placeholder="github.com/your-handle  ·  or just the username"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter") run();
          }}
          className="rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white"
        />
        <Button
          onClick={run}
          disabled={loading}
          className="shrink-0 rounded-xl text-white shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 transition-shadow font-medium"
          style={{ background: "linear-gradient(135deg,#7c5bf0,#a78bfa)" }}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Auditing
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Run Audit
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-red-50/80 border border-red-100 text-red-600 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="mt-4">
          <EmptyState
            icon={GitBranch}
            label="No audit yet — drop your handle to begin"
          />
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5 mt-5"
          >
            {/* Header strip */}
            <div
              className="rounded-2xl p-4 border"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,91,240,0.05), rgba(167,139,250,0.02))",
                borderColor: "rgba(124,91,240,0.12)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    @{result.audit.username}
                  </p>
                  {result.audit.name && (
                    <p className="text-xs text-gray-500 truncate">
                      {result.audit.name}
                    </p>
                  )}
                </div>
                <CoherenceRing score={result.aiAudit.coherenceScore} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <StatPill label="repos" value={result.audit.publicRepos} />
                <StatPill label="stars" value={result.audit.totalStars} icon={Star} />
                <StatPill label="followers" value={result.audit.followers} />
                {result.audit.recentlyActive && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Active
                  </div>
                )}
              </div>
            </div>

            {/* Top languages */}
            {result.audit.topLanguages.length > 0 && (
              <div>
                <SectionLabel>Top Languages</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {result.audit.topLanguages.map((l) => (
                    <span
                      key={l.language}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border text-gray-700"
                      style={{ borderColor: "rgba(0,0,0,0.06)" }}
                    >
                      {l.language}
                      <span className="text-gray-400 tabular-nums">
                        ·{l.repoCount}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Verified skills */}
            {result.aiAudit.verifiedSkills.length > 0 && (
              <div>
                <SectionLabel tone="emerald" icon={ShieldCheck}>
                  Verified by GitHub
                </SectionLabel>
                <div className="space-y-2">
                  {result.aiAudit.verifiedSkills.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100/60"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-emerald-900">
                          {s.skill}
                        </p>
                        <p className="text-[11px] text-emerald-700/80 leading-snug mt-0.5">
                          {s.evidence}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Inconsistencies */}
            {result.aiAudit.inconsistencies.length > 0 && (
              <div>
                <SectionLabel tone="amber" icon={AlertCircle}>
                  Inconsistencies
                </SectionLabel>
                <ul className="space-y-1.5">
                  {result.aiAudit.inconsistencies.map((i, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-700 flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50/40 border border-amber-100/60"
                    >
                      <span className="h-1 w-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.aiAudit.recommendations.length > 0 && (
              <div>
                <SectionLabel icon={TrendingUp}>Recommendations</SectionLabel>
                <ul className="space-y-1.5">
                  {result.aiAudit.recommendations.map((r, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-700 flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-violet-50/40 border border-violet-100/60"
                    >
                      <ArrowRight className="h-3 w-3 text-[#7c5bf0] mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PanelShell>
  );
}

/* ────────────────────────────────────────────────────────── */
/*                     LINKEDIN PANEL                         */
/* ────────────────────────────────────────────────────────── */

export function LinkedInAnalyzerPanel() {
  const [profileText, setProfileText] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LinkedInAuditResponse | null>(null);

  async function run() {
    if (!profileText.trim() || profileText.length < 100) {
      setError("Paste at least 100 characters of your profile text.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/diagnostic/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileText,
          linkedinUrl: linkedinUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "LinkedIn audit failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "LinkedIn audit failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PanelShell
      eyebrow="Career Story"
      title="LinkedIn Audit"
      description="Paste your LinkedIn sections — we extract structure and check it against your resume."
      icon={Briefcase}
      iconGradient="linear-gradient(135deg,#0a66c2,#3b82f6)"
    >
      <div className="space-y-2.5">
        <Input
          placeholder="https://linkedin.com/in/your-handle  (optional)"
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          disabled={loading}
          className="rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white"
        />
        <Textarea
          placeholder={`Copy your "About", "Experience", "Education", and "Skills" sections from LinkedIn and paste them here…`}
          value={profileText}
          onChange={(e) => setProfileText(e.target.value)}
          disabled={loading}
          className="min-h-[120px] text-xs rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-medium tabular-nums">
            {profileText.length} / 100 chars min
          </span>
          <Button
            onClick={run}
            disabled={loading}
            className="rounded-xl text-white shadow-md shadow-purple-500/20 hover:shadow-purple-500/30 transition-shadow font-medium"
            style={{ background: "linear-gradient(135deg,#7c5bf0,#a78bfa)" }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Analyzing
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-red-50/80 border border-red-100 text-red-600 text-xs">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="mt-4">
          <EmptyState
            icon={Briefcase}
            label="No analysis yet — paste your profile to begin"
          />
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5 mt-5"
          >
            {/* Header strip */}
            <div
              className="rounded-2xl p-4 border"
              style={{
                background:
                  "linear-gradient(135deg, rgba(10,102,194,0.05), rgba(59,130,246,0.02))",
                borderColor: "rgba(10,102,194,0.14)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                    Headline
                  </p>
                  <p className="text-sm font-semibold text-gray-900 leading-snug mt-0.5 line-clamp-2">
                    {result.linkedin.headline || "No headline detected"}
                  </p>
                </div>
                <CoherenceRing score={result.linkedin.coherenceScore} />
              </div>
            </div>

            {/* Experience */}
            {result.linkedin.experiences.length > 0 && (
              <div>
                <SectionLabel>Experience</SectionLabel>
                <div className="space-y-2">
                  {result.linkedin.experiences.slice(0, 4).map((e, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-3 rounded-xl bg-white border"
                      style={{ borderColor: "rgba(0,0,0,0.06)" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {e.title}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {e.org}
                          </p>
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">
                          {e.duration}
                        </span>
                      </div>
                      {e.summary && (
                        <p className="text-[11px] text-gray-600 leading-relaxed mt-1.5 line-clamp-2">
                          {e.summary}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills chips */}
            {result.linkedin.skills.length > 0 && (
              <div>
                <SectionLabel>Skills Listed</SectionLabel>
                <div className="flex flex-wrap gap-1.5">
                  {result.linkedin.skills.slice(0, 18).map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium bg-white border text-gray-700"
                      style={{ borderColor: "rgba(0,0,0,0.06)" }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inconsistencies */}
            {result.linkedin.inconsistencies.length > 0 && (
              <div>
                <SectionLabel tone="amber" icon={AlertCircle}>
                  Inconsistencies
                </SectionLabel>
                <ul className="space-y-1.5">
                  {result.linkedin.inconsistencies.map((i, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-700 flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-amber-50/40 border border-amber-100/60"
                    >
                      <span className="h-1 w-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.linkedin.recommendations.length > 0 && (
              <div>
                <SectionLabel icon={TrendingUp}>Recommendations</SectionLabel>
                <ul className="space-y-1.5">
                  {result.linkedin.recommendations.map((r, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-700 flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-violet-50/40 border border-violet-100/60"
                    >
                      <ArrowRight className="h-3 w-3 text-[#7c5bf0] mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PanelShell>
  );
}
