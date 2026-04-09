"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/primitives/select";
import { Mic2, Play, Clock, Building2 } from "lucide-react";

const interviewTypes = [
  { value: "technical", label: "Technical", description: "DSA, coding, problem-solving" },
  { value: "behavioral", label: "Behavioral", description: "STAR method, teamwork, leadership" },
  { value: "hr", label: "HR", description: "Goals, salary, culture fit" },
  { value: "system_design", label: "System Design", description: "Architecture, scaling, trade-offs" },
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
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export default function MockInterviewPage() {
  const [started, setStarted] = useState(false);
  const [company, setCompany] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("medium");

  if (started) {
    return (
      <div className="h-full flex flex-col">
        <div className="h-12 border-b bg-white flex items-center px-4 gap-3 shrink-0">
          <Mic2 className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">
            Mock Interview — {company} ({type})
          </span>
          <Badge variant="secondary" className="text-xs">
            {difficulty}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto rounded-full"
            onClick={() => setStarted(false)}
          >
            End Interview
          </Button>
        </div>
        <div className="flex-1">
          <ChatInterface
            apiEndpoint="/api/chat/mock"
            extraBody={{
              companyName: company,
              interviewType: type,
              difficulty,
            }}
            placeholder="Type your answer..."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mock Interview</h1>
        <p className="text-gray-500 text-sm mt-1">
          Practice with our AI interviewer. Adaptive difficulty, company-specific
          questions, rubric-based feedback.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Set Up Your Interview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Company</label>
            <Select value={company} onValueChange={(v) => setCompany(v ?? "")}>
              <SelectTrigger>
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Interview Type</label>
            <div className="grid grid-cols-2 gap-3">
              {interviewTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`p-4 rounded-xl border text-left transition ${
                    type === t.value
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "medium")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start */}
          <Button
            className="w-full rounded-full bg-gray-900 hover:bg-gray-800 py-6 text-base"
            disabled={!company || !type}
            onClick={() => setStarted(true)}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Mock Interview
          </Button>

          <p className="text-center text-xs text-gray-400">
            <Clock className="h-3 w-3 inline mr-1" />
            Estimated duration: 15-20 minutes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
