# PlaceAI — Mock Interview: Implementation Plan (MVP)

> **Feature**: Voice-Based Mock Interview with AI Interviewer  
> **Status**: Implementing  
> **Last Updated**: April 2026  
> **Dependencies**: Groq API (Whisper STT + Orpheus TTS + LLM — all FREE), Claude Sonnet 4 (1 call for question prep)

---

## 1. Executive Summary

Minimal-cost voice mock interview. **One Sonnet call** generates personalized structured questions upfront. Everything else (STT, TTS, evaluation) runs on **Groq's free-tier models**.

**Student experience:**
1. Select company, interview type, difficulty
2. Click "Start" → Sonnet generates personalized questions (1 API call)
3. AI asks question via voice (Groq Orpheus TTS: `canopylabs/orpheus-v1-english`)
4. Student speaks → Groq Whisper transcribes
5. Groq LLM evaluates answer against rubric
6. After 5-7 questions → comprehensive debrief with scores
7. Results stored in memory → coach can reference them

---

## 2. Architecture: Cost-Optimized Pipeline

```
BROWSER (turn-based REST calls)
  │
  ├─ POST /api/interview/prepare   → Sonnet 4 (1 call) → structured questions + rubrics
  │
  │  FOR EACH QUESTION:
  ├─ POST /api/interview/tts        → Groq Orpheus TTS (FREE) → audio of question
  ├─ POST /api/interview/transcribe  → Groq Whisper STT (FREE) → student's answer text
  ├─ POST /api/interview/evaluate    → Groq LLM (FREE) → score + feedback
  │
  └─ POST /api/interview/complete    → Save assessment + memory facts + update readiness
```

### API Call Budget Per Session

| Step | Provider | Model | Calls | Cost |
|------|----------|-------|-------|------|
| Question generation | OpenRouter/Sonnet 4 | anthropic/claude-sonnet-4 | **1** | ~$0.02 |
| TTS (per question) | Groq | canopylabs/orpheus-v1-english | 5-7 | **FREE** |
| STT (per answer) | Groq | whisper-large-v3-turbo | 5-7 | **FREE** |
| Answer evaluation | Groq | llama-3.3-70b-versatile | 5-7 | **FREE** |
| Debrief generation | Groq | llama-3.3-70b-versatile | 1 | **FREE** |
| **Total paid calls** | | | **1** | **~$0.02/session** |

---

## 3. Groq Models Used

| Task | Model | Endpoint |
|------|-------|----------|
| Speech-to-Text | `whisper-large-v3-turbo` | `/openai/v1/audio/transcriptions` |
| Text-to-Speech | `canopylabs/orpheus-v1-english` | `/openai/v1/audio/speech` |
| Answer Evaluation | `llama-3.3-70b-versatile` | `/openai/v1/chat/completions` |

---

## 4. Memory Integration

After interview completes:
1. Assessment saved to `assessments` table
2. Memory facts extracted (skills, struggles, milestones)
3. Readiness score updated via `compute_readiness`
4. Coach agent auto-references results in future chats

---

## 5. Fallbacks

| Failure | Fallback |
|---------|----------|
| Groq TTS fails | Browser Web Speech API |
| Groq STT fails | Text input mode |
| Mic denied | Text-only mode |
