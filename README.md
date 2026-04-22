# Mentora — Agentic AI Career Coach

> Your AI placement mentor that **thinks, remembers, and acts** — not just responds.

Mentora is a multi-agent AI system that acts as a personalized career coach for university students preparing for campus placements. Unlike chatbots that forget you after every conversation, Mentora maintains persistent memory, proactively follows up, and makes autonomous decisions about your preparation strategy.

---

## How It Works

```
Student uploads resume
        │
        ▼
Diagnostic Agent analyzes skills, gaps, strengths
        │
        ▼
Planner Agent creates personalized 2/4/8-week prep plan
        │
        ▼
   ┌────┴────┐
   │  DAILY  │  Student chats with AI Coach
   │  LOOP   │  → AI recalls past sessions (memory)
   │         │  → AI assigns tasks, adjusts plan
   │         │  → Mock interviews with adaptive difficulty
   └────┬────┘
        │
Accountability Agent follows up on missed tasks
        │
        ▼
If at risk → Escalation Agent alerts TPC with full context
```

**Memory Agent** runs after every interaction, extracting and storing facts so the AI never forgets.

---

## Major Layers

### 1. Agentic AI Layer (6 Agents)

| Agent | Role | Key Behavior |
|-------|------|-------------|
| **Diagnostic** | Analyzes resume, GitHub, LinkedIn, tests | Verifies skills via micro-assessments, doesn't trust self-reports |
| **Planner** | Creates 2/4/8-week prep plans | Maps every task to a specific company requirement |
| **Accountability** | Follows up, nudges, reprioritizes | Graduated nudges using behavioral science (social proof, loss aversion) |
| **Mock Interview** | Runs company-specific simulations | Adaptive difficulty, rubric-based feedback, STAR analysis |
| **Escalation** | TPC alerts, burnout detection | Evaluates severity before escalating, detects emotional patterns |
| **Memory** | Stores durable facts after every interaction | Extracts, deduplicates, embeds facts in vector DB |

### 2. Memory Layer (3 Tiers)

| Tier | Storage | Lifetime | Content |
|------|---------|----------|---------|
| Working | In-memory | Single request | Current conversation + tool results |
| Episodic | Redis | 7 days | Recent conversation summaries, hot facts |
| Semantic | pgvector | Permanent | All facts, skills, goals, struggles (vectorized) |

### 3. Data Layer

- **Supabase PostgreSQL**: Students, companies, tasks, plans, assessments, applications
- **Supabase pgvector**: Memory embeddings, company JD embeddings, conversation summaries
- **Supabase Auth**: Google OAuth + email/password
- **Supabase Storage**: Resume PDFs
- **Supabase Realtime**: Live notifications, agent status updates
- **Upstash Redis**: Rate limiting, caching, episodic memory

### 4. Frontend Layer

- **Student App**: Chat, dashboard, resume analysis, mock interviews, prep plan, company browser
- **TPC Admin**: Batch overview, at-risk alerts, skill heatmap, AI insights, natural language queries
- **Coach's Notebook**: Visible AI memory — what it knows, its strategy, key moments

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 15 (App Router, TypeScript) |
| UI | Tailwind CSS v4 + custom UI components + Recharts + Framer Motion |
| Database | Supabase (PostgreSQL + pgvector + Auth + Storage + Realtime) |
| Cache | Upstash Redis |
| AI Agents | Claude Sonnet 4 (Anthropic API) |
| AI Extraction | Claude Haiku 4.5 |
| AI SDK | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) |
| Embeddings | OpenAI text-embedding-3-small |
| ORM | Prisma |
| Hosting | Vercel |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register student/admin |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/callback/google` | Google OAuth callback |
| GET | `/api/auth/me` | Get current user |

### Chat (Streaming SSE)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Main coaching chat (streams via Vercel AI SDK) |
| POST | `/api/chat/mock` | Mock interview session |

### Resume
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/upload` | Upload resume PDF |
| POST | `/api/resume/analyze` | Trigger AI analysis |

### Student
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students/me` | Full student profile |
| PUT | `/api/students/me` | Update preferences/goals |
| GET | `/api/students/me/memory` | All AI-known facts |
| GET | `/api/students/me/tasks` | Tasks (pending/completed) |
| PATCH | `/api/students/me/tasks/:id` | Update task status |
| GET | `/api/students/me/plan` | Current prep plan |
| GET | `/api/students/me/assessments` | Assessment history |
| GET | `/api/students/me/readiness` | Readiness per company |
| GET | `/api/students/me/notifications` | Nudges/notifications |

### Companies
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/companies` | All companies with visit dates |
| GET | `/api/companies/:id` | Company detail + requirements |
| GET | `/api/companies/:id/match` | Match score for current student |
| GET | `/api/companies/upcoming` | Next 30 days |

### Admin (TPC)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Batch overview stats |
| GET | `/api/admin/students` | All students with risk scores |
| GET | `/api/admin/students/:id` | Student deep-dive |
| GET | `/api/admin/alerts` | TPC alerts from Escalation Agent |
| PATCH | `/api/admin/alerts/:id` | Acknowledge/resolve alert |
| GET | `/api/admin/insights` | AI-generated batch insights |
| POST | `/api/admin/query` | Natural language TPC query (RAG) |
| GET | `/api/admin/heatmap` | Skill-market alignment data |

### Agents (Internal/Cron)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/proactive` | Proactive check for all students (cron, every 6h) |
| POST | `/api/agents/recompute` | Recompute match scores & readiness (cron, daily) |

---

## Project Structure

```
mentora/
├── docs/BLUEPRINT.md          # Full technical blueprint
├── frontend/                  # Deployable Next.js app
│   ├── prisma/                # Single Prisma schema/config
│   └── src/
│       ├── app/               # Pages and API routes
│       ├── components/        # UI components
│       ├── lib/               # Supabase clients and shared utils
│       ├── server/            # Server-only agents, memory, prompts, seed logic
│       └── types/             # Shared TypeScript types
└── README.md                  # This file
```

---

## Setup

```bash
# Clone and install
git clone <repo-url> && cd mentora
npm install

# Environment
cp frontend/.env.example frontend/.env
# Fill in: Supabase, Anthropic, OpenAI, Upstash, Uploadthing keys

# Database
cd frontend && npx prisma db push
cd ..
npm run seed

# Run
npm run dev
```

---


# Mentora — Mock Interview: Implementation Plan (MVP)

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


## Bonus Features (from PS1)

- **Selection Probability Engine**: Transparent `P(selection)` with actionable levers
- **Company Intelligence Cards**: AI-analyzed JDs with interview patterns
- **Skill-Market Alignment Heatmap**: Batch skills vs. company demands
- **Smart Application Strategy**: Slot/tier-aware recommendations for Indian campus placements
- **TPC Admin Dashboard**: Batch readiness, at-risk flags, AI insights

---

## License

Built for HackAI 2026.
