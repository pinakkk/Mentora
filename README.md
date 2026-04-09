# PlaceAI — Agentic AI Career Coach

> Your AI placement mentor that **thinks, remembers, and acts** — not just responds.

PlaceAI is a multi-agent AI system that acts as a personalized career coach for university students preparing for campus placements. Unlike chatbots that forget you after every conversation, PlaceAI maintains persistent memory, proactively follows up, and makes autonomous decisions about your preparation strategy.

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
| AI Agents | Claude Sonnet 4.6 (Anthropic API) |
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
placeai/
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
git clone <repo-url> && cd placeai
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

## Bonus Features (from PS1)

- **Selection Probability Engine**: Transparent `P(selection)` with actionable levers
- **Company Intelligence Cards**: AI-analyzed JDs with interview patterns
- **Skill-Market Alignment Heatmap**: Batch skills vs. company demands
- **Smart Application Strategy**: Slot/tier-aware recommendations for Indian campus placements
- **TPC Admin Dashboard**: Batch readiness, at-risk flags, AI insights

---

## License

Built for HackAI 2026.
