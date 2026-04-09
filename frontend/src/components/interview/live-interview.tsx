"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/primitives/button";
import { Badge } from "@/components/primitives/badge";
import { ScrollArea } from "@/components/primitives/scroll-area";
import {
  Mic,
  MicOff,
  Square,
  SkipForward,
  Clock,
  Loader2,
  Volume2,
  Keyboard,
  Send,
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
    debrief: {
      summary: string;
      strengths: string[];
      improvements: string[];
      recommendations: string[];
    };
  }) => void;
  onExit: () => void;
}

type InterviewPhase =
  | "intro"
  | "asking"
  | "listening"
  | "transcribing"
  | "evaluating"
  | "feedback"
  | "completing";

interface TranscriptEntry {
  speaker: "ai" | "student";
  text: string;
  timestamp: number;
}

// ─── COMPONENT ──────────────────────────────────────────

export function LiveInterview({
  companyName,
  interviewType,
  difficulty,
  introduction,
  questions,
  onComplete,
  onExit,
}: LiveInterviewProps) {
  const [phase, setPhase] = useState<InterviewPhase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState<{
    score: number;
    feedback: string;
  } | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript, phase]);

  // Timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Play introduction on mount
  useEffect(() => {
    addTranscript("ai", introduction);
    speakText(introduction).then(() => {
      setPhase("asking");
      askCurrentQuestion(0);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const addTranscript = useCallback(
    (speaker: "ai" | "student", text: string) => {
      setTranscript((prev) => [...prev, { speaker, text, timestamp: Date.now() }]);
    },
    []
  );

  // ─── TTS ────────────────────────────────────────────

  const speakText = useCallback(
    async (text: string): Promise<void> => {
      setIsSpeaking(true);
      try {
        const res = await fetch("/api/interview/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (res.ok && res.headers.get("content-type")?.includes("audio")) {
          const audioBuffer = await res.arrayBuffer();
          await playAudioBuffer(audioBuffer);
        } else {
          // Fallback to browser TTS
          await browserSpeak(text);
        }
      } catch {
        await browserSpeak(text);
      } finally {
        setIsSpeaking(false);
      }
    },
    []
  );

  const playAudioBuffer = async (buffer: ArrayBuffer): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext();
        }
        const ctx = audioContextRef.current;
        ctx.decodeAudioData(
          buffer,
          (decoded) => {
            const source = ctx.createBufferSource();
            source.buffer = decoded;
            source.connect(ctx.destination);
            source.onended = () => resolve();
            source.start();
          },
          () => {
            // Decode failed, use browser TTS as fallback
            resolve();
          }
        );
      } catch {
        resolve();
      }
    });
  };

  const browserSpeak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve();
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  // ─── ASK QUESTION ─────────────────────────────────

  const askCurrentQuestion = useCallback(
    async (qIndex: number) => {
      if (qIndex >= questions.length) {
        completeInterview();
        return;
      }
      const q = questions[qIndex];
      setCurrentFeedback(null);
      setPhase("asking");
      addTranscript("ai", q.text);
      await speakText(q.text);
      setPhase("listening");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions]
  );

  // ─── RECORDING ────────────────────────────────────

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // collect data every 250ms
      setIsRecording(true);
      setError(null);
    } catch {
      setError("Mic access denied. Use text input instead.");
      setShowTextInput(true);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    return new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // Stop all tracks to release mic
        recorder.stream.getTracks().forEach((t) => t.stop());
        resolve(blob);
      };
      recorder.stop();
      setIsRecording(false);
    });
  }, []);

  // ─── SUBMIT ANSWER ────────────────────────────────

  const submitAudioAnswer = useCallback(async () => {
    const audioBlob = await stopRecording();
    if (!audioBlob || audioBlob.size < 1000) {
      setError("Recording too short. Try again or type your answer.");
      setPhase("listening");
      return;
    }

    setPhase("transcribing");

    // Transcribe
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");

    try {
      const transcribeRes = await fetch("/api/interview/transcribe", {
        method: "POST",
        body: formData,
      });
      const transcribeData = await transcribeRes.json();

      if (!transcribeRes.ok || !transcribeData.text) {
        setError("Could not transcribe. Please try again or type your answer.");
        setPhase("listening");
        setShowTextInput(true);
        return;
      }

      await processAnswer(transcribeData.text);
    } catch {
      setError("Transcription failed. Please type your answer instead.");
      setPhase("listening");
      setShowTextInput(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopRecording, currentQ]);

  const submitTextAnswer = useCallback(async () => {
    if (!textInput.trim()) return;
    const answer = textInput.trim();
    setTextInput("");
    await processAnswer(answer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textInput, currentQ]);

  const processAnswer = async (answerText: string) => {
    const q = questions[currentQ];
    addTranscript("student", answerText);
    setPhase("evaluating");

    try {
      const evalRes = await fetch("/api/interview/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.text,
          rubric: q.scoringRubric,
          answer: answerText,
          questionNumber: currentQ + 1,
          totalQuestions: questions.length,
          interviewType,
        }),
      });
      const evalData = await evalRes.json();

      const answered: AnsweredQuestion = {
        questionText: q.text,
        answer: answerText,
        score: evalData.score || 5,
        feedback: evalData.feedback || "Good attempt.",
        strengths: evalData.strengths || [],
        weaknesses: evalData.weaknesses || [],
        difficulty: q.difficulty,
      };

      setAnsweredQuestions((prev) => [...prev, answered]);
      setCurrentFeedback({ score: answered.score, feedback: answered.feedback });
      setPhase("feedback");

      // Brief feedback from AI
      const feedbackMsg = `Score: ${answered.score}/10. ${answered.feedback}`;
      addTranscript("ai", feedbackMsg);
      await speakText(feedbackMsg);

      // Move to next question
      const nextQ = currentQ + 1;
      setCurrentQ(nextQ);

      if (nextQ < questions.length) {
        await askCurrentQuestion(nextQ);
      } else {
        await completeInterview();
      }
    } catch {
      setError("Evaluation failed. Moving to next question.");
      const nextQ = currentQ + 1;
      setCurrentQ(nextQ);
      if (nextQ < questions.length) {
        await askCurrentQuestion(nextQ);
      } else {
        await completeInterview();
      }
    }
  };

  // ─── COMPLETE ─────────────────────────────────────

  const completeInterview = async () => {
    setPhase("completing");

    try {
      const res = await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          interviewType,
          difficulty,
          questions: answeredQuestions,
          durationMs: Date.now() - startTimeRef.current,
        }),
      });
      const data = await res.json();

      onComplete({
        questions: answeredQuestions,
        overallScore: data.overallScore,
        debrief: data.debrief,
      });
    } catch {
      // Still show results even if save fails
      const avg =
        answeredQuestions.length > 0
          ? answeredQuestions.reduce((s, q) => s + q.score, 0) /
            answeredQuestions.length
          : 0;
      onComplete({
        questions: answeredQuestions,
        overallScore: avg,
        debrief: {
          summary: "Interview completed. Results may not have been saved.",
          strengths: [],
          improvements: [],
          recommendations: [],
        },
      });
    }
  };

  const skipQuestion = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }

    const q = questions[currentQ];
    setAnsweredQuestions((prev) => [
      ...prev,
      {
        questionText: q.text,
        answer: "(Skipped)",
        score: 0,
        feedback: "Question was skipped.",
        strengths: [],
        weaknesses: [],
        difficulty: q.difficulty,
      },
    ]);

    addTranscript("student", "(Skipped this question)");

    const nextQ = currentQ + 1;
    setCurrentQ(nextQ);

    if (nextQ < questions.length) {
      await askCurrentQuestion(nextQ);
    } else {
      await completeInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, isRecording, questions]);

  const endEarly = useCallback(async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
    }
    if (answeredQuestions.length > 0) {
      await completeInterview();
    } else {
      onExit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording, answeredQuestions]);

  // ─── RENDER ───────────────────────────────────────

  const isProcessing =
    phase === "transcribing" || phase === "evaluating" || phase === "completing";

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-semibold">
            {companyName}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {interviewType.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {difficulty}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(elapsedMs)}
          </div>
          <div className="text-sm font-medium text-gray-700">
            {Math.min(currentQ + 1, questions.length)}/{questions.length}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={endEarly}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            End Interview
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-violet-500 transition-all duration-500"
          style={{
            width: `${(Math.min(currentQ, questions.length) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* AI + Question panel */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-0">
          {/* AI Avatar */}
          <div className="relative mb-6">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                isSpeaking
                  ? "bg-violet-100 ring-4 ring-violet-300 ring-opacity-50 animate-pulse"
                  : isProcessing
                    ? "bg-amber-50 ring-4 ring-amber-200 ring-opacity-50"
                    : "bg-gray-100"
              }`}
            >
              {isProcessing ? (
                <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
              ) : (
                <Volume2
                  className={`h-10 w-10 transition-colors ${
                    isSpeaking ? "text-violet-600" : "text-gray-400"
                  }`}
                />
              )}
            </div>
            {isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-violet-300 animate-ping opacity-30" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-violet-200 animate-ping opacity-20"
                  style={{ animationDelay: "0.5s" }}
                />
              </>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-4">
            {isSpeaking
              ? "Interviewer is speaking..."
              : phase === "transcribing"
                ? "Transcribing your answer..."
                : phase === "evaluating"
                  ? "Evaluating your response..."
                  : phase === "completing"
                    ? "Generating your results..."
                    : phase === "listening"
                      ? "Your turn to answer"
                      : phase === "intro"
                        ? "Starting interview..."
                        : ""}
          </p>

          {/* Current question */}
          {currentQ < questions.length && phase !== "intro" && (
            <div className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center">
              <p className="text-xs font-medium text-violet-500 mb-2">
                Question {currentQ + 1} of {questions.length}
              </p>
              <p className="text-gray-900 text-base leading-relaxed">
                {questions[currentQ].text}
              </p>
            </div>
          )}

          {/* Feedback */}
          {currentFeedback && phase === "feedback" && (
            <div className="mt-4 max-w-lg w-full bg-violet-50 rounded-xl border border-violet-100 p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-violet-700">
                  Score: {currentFeedback.score}/10
                </span>
              </div>
              <p className="text-sm text-violet-600">
                {currentFeedback.feedback}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 max-w-lg w-full bg-red-50 rounded-xl border border-red-100 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Transcript sidebar */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l bg-white flex flex-col max-h-[300px] lg:max-h-none">
          <div className="px-4 py-3 border-b">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Transcript
            </p>
          </div>
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {transcript.map((entry, i) => (
                <div key={i} className="flex gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase mt-0.5 shrink-0 w-10 ${
                      entry.speaker === "ai"
                        ? "text-violet-500"
                        : "text-emerald-500"
                    }`}
                  >
                    {entry.speaker === "ai" ? "AI" : "You"}
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {entry.text}
                  </p>
                </div>
              ))}
              <div ref={transcriptEndRef} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Control bar */}
      <div className="border-t bg-white px-5 py-4">
        <div className="max-w-2xl mx-auto">
          {showTextInput && phase === "listening" ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitTextAnswer();
                  }
                }}
                placeholder="Type your answer..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-violet-300 focus:ring-1 focus:ring-violet-100"
                autoFocus
              />
              <Button
                onClick={submitTextAnswer}
                disabled={!textInput.trim()}
                className="bg-violet-500 hover:bg-violet-600 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTextInput(false)}
                className="rounded-xl"
              >
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              {phase === "listening" && (
                <>
                  {!isRecording ? (
                    <Button
                      size="lg"
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 rounded-full h-14 w-14 p-0 shadow-lg shadow-red-200"
                    >
                      <Mic className="h-6 w-6" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={submitAudioAnswer}
                      className="bg-red-500 hover:bg-red-600 rounded-full h-14 w-14 p-0 shadow-lg shadow-red-200 animate-pulse"
                    >
                      <Square className="h-5 w-5" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTextInput(true)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Keyboard className="h-4 w-4 mr-1" />
                    Type instead
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={skipQuestion}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip
                  </Button>
                </>
              )}

              {isRecording && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Recording... Click to stop and submit
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {phase === "transcribing"
                    ? "Transcribing..."
                    : phase === "evaluating"
                      ? "Evaluating..."
                      : "Saving results..."}
                </div>
              )}

              {(phase === "asking" || phase === "feedback" || phase === "intro") &&
                isSpeaking && (
                  <div className="flex items-center gap-2 text-violet-500 text-sm">
                    <Volume2 className="h-4 w-4" />
                    <MicOff className="h-3.5 w-3.5 text-gray-300" />
                    <span>Interviewer speaking...</span>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
