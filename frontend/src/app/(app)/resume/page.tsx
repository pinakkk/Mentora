"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { Progress } from "@/components/primitives/progress";

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

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

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
      // Upload the file
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      setUploading(false);
      setAnalyzing(true);

      // Analyze the resume
      const analyzeRes = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeUrl: url }),
      });

      if (!analyzeRes.ok) throw new Error("Analysis failed");
      const result = await analyzeRes.json();
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resume Analysis</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload your resume and let our Diagnostic Agent analyze your skills,
          detect gaps, and create your profile
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-8">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragOver
                ? "border-blue-400 bg-blue-50"
                : file
                ? "border-emerald-400 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {file ? (
              <div className="space-y-3">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null);
                    setAnalysis(null);
                  }}
                >
                  Change file
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 text-gray-300 mx-auto" />
                <div>
                  <p className="font-medium">
                    Drag & drop your resume PDF here
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    or click to browse
                  </p>
                </div>
                <label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    Browse Files
                  </span>
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-4 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {file && !analysis && (
            <Button
              className="w-full mt-4 rounded-full bg-gray-900 hover:bg-gray-800"
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
                  AI Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze with AI
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Readiness Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Readiness Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold">
                    {analysis.readinessScore}%
                  </span>
                  <Progress
                    value={analysis.readinessScore}
                    className="flex-1 h-3"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Detected Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.skills.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className={`px-3 py-1.5 ${
                        skill.level >= 7
                          ? "bg-emerald-100 text-emerald-700"
                          : skill.level >= 4
                          ? "bg-blue-100 text-blue-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {skill.name}: {skill.level}/10
                      <span className="ml-1 text-[10px] opacity-60">
                        ({Math.round(skill.confidence * 100)}%)
                      </span>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths & Gaps */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-emerald-600">
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-orange-600">
                    Gaps to Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.gaps.map((g, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                        {g}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
