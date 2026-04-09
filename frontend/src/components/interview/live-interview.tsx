"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import {
  Mic,
  MicOff,
  Square,
  SkipForward,
  Timer,
  Loader2,
  AudioLines,
  Keyboard,
  Send,
  PhoneOff,
} from "lucide-react";

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

interface LiveInterviewProps {
  companyName: string;
  interviewType: string;
  difficulty: string;
  introduction: string;
  questions: Question[];
  studentId: string;
  onComplete: (results: {
    questions: AnsweredQuestion[];
    overallScore: number;
    debrief: { summary: string; strengths: string[]; improvements: string[]; recommendations: string[] };
  }) => void;
  onExit: () => void;
}

type Phase = "intro" | "asking" | "listening" | "transcribing" | "evaluating" | "feedback" | "completing";

interface TranscriptEntry { id: number; speaker: "ai" | "student"; text: string }

// ─── COMPONENT ──────────────────────────────────────────

export function LiveInterview({
  companyName, interviewType, difficulty, introduction, questions,
  onComplete, onExit,
}: LiveInterviewProps) {
  const currentQRef = useRef(0);
  const answeredRef = useRef<AnsweredQuestion[]>([]);
  const mountedRef = useRef(true);
  const startedRef = useRef(false);
  const transcriptIdRef = useRef(0);
  const answerResolveRef = useRef<(() => void) | null>(null);

  const [phase, setPhaseState] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState<{ score: number; feedback: string } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>("intro");

  const setPhase = (p: Phase) => { phaseRef.current = p; setPhaseState(p); };
  const setCQ = (q: number) => { currentQRef.current = q; setCurrentQ(q); };
  const addTranscript = (speaker: "ai" | "student", text: string) => {
    const id = ++transcriptIdRef.current;
    setTranscript((prev) => [...prev, { id, speaker, text }]);
  };
  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  // Auto-scroll transcript to bottom when new entries arrive
  useEffect(() => {
    const el = transcriptEndRef.current?.parentElement;
    if (el) el.scrollTop = el.scrollHeight;
  }, [transcript]);
  useEffect(() => {
    startTimeRef.current = Date.now();
    const t = setInterval(() => { if (mountedRef.current) setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000)); }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => { if (startedRef.current) return; startedRef.current = true; runInterview(); /* eslint-disable-next-line */ }, []);

  // ─── TTS ────────────────────────────────────────────

  async function speakText(text: string): Promise<void> {
    if (!mountedRef.current) return;
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/interview/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
      if (res.ok) {
        const data = await res.json();
        if (data.segments?.length > 0) {
          for (const seg of data.segments) { if (!mountedRef.current) break; await playBase64Audio(seg); }
        } else { await browserSpeak(text); }
      } else { await browserSpeak(text); }
    } catch { await browserSpeak(text); }
    finally { if (mountedRef.current) setIsSpeaking(false); }
  }

  function playBase64Audio(b64: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const a = new Audio(`data:audio/wav;base64,${b64}`);
        a.onended = () => resolve(); a.onerror = () => resolve();
        a.play().catch(() => resolve());
      } catch { resolve(); }
    });
  }

  function browserSpeak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text); u.rate = 0.95; u.onend = () => resolve(); u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }

  // ─── INTERVIEW FLOW ─────────────────────────────────

  async function runInterview() {
    addTranscript("ai", introduction);
    await speakText(introduction);
    if (!mountedRef.current) return;
    for (let i = 0; i < questions.length; i++) { if (!mountedRef.current) return; await askAndWait(i); }
    await finishInterview();
  }

  async function askAndWait(qi: number) {
    if (!mountedRef.current) return;
    setCQ(qi); setCurrentFeedback(null); setPhase("asking");
    addTranscript("ai", questions[qi].text);
    await speakText(questions[qi].text);
    if (!mountedRef.current) return;
    setPhase("listening");
    await new Promise<void>((r) => { answerResolveRef.current = r; });
  }

  function signalDone() { if (answerResolveRef.current) { answerResolveRef.current(); answerResolveRef.current = null; } }

  // ─── RECORDING ────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm",
      });
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorderRef.current = mr; mr.start(250); setIsRecording(true); setError(null);
    } catch { setError("Mic access denied."); setShowTextInput(true); }
  }

  function stopRecording(): Promise<Blob | null> {
    const r = mediaRecorderRef.current;
    if (!r || r.state === "inactive") return Promise.resolve(null);
    return new Promise((resolve) => {
      r.onstop = () => { resolve(new Blob(audioChunksRef.current, { type: "audio/webm" })); r.stream.getTracks().forEach((t) => t.stop()); };
      r.stop(); setIsRecording(false);
    });
  }

  async function submitAudioAnswer() {
    const blob = await stopRecording();
    if (!blob || blob.size < 1000) { setError("Too short. Try again or type."); return; }
    setPhase("transcribing");
    const fd = new FormData(); fd.append("audio", blob, "audio.webm");
    try {
      const res = await fetch("/api/interview/transcribe", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok || !d.text) { setError("Couldn't transcribe. Type instead."); setPhase("listening"); setShowTextInput(true); return; }
      await evaluateAndAdvance(d.text);
    } catch { setError("Transcription failed."); setPhase("listening"); setShowTextInput(true); }
  }

  async function submitTextAnswer() {
    if (!textInput.trim()) return;
    const a = textInput.trim(); setTextInput(""); await evaluateAndAdvance(a);
  }

  async function evaluateAndAdvance(answer: string) {
    if (!mountedRef.current) return;
    const qi = currentQRef.current; const q = questions[qi];
    addTranscript("student", answer); setPhase("evaluating");

    let ans: AnsweredQuestion;
    try {
      const r = await fetch("/api/interview/evaluate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.text, rubric: q.scoringRubric, answer, questionNumber: qi + 1, totalQuestions: questions.length, interviewType }),
      });
      const d = await r.json();
      ans = { questionText: q.text, answer, score: d.score ?? 0, feedback: d.feedback || "Good attempt.", strengths: d.strengths || [], weaknesses: d.weaknesses || [], difficulty: q.difficulty };
    } catch {
      ans = { questionText: q.text, answer, score: 0, feedback: "Could not evaluate.", strengths: [], weaknesses: [], difficulty: q.difficulty };
    }

    answeredRef.current = [...answeredRef.current, ans];
    setCurrentFeedback({ score: ans.score, feedback: ans.feedback }); setPhase("feedback");
    const fb = `Score: ${ans.score} out of 10. ${ans.feedback}`;
    addTranscript("ai", fb); await speakText(fb);
    signalDone();
  }

  function skipQuestion() {
    if (isRecording) { mediaRecorderRef.current?.stop(); mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop()); setIsRecording(false); }
    const qi = currentQRef.current; const q = questions[qi];
    answeredRef.current = [...answeredRef.current, { questionText: q.text, answer: "(Skipped)", score: 0, feedback: "Skipped.", strengths: [], weaknesses: [], difficulty: q.difficulty }];
    addTranscript("student", "(Skipped)"); signalDone();
  }

  function endEarly() {
    if (isRecording) { mediaRecorderRef.current?.stop(); mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop()); setIsRecording(false); }
    mountedRef.current = false;
    answeredRef.current.length > 0 ? finishInterview() : onExit();
  }

  async function finishInterview() {
    setPhase("completing");
    try {
      const r = await fetch("/api/interview/complete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, interviewType, difficulty, questions: answeredRef.current, durationMs: Date.now() - startTimeRef.current }),
      });
      const d = await r.json();
      onComplete({ questions: answeredRef.current, overallScore: d.overallScore, debrief: d.debrief });
    } catch {
      const avg = answeredRef.current.length > 0 ? answeredRef.current.reduce((s, q) => s + q.score, 0) / answeredRef.current.length : 0;
      onComplete({ questions: answeredRef.current, overallScore: avg, debrief: { summary: "Completed. Results may not have saved.", strengths: [], improvements: [], recommendations: [] } });
    }
  }

  // ─── RENDER ───────────────────────────────────────

  const isProcessing = phase === "transcribing" || phase === "evaluating" || phase === "completing";
  const scoreColor = (s: number) => s >= 7 ? "text-emerald-600" : s >= 5 ? "text-amber-600" : "text-rose-500";

  return (
    <div className="h-full flex flex-col" style={{ background: "#f8f6fc" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <Badge variant="secondary" className="font-semibold bg-violet-100/60 text-violet-700 border-violet-200/50">{companyName}</Badge>
          <Badge variant="outline" className="capitalize border-slate-200 text-slate-500">{interviewType.replace("_", " ")}</Badge>
          <Badge variant="outline" className="capitalize border-slate-200 text-slate-500">{difficulty}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm tabular-nums text-slate-500">
            <Timer className="h-3.5 w-3.5" />{formatTime(elapsedSec)}
          </div>
          <span className="text-sm font-medium text-slate-600">{Math.min(currentQ + 1, questions.length)}/{questions.length}</span>
          <Button variant="outline" size="sm" onClick={endEarly} className="text-rose-500 border-rose-200 hover:bg-rose-50 rounded-xl gap-1.5">
            <PhoneOff className="h-3.5 w-3.5" /> End
          </Button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1 bg-slate-100">
        <div className="h-full transition-all duration-500 rounded-r-full" style={{ width: `${(answeredRef.current.length / questions.length) * 100}%`, background: "linear-gradient(90deg, #7c5bf0, #a78bfa)" }} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Center panel — scrollable, items centered via auto margins */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 min-h-0">
          <div className="flex flex-col items-center justify-center min-h-full">
          {/* AI avatar */}
          <div className="relative mb-5">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isSpeaking ? "ring-4 ring-violet-200/60" : isProcessing ? "ring-4 ring-amber-200/60" : ""
            }`} style={{ background: isSpeaking ? "linear-gradient(135deg, #ede9fe, #ddd6fe)" : isProcessing ? "#fef3c7" : "#f1f5f9" }}>
              {isProcessing ? <Loader2 className="h-8 w-8 text-amber-500 animate-spin" /> :
                <AudioLines className={`h-8 w-8 transition-colors ${isSpeaking ? "text-violet-600" : "text-slate-400"}`} />}
            </div>
            {isSpeaking && <div className="absolute inset-0 rounded-full border-2 border-violet-300 animate-ping opacity-25" />}
          </div>

          <p className="text-xs text-slate-400 mb-4">
            {isSpeaking ? "Interviewer is speaking..." : phase === "transcribing" ? "Transcribing..." : phase === "evaluating" ? "Evaluating..." : phase === "completing" ? "Generating results..." : phase === "listening" ? "Your turn — speak or type" : phase === "intro" ? "Starting..." : ""}
          </p>

          {/* Question card */}
          {phase !== "intro" && phase !== "completing" && currentQ < questions.length && (
            <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-500 mb-2">
                Question {currentQ + 1} of {questions.length}
              </p>
              <p className="text-slate-700 text-base leading-relaxed">{questions[currentQ].text}</p>
            </div>
          )}

          {/* Feedback */}
          {currentFeedback && phase === "feedback" && (
            <div className="mt-4 max-w-lg w-full bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100/60 p-4">
              <span className={`text-sm font-bold ${scoreColor(currentFeedback.score)}`}>
                {currentFeedback.score}/10
              </span>
              <p className="text-sm text-slate-600 mt-1">{currentFeedback.feedback}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 max-w-lg w-full bg-rose-50 rounded-xl border border-rose-100 p-3">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}
          </div>
        </div>

        {/* Transcript sidebar */}
        <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-slate-200/60 bg-white flex flex-col max-h-[220px] lg:max-h-none">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Transcript</p>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {transcript.map((e) => (
                <div key={e.id} className="flex gap-2">
                  <span className={`text-[10px] font-bold uppercase mt-0.5 shrink-0 w-8 ${e.speaker === "ai" ? "text-violet-400" : "text-emerald-400"}`}>
                    {e.speaker === "ai" ? "AI" : "You"}
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">{e.text}</p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-t border-slate-200/60 bg-white px-5 py-4">
        <div className="max-w-2xl mx-auto">
          {showTextInput && phase === "listening" ? (
            <div className="flex gap-2">
              <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitTextAnswer(); } }}
                placeholder="Type your answer..." autoFocus
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100 text-slate-700 placeholder:text-slate-400" />
              <Button onClick={submitTextAnswer} disabled={!textInput.trim()} className="rounded-xl" style={{ background: "#7c5bf0" }}><Send className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => setShowTextInput(false)} className="rounded-xl border-slate-200"><Mic className="h-4 w-4 text-slate-500" /></Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              {phase === "listening" && (
                <>
                  {!isRecording ? (
                    <Button size="lg" onClick={startRecording}
                      className="rounded-full h-14 w-14 p-0 shadow-lg shadow-rose-200/60"
                      style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
                      <Mic className="h-6 w-6 text-white" />
                    </Button>
                  ) : (
                    <Button size="lg" onClick={submitAudioAnswer}
                      className="rounded-full h-14 w-14 p-0 shadow-lg shadow-rose-200/60 animate-pulse"
                      style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
                      <Square className="h-5 w-5 text-white" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowTextInput(true)} className="text-slate-400 hover:text-slate-600">
                    <Keyboard className="h-4 w-4 mr-1" /> Type
                  </Button>
                  <Button variant="ghost" size="sm" onClick={skipQuestion} className="text-slate-400 hover:text-slate-600">
                    <SkipForward className="h-4 w-4 mr-1" /> Skip
                  </Button>
                </>
              )}
              {isRecording && <div className="flex items-center gap-2 text-rose-500 text-sm"><div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />Recording... tap to stop</div>}
              {isProcessing && <div className="flex items-center gap-2 text-amber-600 text-sm"><Loader2 className="h-4 w-4 animate-spin" />{phase === "transcribing" ? "Transcribing..." : phase === "evaluating" ? "Evaluating..." : "Saving..."}</div>}
              {(phase === "asking" || phase === "feedback" || phase === "intro") && isSpeaking && (
                <div className="flex items-center gap-2 text-violet-500 text-sm"><AudioLines className="h-4 w-4" /><MicOff className="h-3.5 w-3.5 text-slate-300" /><span>Interviewer speaking...</span></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
