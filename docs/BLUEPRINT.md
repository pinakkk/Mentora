# PlaceAI — Agentic AI Career Coach: Final Blueprint

> **Project**: PlaceAI — Your AI Placement Mentor  
> **Problem Statement**: PS2 — Agentic AI Career Coach (with PS1 hybrid features)  
> **Stack**: Next.js 15 + Supabase pgvector + Claude API + Vercel AI SDK  
> **Date**: April 2026

---

## Table of Contents

1. [Vision & Value Proposition](#1-vision--value-proposition)
2. [Feature Map — Core + Bonus](#2-feature-map)
3. [Agentic AI Architecture — 6 Agents](#3-agentic-ai-architecture)
4. [Technical Architecture & System Design](#4-technical-architecture)
5. [Memory & RAG Architecture](#5-memory--rag-architecture)
6. [Database Schema](#6-database-schema)
7. [API Endpoints](#7-api-endpoints)
8. [Frontend Architecture](#8-frontend-architecture)
9. [System Flow Diagrams](#9-system-flow-diagrams)
10. [Deployment Strategy](#10-deployment-strategy)
11. [Demo Script](#11-demo-script)

---

## 1. Vision & Value Proposition

### The Problem

Students receive **generic, stateless, reactive** career guidance. Every existing tool (VMock, Jobscan, ChatGPT) falls into one of two traps:

- **The "Tool" Trap**: Does ONE thing (resume scoring, speech analysis) but doesn't connect the dots.
- **The "Chatbot" Trap**: Answers questions but never INITIATES, never REMEMBERS, never DECIDES.

No tool acts like a **real mentor** who:
- Remembers your entire history
- Proactively checks on your progress
- Adjusts plans based on performance
- Holds you accountable
- Makes strategic decisions
- Escalates when you're in trouble

### The Solution: PlaceAI

An **Agentic AI Career Coach** powered by 6 specialized agents that collaborate through shared memory. The AI doesn't just respond — it **thinks, decides, and acts autonomously**.

### What Makes This Different

| Capability | ChatGPT | VMock | Big Interview | **PlaceAI** |
|-----------|---------|-------|---------------|-------------|
| Memory across sessions | None | None | None | **Full 3-layer memory** |
| Proactive outreach | None | None | None | **Autonomous nudges** |
| Multi-agent decisions | None | None | None | **6 specialized agents** |
| Personalized planning | None | None | None | **Adaptive 2/4/8-week plans** |
| Mock interviews | None | None | Fixed banks | **Adaptive, company-specific** |
| TPC integration | None | None | None | **Escalation + admin dashboard** |
| Accountability | None | None | None | **Follow-up + reprioritization** |

### Hackathon Scoring Alignment

| Criteria | Points | How PlaceAI Scores |
|----------|--------|--------------------|
| **Deployment** (20) | Working product | Deployed on Vercel, interactive, responsive |
| **Presentation** (20) | Storytelling | "Meet Priya" narrative — judges chat with AI live |
| **Agentic AI** (20) | Autonomous decisions | 6 agents that DECIDE and ACT, not just respond |
| **Placement Impact** (15) | Real improvement | Personalized guidance at scale, TPC integration |
| **Innovation** (25) | Creativity | Memory-first architecture, agent collaboration, visible AI reasoning |

---

## 2. Feature Map

### Core Features (PS2)

| # | Feature | Description | Agent(s) Involved |
|---|---------|-------------|-------------------|
| F1 | **Resume Deep Dive** | Upload resume -> AI extracts skills, gaps, strengths -> creates initial profile | Diagnostic Agent |
| F2 | **GitHub/LinkedIn Audit** | Cross-platform coherence analysis, activity scoring, skill verification | Diagnostic Agent |
| F3 | **Skill Gap Detection** | Verified skills (not self-reported) via micro-assessments | Diagnostic Agent |
| F4 | **Personalized Prep Plan** | 2-week / 4-week / 8-week plans mapped to target company requirements | Planner Agent |
| F5 | **Adaptive Mock Interviews** | Company-specific, difficulty-adapting, multi-round simulations (Technical, Behavioral, HR, System Design) | Mock Interview Agent |
| F6 | **Coaching Chat with Memory** | Multi-turn conversations where AI recalls past sessions, makes decisions, assigns tasks | All Agents via Orchestrator |
| F7 | **Proactive Nudges** | AI initiates contact: deadline reminders, opportunity alerts, re-engagement | Accountability Agent |
| F8 | **Task Tracking & Follow-up** | AI assigns tasks with deadlines, follows up on missed commitments, reprioritizes | Accountability Agent |
| F9 | **TPC Escalation** | When student is at risk (missed 3+ deadlines, declining scores), alert TPC with full context | Escalation Agent |
| F10 | **Coach's Notebook** | Visible memory panel — what AI knows, its assessment, its strategy, key moments | Memory Agent |
| F11 | **Burnout & Emotion Detection** | Detects frustration, disengagement, burnout from conversation patterns; adjusts approach | Escalation Agent |
| F12 | **Progress Dashboard** | Readiness score gauge, skill radar, task list, interview history, prep timeline | Planner Agent |

### Bonus Features (Borrowed from PS1)

| # | Feature | Description | Why It Adds Value |
|---|---------|-------------|-------------------|
| B1 | **Selection Probability Engine** | For each student-company pair: `P(selection) = f(skill_match, cgpa, projects, competition)` with actionable levers | Students see transparent, data-driven chances — not black-box scores |
| B2 | **Company Intelligence Cards** | AI-analyzed JDs: extracted requirements, interview patterns, culture notes, historical data | Coach gives company-specific advice, not generic tips |
| B3 | **TPC Admin Dashboard (Lite)** | Batch readiness overview, at-risk student flags, skill-gap heatmap, AI-generated insights | TPC gets value from day 1, can see impact |
| B4 | **Skill-Market Alignment View** | What skills are companies asking for vs. what the batch has — visual gap analysis | Students see WHY certain skills matter right now |
| B5 | **Smart Application Strategy** | "Apply to A, C, F. Skip B (low probability, burns dream slot). Wait for D if you don't get C." | Indian campus placement game-theory — slot/tier awareness |

---

## 3. Agentic AI Architecture

### 3.1 The 6 Agents

```
                        ┌──────────────────────────────────┐
                        │        AGENT ORCHESTRATOR         │
                        │                                    │
                        │  - Routes events to agents         │
                        │  - Manages hand-offs & priorities  │
                        │  - Resolves conflicts              │
                        │  - Maintains agent context         │
                        └──────────┬───────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
   ┌─────▼──────┐          ┌──────▼──────┐          ┌──────▼───────┐
   │ DIAGNOSTIC │          │   PLANNER   │          │ACCOUNTABILITY│
   │   AGENT    │          │    AGENT    │          │    AGENT     │
   │            │          │             │          │              │
   │ - Resume   │          │ - 2/4/8-wk  │          │ - Follow-up  │
   │ - GitHub   │  ──────► │   plans     │  ──────► │ - Reprioritize│
   │ - LinkedIn │          │ - Company-  │          │ - Reschedule │
   │ - Tests    │          │   mapped    │          │ - Nudge      │
   │ - Goals    │          │ - Time-boxed│          │ - Track tasks│
   └────────────┘          └─────────────┘          └──────────────┘
         │                         │                         │
         │                         │                         │
   ┌─────▼──────┐          ┌──────▼──────┐          ┌──────▼───────┐
   │   MOCK     │          │ ESCALATION  │          │   MEMORY     │
   │ INTERVIEW  │          │    AGENT    │          │    AGENT     │
   │   AGENT    │          │             │          │              │
   │            │          │ - TPC alert │          │ - Extract    │
   │ - Technical│          │ - Strategy  │          │   facts      │
   │ - Behavioral│         │   switch    │          │ - Deduplicate│
   │ - HR       │          │ - Burnout   │          │ - Store      │
   │ - System   │          │   detection │          │ - Recall     │
   │   Design   │          │ - Risk eval │          │ - Update     │
   │ - Rubric   │          │             │          │              │
   └────────────┘          └─────────────┘          └──────────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                        ┌──────────▼───────────────────────┐
                        │        SHARED MEMORY STORE        │
                        │                                    │
                        │  Supabase PostgreSQL + pgvector    │
                        │  - Episodic memory (conversations) │
                        │  - Semantic memory (facts/skills)  │
                        │  - Procedural memory (what works)  │
                        └────────────────────────────────────┘
```

### 3.2 Agent Specifications

#### Agent 1: Diagnostic Agent
**Purpose**: Comprehensive student profiling — the "intake specialist"

| Aspect | Detail |
|--------|--------|
| **Trigger** | Resume upload, GitHub/LinkedIn URL submission, onboarding, periodic reassessment |
| **Inputs** | Resume PDF, GitHub profile URL, LinkedIn data, self-assessment, micro-test results |
| **Outputs** | Student profile (skills with confidence levels), gap analysis, strengths, readiness score |
| **Tools** | `parse_resume`, `analyze_github`, `extract_skills`, `run_micro_assessment`, `compute_readiness`, `store_memory` |
| **Agentic Behavior** | Doesn't trust self-reported skills — verifies via micro-tests. Cross-references resume claims with GitHub activity. Flags inconsistencies. |
| **Hands Off To** | Planner Agent (with complete diagnostic profile) |

```
DIAGNOSTIC FLOW:

Resume Upload ──► Parse & Extract ──► Skill Extraction ──► Confidence Scoring
                                           │
GitHub URL ────► Repo Analysis ───► Tech Stack Detection ──┤
                                           │               │
LinkedIn ──────► Profile Scan ────► Experience Extract ────┤
                                                           │
                                                    ┌──────▼──────┐
                                                    │ UNIFIED     │
                                                    │ STUDENT     │
                                                    │ PROFILE     │
                                                    │             │
                                                    │ Skills: [   │
                                                    │  React: 8/10│
                                                    │  DSA: 4/10  │
                                                    │  SQL: 3/10  │
                                                    │ ]           │
                                                    │ Gaps: [...]  │
                                                    │ Strengths:[.]│
                                                    └──────┬──────┘
                                                           │
                                                    Hands off to
                                                    Planner Agent
```

#### Agent 2: Planner Agent
**Purpose**: Creates and maintains personalized preparation plans

| Aspect | Detail |
|--------|--------|
| **Trigger** | After Diagnostic completes, when target companies change, when timeline shifts, weekly review |
| **Inputs** | Student profile, target companies, available time, past performance, company visit dates |
| **Outputs** | Phased prep plan (2/4/8 week), daily/weekly tasks, milestone markers |
| **Tools** | `get_student_profile`, `get_target_companies`, `get_company_requirements`, `create_plan`, `create_task`, `compute_readiness`, `recall_memory` |
| **Agentic Behavior** | Adjusts plan based on actual completion rates (not estimates). If student completes tasks 2x slower than planned, stretches timeline and reprioritizes. Maps every task to a specific company requirement. |
| **Hands Off To** | Accountability Agent (plan + task schedule) |

**Plan Structure:**
```
PREP PLAN: 4-Week Sprint for Priya Sharma
Target: Wipro (April 15), TCS (April 18), Amazon (May 1)

WEEK 1: Foundation Repair
├── Day 1-2: Array & String patterns (Wipro focus — they test this)
├── Day 3-4: Tree traversals (weakness area, needed for all 3)
├── Day 5: SQL basics crash course (TCS requires, you scored 3/10)
├── Day 6: Resume update — add AWS project description
└── Day 7: Rest + review

WEEK 2: Company-Specific Prep
├── Day 8-9: Wipro mock interview (Technical + HR)
├── Day 10-11: Behavioral STAR stories (Amazon LP focus)
├── Day 12-13: System design basics (Amazon round 2)
└── Day 14: Wipro drive day — confidence prep

WEEK 3: Post-Wipro, TCS Sprint
├── Day 15: Debrief Wipro interview → adjust plan
├── Day 16-17: TCS-specific aptitude prep
├── Day 18-19: TCS mock interview (process-heavy)
└── Day 20-21: TCS drive + rest

WEEK 4: Amazon Deep Prep
├── Day 22-24: DSA medium-hard problems (Amazon level)
├── Day 25-26: System design deep dive
├── Day 27: Full Amazon mock (all rounds)
└── Day 28: Amazon drive day prep

Milestones:
✓ Week 1: Array/Tree proficiency → 6/10 (from 4/10)
✓ Week 2: Wipro interview complete
✓ Week 3: TCS interview complete
✓ Week 4: Amazon-ready
```

#### Agent 3: Accountability Agent
**Purpose**: Ensures students follow through on plans — the "strict but caring mentor"

| Aspect | Detail |
|--------|--------|
| **Trigger** | Task deadline passed, 3+ days of inactivity, plan milestone missed, periodic check (every 6 hours) |
| **Inputs** | Task completion status, login patterns, engagement metrics, plan progress |
| **Outputs** | Follow-up messages, reprioritized tasks, rescheduled deadlines, engagement nudges |
| **Tools** | `get_pending_tasks`, `check_activity`, `send_notification`, `reschedule_task`, `update_plan`, `recall_memory`, `store_memory` |
| **Agentic Behavior** | Doesn't just remind — adapts strategy. If student ignores 3 nudges, tries a different approach (micro-task, social proof, loss aversion). Tracks which nudge types work for each student. |
| **Hands Off To** | Escalation Agent (if student unresponsive after Level 2 intervention) |

**Nudge Strategy (Graduated):**
```
LEVEL 1 — Gentle Reminder (0-24h overdue)
  "Hey Priya, the 5 STAR practice questions were due yesterday.
   Wipro is in 4 days. Want to knock them out now? (15 min)"

LEVEL 2 — Micro-Task + Psychology (24-72h overdue)
  Uses behavioral science:
  ├── Social Proof: "73% of your branch has finished mock prep"
  ├── Loss Aversion: "Early applicants get 2x interview callbacks"
  ├── Micro-Commitment: "Just try 1 question — 5 minutes"
  └── Progress Viz: "You're 60% ready. One more session = 72%"

LEVEL 3 — Strategy Switch (72h+ overdue, pattern detected)
  "I notice you've been avoiding DSA practice for a week.
   Let's try a different approach — pair programming format
   instead of solo practice. Also flagging to your coordinator."
  → Hands off to Escalation Agent
```

#### Agent 4: Mock Interview Agent
**Purpose**: Conducts realistic, adaptive interview simulations

| Aspect | Detail |
|--------|--------|
| **Trigger** | Student requests mock, Planner schedules one, pre-drive preparation |
| **Inputs** | Student profile, target company, interview type, difficulty level, past performance |
| **Outputs** | Interview session, per-question scoring, rubric-based feedback, updated skill assessment |
| **Tools** | `get_company_interview_pattern`, `generate_question`, `evaluate_answer`, `compute_score`, `update_skill_assessment`, `store_memory` |
| **Agentic Behavior** | Adapts difficulty in real-time. If student aces easy questions, escalates. Tracks weak areas across sessions. Uses company-specific patterns from historical data. |

**Interview Modes:**
```
MODE 1: TECHNICAL (DSA)
├── Present problem → student codes/explains → evaluate
├── Adaptive: Easy (fundamentals) → Medium (application) → Hard (optimization)
├── Company-calibrated: TCS=medium, Amazon=hard, Wipro=medium
└── Scoring: Correctness (40%), Approach (30%), Optimization (20%), Communication (10%)

MODE 2: BEHAVIORAL (STAR)
├── Company-relevant questions (Amazon=LP heavy, TCS=team/process)
├── Evaluate: Situation clarity, Task specificity, Action detail, Result impact
├── Track: "You mentioned metrics in 3/5 answers — good. But STAR structure was weak in Q2."
└── Scoring: STAR Structure (30%), Relevance (25%), Specificity (25%), Impact (20%)

MODE 3: HR
├── Salary expectations, strengths/weaknesses, why this company
├── Evaluate: Communication, confidence, company knowledge, authenticity
└── Scoring: Clarity (30%), Confidence (25%), Preparation (25%), Authenticity (20%)

MODE 4: SYSTEM DESIGN
├── Design a system (URL shortener, chat app, etc.)
├── Evaluate: Requirements gathering, component design, scalability, trade-offs
├── Company-calibrated: Amazon=distributed systems, Google=scale
└── Scoring: Approach (30%), Architecture (30%), Trade-offs (20%), Communication (20%)
```

**Post-Interview Rubric Example:**
```
┌─────────────────────────────────────────────────┐
│          MOCK INTERVIEW DEBRIEF                  │
│          Company: Amazon | Type: Technical       │
├─────────────────────────────────────────────────┤
│ Overall Score: 6.5/10 (Previously: 5.0/10)  +1.5│
│                                                   │
│ Q1: Two Sum (Easy)        ✅ 9/10               │
│    → Clean solution, good edge case handling      │
│                                                   │
│ Q2: LRU Cache (Medium)    ⚠️ 5/10               │
│    → Correct approach but implementation buggy    │
│    → Missed: O(1) deletion requirement           │
│    → Recommendation: Practice linked list + map   │
│                                                   │
│ Q3: Merge K Lists (Hard)  ❌ 3/10               │
│    → Started brute force, couldn't optimize       │
│    → Missed: Heap-based approach                  │
│    → Recommendation: Study priority queues        │
│                                                   │
│ TRAJECTORY: ↑ Improving (5.0 → 6.5 in 2 weeks)  │
│ KEY INSIGHT: Strong fundamentals, weak on         │
│   advanced data structures (heaps, tries)         │
│ UPDATED PLAN: Adding heap problems to Week 3      │
└─────────────────────────────────────────────────┘
```

#### Agent 5: Escalation Agent
**Purpose**: Decides when human intervention is needed — the "safety net"

| Aspect | Detail |
|--------|--------|
| **Trigger** | Accountability Agent Level 3 reached, burnout signals detected, declining trajectory for 2+ weeks, student requests human help |
| **Inputs** | Student risk profile, engagement history, emotional signals, intervention history |
| **Outputs** | TPC alerts with full context, strategy switch recommendations, burnout interventions |
| **Tools** | `compute_risk_score`, `detect_emotional_state`, `get_intervention_history`, `alert_tpc`, `switch_strategy`, `recall_memory` |
| **Agentic Behavior** | Doesn't escalate everything — evaluates severity. Minor dips get strategy adjustments. Only true at-risk cases reach TPC. Detects burnout from conversation patterns (shortened responses, negative language, long gaps). |

**Escalation Decision Tree:**
```
Student signal detected
│
├── Declining scores (2+ weeks)?
│   ├── Still engaged? → Switch strategy (Planner Agent)
│   └── Disengaged? → Check engagement level
│       ├── Partial engagement? → Accountability Agent Level 2
│       └── Ghost (0 activity)? → TPC Alert (Level 3)
│
├── Emotional signals?
│   ├── Frustration? → Reduce difficulty, switch approach, encourage
│   ├── Burnout? → Suggest break, show progress, celebrate wins
│   └── Anxiety (avoiding mocks)? → Confidence-building micro-steps
│
├── Missed 3+ deadlines?
│   ├── Has upcoming drives? → URGENT TPC alert
│   └── No immediate drives? → Re-plan with extended timeline
│
└── Student explicitly asks for help?
    └── Immediate TPC notification + warm handoff
```

**TPC Alert Format:**
```
┌─────────────────────────────────────────────────┐
│ 🔴 TPC ALERT — INTERVENTION NEEDED              │
├─────────────────────────────────────────────────┤
│ Student: Ankit Verma (CSE, 8.1 CGPA)            │
│ Risk Level: HIGH                                  │
│ Pattern: GHOST (active → silent over 12 days)    │
│                                                   │
│ Context:                                          │
│ - Was preparing for Wipro (match: 78%)           │
│ - Completed 60% of prep plan, then stopped       │
│ - Skipped 3 scheduled mock interviews            │
│ - Last login: 12 days ago                        │
│ - AI nudges sent: 3 (0 responses)               │
│                                                   │
│ Possible Cause:                                   │
│ - Avoidance pattern detected (skipped mocks)     │
│ - Last conversation showed frustration with DP   │
│                                                   │
│ Recommended Intervention:                         │
│ - Direct outreach by placement coordinator       │
│ - Pair with Priya (similar profile, placed TCS)  │
│ - Reduce plan scope: focus only on Wipro         │
│                                                   │
│ [Contact Student] [Assign Mentor] [View Profile] │
└─────────────────────────────────────────────────┘
```

#### Agent 6: Memory Agent
**Purpose**: Maintains the AI's "brain" — extracts, stores, deduplicates, and recalls facts

| Aspect | Detail |
|--------|--------|
| **Trigger** | After every conversation turn (async), after assessments, after plan changes |
| **Inputs** | Conversation messages, assessment results, plan updates, behavioral signals |
| **Outputs** | Extracted facts, updated student profile, conversation summaries |
| **Tools** | `extract_facts`, `embed_text`, `store_fact`, `deduplicate`, `summarize_conversation`, `update_profile` |
| **Agentic Behavior** | Runs AFTER every interaction (async, non-blocking). Decides what's worth remembering vs. noise. Deduplicates (doesn't store "likes React" 50 times). Updates existing facts when new info contradicts old info. |

### 3.3 Agent Orchestration Flow

```
USER MESSAGE ARRIVES
│
▼
┌──────────────────────────┐
│    AGENT ORCHESTRATOR     │
│                           │
│  1. Classify intent       │
│  2. Load relevant memory  │
│  3. Select primary agent  │
│  4. Inject context        │
│  5. Execute agent loop    │
│  6. Handle hand-offs      │
│  7. Return response       │
│  8. Async: Memory Agent   │
└──────────┬───────────────┘
           │
     Intent Classification
           │
     ┌─────┼──────┬────────┬───────────┬──────────┐
     │     │      │        │           │          │
     ▼     ▼      ▼        ▼           ▼          ▼
  Resume  Plan  "What   "Mock me"  "I'm      "What does
  upload  query  should            stressed"  AI know
                 I do?"                       about me?"
     │     │      │        │           │          │
     ▼     ▼      ▼        ▼           ▼          ▼
  Diag.  Planner Coach   Mock Int.  Escalation  Memory
  Agent  Agent   (Multi)  Agent     Agent       Agent
```

### 3.4 Agent Hand-Off Protocol

```
EXAMPLE: Complete Onboarding Flow

1. Student uploads resume
   → Orchestrator routes to DIAGNOSTIC AGENT
   
2. Diagnostic Agent:
   - Parses resume, extracts skills
   - Identifies gaps and strengths
   - Computes initial readiness score
   - STORES facts via Memory Agent (async)
   - HANDS OFF to Planner Agent with diagnostic report

3. Planner Agent:
   - Receives diagnostic profile
   - Fetches target companies from student preferences
   - Creates 4-week prep plan with daily tasks
   - HANDS OFF to Accountability Agent (registers task schedule)

4. Accountability Agent:
   - Registers all tasks with deadlines
   - Schedules first check-in for tomorrow
   - Sets up proactive loop for this student

5. Response streams back to student:
   "I've analyzed your resume. Here's what I found: [analysis]
    Based on your targets (Wipro, TCS, Amazon), here's your
    4-week plan: [plan]. I'll check in tomorrow to see how
    Day 1 went. Let's do this!"

6. Memory Agent (async, after response):
   - Extracts: goals, skills, struggle areas, preferences
   - Stores: 8 facts with embeddings in pgvector
   - Summarizes: conversation for episodic memory
```

---

## 4. Technical Architecture & System Design

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                     │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────────┐ │
│  │ Student App  │  │  TPC Admin    │  │  Chat Interface          │ │
│  │              │  │  Dashboard    │  │                          │ │
│  │ - Dashboard  │  │              │  │  - Streaming responses   │ │
│  │ - Profile    │  │ - Batch view │  │  - Tool call display     │ │
│  │ - Plan view  │  │ - At-risk    │  │  - Memory panel (side)   │ │
│  │ - Mock prep  │  │ - Alerts     │  │  - Task cards inline     │ │
│  │ - Resume     │  │ - Insights   │  │  - Interview mode        │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────────┘ │
│         └─────────────────┼──────────────────────┘                 │
│                           │  Next.js 15 (React Server Components)   │
└───────────────────────────┼─────────────────────────────────────────┘
                            │
                            │ HTTPS / WebSocket (Supabase Realtime)
                            │
┌───────────────────────────┼─────────────────────────────────────────┐
│                    API LAYER (Next.js Route Handlers)                │
│                                                                     │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │ /api/chat   │ │ /api/resume  │ │ /api/mock  │ │ /api/admin   │ │
│  │             │ │ /analyze     │ │            │ │ /insights    │ │
│  │ Streaming   │ │              │ │ Interview  │ │              │ │
│  │ chat with   │ │ Upload +     │ │ session    │ │ TPC queries  │ │
│  │ agent loop  │ │ parse + AI   │ │ management │ │ + analytics  │ │
│  └──────┬──────┘ └──────┬───────┘ └─────┬──────┘ └──────┬───────┘ │
│         └───────────────┼───────────────┼───────────────┘          │
│                         │               │                           │
│              ┌──────────▼───────────────▼────────────┐             │
│              │       AGENT ORCHESTRATOR               │             │
│              │                                        │             │
│              │  ┌────────────┐  ┌──────────────────┐ │             │
│              │  │ Diagnostic │  │ Planner Agent    │ │             │
│              │  │ Agent      │  │                  │ │             │
│              │  └────────────┘  └──────────────────┘ │             │
│              │  ┌────────────┐  ┌──────────────────┐ │             │
│              │  │ Account-   │  │ Mock Interview   │ │             │
│              │  │ ability    │  │ Agent            │ │             │
│              │  └────────────┘  └──────────────────┘ │             │
│              │  ┌────────────┐  ┌──────────────────┐ │             │
│              │  │ Escalation │  │ Memory Agent     │ │             │
│              │  │ Agent      │  │                  │ │             │
│              │  └────────────┘  └──────────────────┘ │             │
│              └───────────────────┬────────────────────┘             │
│                                  │                                   │
│                    Claude API (Sonnet 4.6 + Haiku 4.5)              │
│                    Vercel AI SDK (streaming + tool calling)          │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │
┌──────────────────────────────────┼──────────────────────────────────┐
│                         DATA LAYER                                   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    SUPABASE (All-in-One)                       │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐ │ │
│  │  │ PostgreSQL   │  │ pgvector     │  │ Auth (GoTrue)       │ │ │
│  │  │              │  │              │  │                     │ │ │
│  │  │ - Students   │  │ - Memory     │  │ - Google OAuth      │ │ │
│  │  │ - Companies  │  │   embeddings │  │ - Email/password    │ │ │
│  │  │ - Tasks      │  │ - Resume     │  │ - JWT tokens        │ │ │
│  │  │ - Plans      │  │   embeddings │  │ - Row Level Security│ │ │
│  │  │ - Interviews │  │ - Company JD │  │                     │ │ │
│  │  │ - Applications│ │   embeddings │  │                     │ │ │
│  │  │ - Nudges     │  │              │  │                     │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘ │ │
│  │                                                                │ │
│  │  ┌──────────────┐  ┌──────────────────────────────────────┐   │ │
│  │  │ Storage      │  │ Realtime (WebSocket)                 │   │ │
│  │  │              │  │                                      │   │ │
│  │  │ - Resumes    │  │ - Live notifications                 │   │ │
│  │  │ - Avatars    │  │ - Agent status updates               │   │ │
│  │  │              │  │ - TPC alerts                         │   │ │
│  │  └──────────────┘  └──────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────┐                                     │
│  │ Upstash Redis             │                                     │
│  │ - Rate limiting           │                                     │
│  │ - Session cache           │                                     │
│  │ - Proactive job queue     │                                     │
│  │ - Agent response cache    │                                     │
│  └───────────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | Full-stack: SSR + API routes + middleware |
| **Language** | TypeScript | Type safety across full stack |
| **Styling** | Tailwind CSS v4 | Rapid UI development |
| **Components** | Custom local UI components | App-owned components styled directly in the codebase |
| **Charts** | Recharts | Radar charts, line charts, progress visualizations |
| **Animations** | Framer Motion | Page transitions, typing indicators, chart animations |
| **Icons** | Lucide React | Consistent icon set |
| **Database** | Supabase (PostgreSQL) | Relational data, auth, storage, realtime |
| **Vector DB** | Supabase pgvector | Semantic memory search, RAG |
| **Cache** | Upstash Redis | Rate limiting, caching, job queue |
| **Auth** | Supabase Auth (GoTrue) | Google OAuth + email/password |
| **AI LLM** | Claude Sonnet 4.6 | Agent reasoning, coaching, interviews |
| **AI Extraction** | Claude Haiku 4.5 | Cheap/fast fact extraction, summarization |
| **Embeddings** | OpenAI text-embedding-3-small | Text-to-vector for memory & RAG |
| **AI SDK** | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) | Streaming, tool calling, useChat hook |
| **ORM** | Prisma | Type-safe database access, migrations |
| **File Upload** | Uploadthing | Resume PDF uploads |
| **PDF Parse** | pdf-parse | Extract text from resume PDFs |
| **Validation** | Zod | Runtime type checking for API inputs |
| **Hosting** | Vercel | Deploy with `vercel --prod` |

### 4.3 Why Custom Agents (Not LangChain/CrewAI)

1. **Debuggability**: Every line is yours. At 2 AM when something breaks, you know exactly where.
2. **Speed**: Less dependencies, less config, less boilerplate. Agent loop is ~150 lines.
3. **Control**: You decide how agents communicate, hand off, share memory.
4. **Demo clarity**: "How does it work?" → You explain every line, not "LangChain handles that."
5. **Vercel AI SDK**: Handles the hard parts (streaming, tool calling) while you keep agent logic control.

---

## 5. Memory & RAG Architecture

### 5.1 Three-Layer Memory System

```
┌───────────────────────────────────────────────────────────┐
│                    MEMORY ARCHITECTURE                      │
├───────────────────────────────────────────────────────────┤
│                                                             │
│  LAYER 1: WORKING MEMORY (Ephemeral — per request)         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - Current conversation messages                      │   │
│  │ - Active tool call results                           │   │
│  │ - Current session state                              │   │
│  │ - Injected context from Layer 2 & 3                  │   │
│  │ Storage: In-memory (request context)                 │   │
│  │ Lifetime: Single request                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  LAYER 2: EPISODIC MEMORY (Recent — Redis cached)          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - Last 5 conversation summaries                      │   │
│  │ - Recently extracted facts (hot cache)               │   │
│  │ - Recent task completions/failures                   │   │
│  │ - Last interaction timestamp & emotional state       │   │
│  │ Storage: Upstash Redis (TTL: 7 days)                │   │
│  │ Lifetime: 7 days (refreshed on access)              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  LAYER 3: SEMANTIC MEMORY (Long-term — pgvector)           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ - All extracted facts (vectorized)                   │   │
│  │   ├── Goals: "Wants to work at product companies"   │   │
│  │   ├── Skills: "Strong React, weak SQL, no DSA"      │   │
│  │   ├── Struggles: "Fails DP problems consistently"   │   │
│  │   ├── Milestones: "Completed system design module"  │   │
│  │   ├── Preferences: "Morning person, visual learner" │   │
│  │   └── Behavioral: "Responds to loss-aversion nudges"│   │
│  │ - Conversation summaries (vectorized)                │   │
│  │ - Assessment results & progression                   │   │
│  │ - Company knowledge base (JDs, patterns)             │   │
│  │ Storage: Supabase pgvector                           │   │
│  │ Lifetime: Permanent (with deduplication & updates)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└───────────────────────────────────────────────────────────┘
```

### 5.2 Memory Pipeline — How Facts Get Stored

```
AFTER EVERY CONVERSATION TURN (async, non-blocking):

Student message + Agent response
          │
          ▼
┌──────────────────────────────┐
│  FACT EXTRACTION              │
│  (Claude Haiku — cheap/fast)  │
│                               │
│  Prompt: "Extract key facts   │
│  about the student. Return    │
│  JSON: {fact, category,       │
│  importance}"                 │
│                               │
│  Categories:                  │
│  goal, skill, struggle,       │
│  milestone, preference,       │
│  behavioral                   │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  DEDUPLICATION                │
│                               │
│  For each extracted fact:     │
│  1. Generate embedding        │
│  2. Search pgvector for       │
│     similar facts (>0.9)      │
│  3. If exists: UPDATE         │
│     (merge + new timestamp)   │
│  4. If new: INSERT            │
│     (embed + store)           │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  CONVERSATION SUMMARY         │
│  (if > 10 messages)           │
│                               │
│  Prompt: "Summarize in 2-3   │
│  sentences. Focus on:         │
│  decisions, tasks assigned,   │
│  key revelations."            │
│                               │
│  Store summary with embedding │
│  in episodic memory           │
└──────────────────────────────┘
```

### 5.3 Memory Recall — How Context Gets Injected

```
BEFORE EVERY AGENT CALL:

1. Embed current user message
2. Search pgvector for top-10 relevant facts
3. Fetch from Redis: last 3 conversation summaries
4. Fetch from Postgres: student profile, pending tasks, upcoming deadlines
5. Inject everything as system context:

┌─────────────────────────────────────────────────────────┐
│ SYSTEM PROMPT = base_agent_prompt + """                   │
│                                                           │
│ ## What You Know About This Student                       │
│                                                           │
│ ### Core Profile                                          │
│ Name: Priya Sharma | Dept: CSE | CGPA: 8.4              │
│ Target: Product companies (Bangalore preferred)           │
│                                                           │
│ ### Key Facts (most relevant first)                       │
│ - [goal] Targets Google, Microsoft, Amazon               │
│ - [skill] Strong React/Node.js, building full-stack     │
│ - [struggle] Consistently fails DP — 3 mock failures     │
│ - [milestone] Completed system design module (Mar 20)    │
│ - [preference] Visual learner, morning study sessions     │
│ - [behavioral] Responds well to micro-commitments        │
│                                                           │
│ ### Recent History                                        │
│ - 2 days ago: Discussed Wipro prep. Assigned STAR Qs.    │
│ - 4 days ago: Reviewed resume. Adding AWS project.       │
│ - 1 week ago: Mock interview — 6/10 tech, 8/10 comm.    │
│                                                           │
│ ### Pending Tasks                                         │
│ - [ ] 5 STAR practice questions (due tomorrow)           │
│ - [ ] Add AWS project to resume (due in 3 days)         │
│ - [x] System design module (completed Mar 20)           │
│                                                           │
│ ### Upcoming Deadlines                                    │
│ - Wipro campus drive: April 15 (6 days) — match: 74%    │
│ - TCS application deadline: April 18 — match: 82%       │
│ """                                                       │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Company Knowledge RAG

```
COMPANY KNOWLEDGE BASE (vectorized in pgvector):

Sources:
├── Job descriptions (AI-extracted requirements, skills, levels)
├── Past interview patterns (from debriefs, historical data)
├── Company culture notes (TPC input, alumni feedback)
└── Historical placement data (who got placed, what profile)

Usage Example:
├── Student asks: "What should I prepare for TCS?"
│   → Embed query → Search company vectors → Retrieve TCS-specific data
│   → Agent gives: "TCS Round 1 tests arrays+strings. Round 2 is behavioral
│     with heavy team-oriented questions. Based on last year's data, students
│     who emphasized project metrics in STAR answers had 2.8x selection rate."
│
└── TPC asks: "Who matches the new Amazon JD?"
    → Embed JD → Search student profile vectors → Rank by similarity
    → Return: "Top 15 matches with score breakdowns"
```

---

## 6. Database Schema

### 6.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Student    │     │   Company    │     │  CompanyRequirement│
│──────────────│     │──────────────│     │──────────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)          │
│ name         │     │ name         │     │ company_id (FK)  │
│ email        │     │ description  │     │ skill            │
│ department   │     │ visit_date   │     │ priority         │
│ cgpa         │     │ deadline     │     │ min_level        │
│ year         │     │ tier (dream/ │     │ embedding (vector)│
│ resume_url   │     │  regular/    │     └──────────────────┘
│ github_url   │     │  mass)       │
│ linkedin_url │     │ roles        │     ┌──────────────────┐
│ preferences  │     │ jd_text      │     │   Application    │
│ readiness    │     │ interview_   │     │──────────────────│
│ role (student│     │  pattern     │     │ id (PK)          │
│  /tpc_admin) │     │ historical   │     │ student_id (FK)  │
│ onboarded    │     │  data        │     │ company_id (FK)  │
│ created_at   │     │ jd_embedding │     │ match_score      │
│ updated_at   │     │  (vector)    │     │ score_breakdown  │
└──────┬───────┘     └──────────────┘     │ status (applied/ │
       │                                   │  shortlisted/    │
       │                                   │  interview/      │
       │                                   │  offer/rejected) │
       │                                   │ applied_at       │
       │                                   └──────────────────┘
       │
       │  1:many
       │
       ├──────────────────┐
       │                  │
┌──────▼───────┐   ┌──────▼───────┐
│  MemoryFact  │   │    Task      │
│──────────────│   │──────────────│
│ id (PK)      │   │ id (PK)      │
│ student_id   │   │ student_id   │
│ fact         │   │ title        │
│ category     │   │ description  │
│ (goal/skill/ │   │ deadline     │
│  struggle/   │   │ priority     │
│  milestone/  │   │ (low/med/    │
│  preference/ │   │  high/urgent)│
│  behavioral) │   │ category     │
│ importance   │   │ (dsa/project/│
│ embedding    │   │  resume/mock/│
│ (vector)     │   │  behavioral/ │
│ created_at   │   │  aptitude)   │
│ updated_at   │   │ status       │
└──────────────┘   │ (pending/    │
                   │  in_progress/│
       ├───────────│  completed)  │
       │           │ created_at   │
       │           └──────────────┘
       │
┌──────▼───────┐   ┌──────────────┐
│  PrepPlan    │   │  Assessment  │
│──────────────│   │──────────────│
│ id (PK)      │   │ id (PK)      │
│ student_id   │   │ student_id   │
│ target_      │   │ type         │
│  companies   │   │ (technical/  │
│ duration_    │   │  behavioral/ │
│  weeks       │   │  hr/system)  │
│ phases (JSON)│   │ company_id   │
│ current_phase│   │ questions    │
│ status       │   │ answers      │
│ created_at   │   │ scores (JSON)│
│ updated_at   │   │ feedback     │
└──────────────┘   │ overall_score│
                   │ created_at   │
                   └──────────────┘

┌──────────────┐   ┌──────────────┐
│ Conversation │   │    Nudge     │
│──────────────│   │──────────────│
│ id (PK)      │   │ id (PK)      │
│ student_id   │   │ student_id   │
│ messages     │   │ content      │
│ (JSON)       │   │ type (remind/│
│ summary      │   │  opportunity/│
│ summary_     │   │  re_engage/  │
│  embedding   │   │  celebrate)  │
│  (vector)    │   │ urgency      │
│ agent_type   │   │ status (sent/│
│ created_at   │   │  read/acted) │
└──────────────┘   │ sent_at      │
                   └──────────────┘

┌──────────────────┐
│  TPCAlert        │
│──────────────────│
│ id (PK)          │
│ student_id (FK)  │
│ severity         │
│ pattern          │
│ context (JSON)   │
│ recommendation   │
│ status (new/     │
│  acknowledged/   │
│  resolved)       │
│ created_at       │
└──────────────────┘
```

### 6.2 pgvector Tables

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Memory facts with vector embeddings
CREATE TABLE memory_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  fact TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('goal','skill','struggle','milestone','preference','behavioral')),
  importance TEXT NOT NULL CHECK (importance IN ('high','medium','low')),
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Similarity search function
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_student_id uuid
)
RETURNS TABLE (
  id uuid,
  fact text,
  category text,
  importance text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mf.id,
    mf.fact,
    mf.category,
    mf.importance,
    1 - (mf.embedding <=> query_embedding) AS similarity
  FROM memory_facts mf
  WHERE mf.student_id = filter_student_id
    AND 1 - (mf.embedding <=> query_embedding) > match_threshold
  ORDER BY mf.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Company JD embeddings for RAG
CREATE TABLE company_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,  -- 'jd', 'interview_pattern', 'culture'
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation summary embeddings
CREATE TABLE conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  conversation_id UUID REFERENCES conversations(id),
  summary TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW indexes for fast similarity search
CREATE INDEX ON memory_facts USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON company_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON conversation_summaries USING hnsw (embedding vector_cosine_ops);
```

---

## 7. API Endpoints

### 7.1 Core API Routes

```
BASE URL: /api

AUTH
├── POST   /api/auth/signup           — Register new student/admin
├── POST   /api/auth/login            — Login (email+password or OAuth)
├── POST   /api/auth/callback/google  — Google OAuth callback
└── GET    /api/auth/me               — Get current user profile

CHAT (Streaming)
├── POST   /api/chat                  — Main coaching chat (streaming SSE)
│          Body: { message, conversationId? }
│          Returns: StreamingTextResponse (Vercel AI SDK)
│          Internally: Orchestrator → Agent selection → Tool calling → Stream
│
└── POST   /api/chat/mock             — Mock interview mode (streaming SSE)
           Body: { companyId, interviewType, difficulty? }
           Returns: StreamingTextResponse

RESUME
├── POST   /api/resume/upload         — Upload resume PDF (Uploadthing)
│          Body: FormData (file)
│          Returns: { url, fileKey }
│
└── POST   /api/resume/analyze        — Trigger AI analysis of uploaded resume
           Body: { resumeUrl }
           Returns: { skills[], gaps[], strengths[], readinessScore }

STUDENT
├── GET    /api/students/me           — Get current student full profile
├── PUT    /api/students/me           — Update student preferences/goals
├── GET    /api/students/me/memory    — Get all AI-known facts about student
├── GET    /api/students/me/tasks     — Get all tasks (pending/completed)
├── PATCH  /api/students/me/tasks/:id — Update task status
├── GET    /api/students/me/plan      — Get current prep plan
├── GET    /api/students/me/assessments — Get assessment history
├── GET    /api/students/me/readiness — Get readiness scores per company
└── GET    /api/students/me/notifications — Get nudges/notifications

COMPANIES
├── GET    /api/companies             — List all companies (with visit dates)
├── GET    /api/companies/:id         — Get company detail + requirements
├── GET    /api/companies/:id/match   — Get match score for current student
└── GET    /api/companies/upcoming    — Companies visiting in next 30 days

ADMIN (TPC)
├── GET    /api/admin/dashboard       — Batch overview stats
├── GET    /api/admin/students        — All students with risk scores
├── GET    /api/admin/students/:id    — Individual student deep-dive
├── GET    /api/admin/alerts          — TPC alerts from Escalation Agent
├── PATCH  /api/admin/alerts/:id      — Acknowledge/resolve alert
├── GET    /api/admin/insights        — AI-generated batch insights
├── POST   /api/admin/query           — Natural language TPC query (RAG)
│          Body: { query: "Which students need DSA help?" }
│          Returns: { answer, students[], data }
│
└── GET    /api/admin/heatmap         — Skill-market alignment data

AGENTS (Internal / Cron)
├── POST   /api/agents/proactive      — Trigger proactive check for all students
│          (Called by cron job every 6 hours)
│
└── POST   /api/agents/recompute      — Recompute match scores & readiness
           (Called by cron job daily)
```

### 7.2 WebSocket Events (Supabase Realtime)

```
CHANNELS:
├── student:{studentId}
│   ├── notification:new     — New nudge/notification
│   ├── task:created         — AI assigned new task
│   ├── task:updated         — Task status changed
│   └── plan:updated         — Prep plan modified
│
├── admin:alerts
│   ├── alert:new            — New TPC alert from Escalation Agent
│   └── alert:updated        — Alert status changed
│
└── admin:insights
    └── insight:new          — New AI-generated batch insight
```

---

## 8. Frontend Architecture

### 8.1 Route Structure

```
src/app/
├── (auth)/
│   └── login/page.tsx              — Login page (Google OAuth + email)
│
├── (app)/                          — Protected routes (require auth)
│   ├── layout.tsx                  — App shell: sidebar + header + main
│   │
│   ├── chat/page.tsx               — Main coaching chat interface
│   │   └── Components:
│   │       ├── ChatInterface       — Message list + input (useChat hook)
│   │       ├── MessageBubble       — Individual message (user/AI)
│   │       ├── ToolCallDisplay     — Inline agent action cards
│   │       ├── TypingIndicator     — Animated "AI is thinking..."
│   │       └── MemorySidebar       — What AI knows (collapsible)
│   │
│   ├── dashboard/page.tsx          — Progress dashboard
│   │   └── Components:
│   │       ├── ReadinessGauge      — Animated circular score
│   │       ├── SkillRadar          — Recharts radar (skills vs company)
│   │       ├── TaskList            — AI-assigned tasks with deadlines
│   │       ├── PrepTimeline        — Plan phases + milestones
│   │       ├── InterviewHistory    — Mock scores over time (line chart)
│   │       ├── CompanyCards        — Match scores for target companies
│   │       └── StatsCards          — Key metrics (tasks done, score, etc.)
│   │
│   ├── resume/page.tsx             — Resume upload + analysis
│   │   └── Components:
│   │       ├── UploadZone          — Drag-and-drop PDF upload
│   │       ├── AnalysisView        — Parsed resume with AI analysis
│   │       ├── SkillTags           — Color-coded proficiency tags
│   │       └── GapAnalysis         — Visual gap display
│   │
│   ├── mock/page.tsx               — Mock interview interface
│   │   └── Components:
│   │       ├── InterviewSetup      — Choose company + type + difficulty
│   │       ├── InterviewChat       — Question-answer flow
│   │       ├── Timer               — Per-question countdown
│   │       ├── HintSystem          — Progressive hints
│   │       └── DebriefView         — Post-interview rubric + scores
│   │
│   ├── plan/page.tsx               — Preparation plan view
│   │   └── Components:
│   │       ├── PlanOverview        — Phases with progress bars
│   │       ├── WeekView            — Daily tasks for current week
│   │       └── MilestoneTracker    — Completed vs. upcoming milestones
│   │
│   ├── companies/page.tsx          — Company browser
│   │   └── Components:
│   │       ├── CompanyList         — Searchable company list
│   │       ├── CompanyDetail       — Requirements, match, interview pattern
│   │       └── ProbabilityEngine   — Selection chance with actionable levers
│   │
│   ├── memory/page.tsx             — Coach's Notebook (visible AI memory)
│   │   └── Components:
│   │       ├── FactsList           — Categorized facts (goals/skills/etc.)
│   │       ├── AIAssessment        — Current AI evaluation of student
│   │       ├── StrategyView        — AI's current strategy + reasoning
│   │       └── KeyMoments          — Timeline of breakthroughs/setbacks
│   │
│   └── admin/                      — TPC Admin routes
│       ├── page.tsx                — Admin dashboard
│       │   └── Components:
│       │       ├── BatchOverview   — Stats cards + trend indicators
│       │       ├── RiskDistribution— Pie/donut chart
│       │       ├── SkillHeatmap    — Skills vs companies gap heatmap
│       │       ├── AlertsPanel     — TPC alerts from Escalation Agent
│       │       └── InsightsPanel   — AI-generated batch insights
│       │
│       └── students/
│           └── [id]/page.tsx       — Individual student deep-dive
│
├── api/                            — API route handlers
│   ├── chat/route.ts
│   ├── chat/mock/route.ts
│   ├── resume/upload/route.ts
│   ├── resume/analyze/route.ts
│   ├── students/...
│   ├── companies/...
│   ├── admin/...
│   └── agents/proactive/route.ts
│
├── layout.tsx                      — Root layout (fonts, theme provider)
└── page.tsx                        — Landing page (marketing/login redirect)
```

### 8.2 Key UI Components Design

**Chat Interface (Primary Interaction Point):**
```
┌─────────────────────────────────────────────────────────────┐
│  PlaceAI Coach                           [Memory] [Profile] │
├────────────────────────────────┬────────────────────────────┤
│                                │  COACH'S NOTEBOOK          │
│  ┌─────────────────────────┐   │                            │
│  │ 🤖 Coach                │   │  What I Know About You:   │
│  │ Based on your mock      │   │  ├── 🎯 Goals             │
│  │ yesterday (6/10) and    │   │  │   Product companies     │
│  │ Wipro visiting Thursday,│   │  │   Bangalore preferred   │
│  │ I'm adjusting your plan:│   │  ├── 💪 Strengths         │
│  │                         │   │  │   React (8/10)          │
│  │ ┌─────────────────────┐ │   │  │   Communication (8/10)  │
│  │ │ 📋 NEW TASK         │ │   │  ├── ⚠️ Struggles         │
│  │ │ Tree Traversals     │ │   │  │   DP problems (3/10)   │
│  │ │ Practice 5 problems │ │   │  │   SQL basics (3/10)    │
│  │ │ Due: Tomorrow 6 PM  │ │   │  └── 📊 Readiness: 64%    │
│  │ │ Priority: HIGH      │ │   │                            │
│  │ └─────────────────────┘ │   │  Current Strategy:         │
│  └─────────────────────────┘   │  "Focus on tree problems   │
│                                │   for Wipro, then pivot    │
│  ┌─────────────────────────┐   │   to SQL for TCS."        │
│  │ 👤 You                  │   │                            │
│  │ But I wanted to         │   │  Upcoming:                 │
│  │ practice arrays today   │   │  📅 Wipro — 6 days (74%)  │
│  └─────────────────────────┘   │  📅 TCS — 9 days (82%)    │
│                                │  📅 Amazon — 22 days (51%) │
│  ┌─────────────────────────┐   │                            │
│  │ 🤖 Coach                │   │                            │
│  │ I hear you, but here's  │   │                            │
│  │ the data: Wipro tested  │   │                            │
│  │ trees in 4 of last 5    │   │                            │
│  │ campus drives. Arrays   │   │                            │
│  │ only appeared once.     │   │                            │
│  │ Trust me on this one.   │   │                            │
│  └─────────────────────────┘   │                            │
│                                │                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Type a message...                           [Send ➤] │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────────┴────────────────────────────┘
```

**TPC Admin Dashboard:**
```
┌──────────────────────────────────────────────────────────────┐
│  PlaceAI Admin — TPC Dashboard                    [Query AI] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Students │  │ Placed   │  │ At-Risk  │  │ Avg PRS  │   │
│  │   247    │  │  28%     │  │   34     │  │  62/100  │   │
│  │          │  │  ↑ 3%    │  │  ↑ 5     │  │  ↓ 2     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌───────────────────────┐  ┌────────────────────────────┐  │
│  │ SKILL-MARKET HEATMAP  │  │ RISK DISTRIBUTION          │  │
│  │                       │  │                            │  │
│  │     Py  JS DSA SD SQL │  │  Ready ████████░░ 20%     │  │
│  │ TCS ■■  ■  ■■  ·  ■■ │  │  Needs ██████████░ 30%    │  │
│  │ Wipro■  ■■ ■   ·  ■  │  │  Risk  ████████░░░ 25%    │  │
│  │ Amzn ■  ·  ■■■ ■■ ·  │  │  Crit  █████░░░░░ 15%    │  │
│  │ MSFT ·  ■  ■■  ■■ ·  │  │  Silent████░░░░░░ 10%    │  │
│  │                       │  │                            │  │
│  │ ■■■=critical gap      │  └────────────────────────────┘  │
│  │ ■■=moderate gap       │                                  │
│  │ ■=slight gap ·=ok     │  ┌────────────────────────────┐  │
│  └───────────────────────┘  │ 🔴 ALERTS (3 new)          │  │
│                             │                            │  │
│  ┌───────────────────────┐  │ Ankit Verma — GHOST        │  │
│  │ AI INSIGHTS           │  │ 12 days silent, was 72 PRS │  │
│  │                       │  │ [View] [Contact] [Assign]  │  │
│  │ "34 students match    │  │                            │  │
│  │  Amazon but only 12   │  │ Riya Patel — AVOIDER       │  │
│  │  have applied."       │  │ Skipped 5 mock interviews  │  │
│  │                       │  │ [View] [Contact] [Assign]  │  │
│  │ "Top gap: System      │  │                            │  │
│  │  Design (65% below)"  │  │ Mohit Kumar — BURNOUT      │  │
│  │                       │  │ Frustration detected in     │  │
│  │ "Predicted placement: │  │ last 3 conversations       │  │
│  │  72%. With bootcamp:  │  │ [View] [Contact] [Assign]  │  │
│  │  81%."                │  └────────────────────────────┘  │
│  └───────────────────────┘                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. System Flow Diagrams

### 9.1 Complete Student Journey Flow

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────────┐
│  SIGNUP  │────►│  UPLOAD   │────►│  AI      │────►│  SET GOALS   │
│  /Login  │     │  RESUME   │     │ ANALYSIS │     │  & Targets   │
└──────────┘     └───────────┘     └──────────┘     └──────┬───────┘
                                                           │
                      Diagnostic Agent handles              │
                      steps 2-4, creates profile            │
                                                           │
                                                    ┌──────▼───────┐
                                                    │  AI CREATES   │
                                                    │  PREP PLAN    │
                                                    │  (Planner)    │
                                                    └──────┬───────┘
                                                           │
                 ┌─────────────────────────────────────────┐│
                 │            DAILY LOOP                    ││
                 │                                          ││
                 │  ┌──────────┐    ┌──────────────────┐   ││
                 │  │ CHECK    │    │ COACHING CHAT     │   ││
                 │  │ TASKS &  │◄──►│ with memory       │   ││
                 │  │ PROGRESS │    │ (all agents)      │   ││
                 │  └────┬─────┘    └──────────────────┘   ││
                 │       │                                  ││
                 │  ┌────▼─────┐    ┌──────────────────┐   ││
                 │  │ COMPLETE │    │ MOCK INTERVIEWS   │   ││
                 │  │ TASKS    │    │ (scheduled by     │   ││
                 │  │          │    │  Planner)         │   ││
                 │  └────┬─────┘    └────────┬─────────┘   ││
                 │       │                   │              ││
                 │       │    ┌──────────────▼──────────┐  ││
                 │       │    │ SCORES UPDATE →         │  ││
                 │       └───►│ PLAN ADJUSTS →          │  ││
                 │            │ READINESS CHANGES        │  ││
                 │            └─────────────────────────┘  ││
                 └─────────────────────────────────────────┘│
                                                            │
                 ┌──────────────────────────────────────────┘
                 │
                 │  PROACTIVE LOOP (every 6 hours, Accountability Agent)
                 │
                 │  ┌────────────┐   ┌─────────────┐   ┌────────────┐
                 ├──│ Deadline   │   │ Missed task  │   │ New company │
                 │  │ approaching│   │ follow-up    │   │ match alert │
                 │  └────────────┘   └─────────────┘   └────────────┘
                 │
                 │  IF AT RISK (Escalation Agent)
                 │  ┌────────────┐   ┌─────────────┐   ┌────────────┐
                 └──│ Strategy   │   │ TPC alert   │   │ Burnout    │
                    │ switch     │   │ with context │   │ intervention│
                    └────────────┘   └─────────────┘   └────────────┘
```

### 9.2 Agent Communication Flow (Single Chat Message)

```
Student: "What should I focus on this week?"
│
▼
┌────────────────────────────────────────────────────────┐
│                  ORCHESTRATOR                           │
│                                                        │
│  1. Classify: Planning/coaching query                  │
│  2. Primary agent: Planner (with Coach personality)    │
│  3. Load context:                                      │
│     ├── Memory Agent → recall relevant facts           │
│     ├── Postgres → student profile, pending tasks      │
│     ├── Redis → last 3 conversation summaries          │
│     └── Postgres → upcoming company deadlines          │
│  4. Build system prompt with all context               │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│              PLANNER AGENT (Claude Sonnet)              │
│                                                        │
│  System: "You are a career coach. Here's what you      │
│  know about this student: [injected memory context]"   │
│                                                        │
│  Agent thinks:                                         │
│  "Student has Wipro in 6 days. Last mock was 6/10      │
│   with weak trees. Plan currently has arrays today      │
│   but trees are more critical for Wipro. Should         │
│   reprioritize."                                        │
│                                                        │
│  Tool calls:                                           │
│  ├── recall_memory("Wipro preparation") → past facts   │
│  ├── get_upcoming_companies() → Wipro Apr 15, TCS 18  │
│  ├── compute_readiness(student, "wipro") → 74%         │
│  ├── update_plan(reason: "Wipro trees priority")       │
│  ├── create_task("Tree traversal practice", HIGH)      │
│  └── store_memory("Reprioritized to trees for Wipro")  │
│                                                        │
│  Response (streamed):                                  │
│  "Based on your mock yesterday and Wipro visiting       │
│   Thursday, I'm shifting your focus to tree problems.   │
│   Here's your updated plan for this week: [plan]        │
│   I've created a task: 5 tree problems by tomorrow."    │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│              MEMORY AGENT (Async, post-response)       │
│                                                        │
│  Extracts facts:                                       │
│  - [decision] "Reprioritized from arrays to trees"     │
│  - [context] "Wipro preparation is primary focus"      │
│  Stores in pgvector with embeddings                    │
│  Summarizes conversation if > 10 messages              │
└────────────────────────────────────────────────────────┘
```

### 9.3 Selection Probability Engine Flow (Bonus from PS1)

```
Student views Company X match:

┌────────────────────────────────────┐
│ P(selection) = weighted score of:  │
│                                    │
│  Skill Match ──────── 35% weight   │
│  ├── Vector similarity between     │
│  │   student skills & JD reqs      │
│  └── Weighted by company priority  │
│                                    │
│  CGPA Fit ─────────── 15% weight   │
│  ├── Above cutoff = full score     │
│  └── Below = scaled penalty        │
│                                    │
│  Project Relevance ── 20% weight   │
│  ├── LLM-analyzed project          │
│  │   descriptions vs company domain│
│  └── Depth + recency factors       │
│                                    │
│  Historical Match ─── 20% weight   │
│  ├── Cosine similarity to past     │
│  │   SELECTED students at this co  │
│  └── Weighted by recency of data   │
│                                    │
│  Competition ──────── 10% weight   │
│  ├── # students competing / slots  │
│  └── Their avg readiness vs yours  │
│                                    │
│  RESULT: 73%                       │
│                                    │
│  Actionable Levers:                │
│  ├── Complete sys design: +8%      │
│  ├── Add relevant project: +12%    │
│  ├── CGPA above cutoff: +0% (ok)  │
│  └── Competition penalty: -15%     │
└────────────────────────────────────┘
```

---

## 10. Deployment Strategy

### 10.1 Infrastructure (All Free Tier)

| Service | Purpose | Free Tier | Est. Cost |
|---------|---------|-----------|-----------|
| **Vercel** | Next.js hosting | 100 GB BW, 10s fn timeout | $0 |
| **Supabase** | PostgreSQL + pgvector + Auth + Storage + Realtime | 500 MB DB, 1 GB storage, 50K MAU | $0 |
| **Upstash Redis** | Caching, rate limiting, job queue | 10K commands/day, 256 MB | $0 |
| **Anthropic API** | Claude Sonnet (agents) + Haiku (extraction) | Pay-per-use | ~$5-15 |
| **OpenAI API** | Embeddings (text-embedding-3-small) | Pay-per-use | ~$0.50 |
| **Uploadthing** | Resume PDF uploads | 2 GB storage | $0 |
| | | **TOTAL** | **~$6-16** |

### 10.2 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# AI
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# File Uploads
UPLOADTHING_TOKEN=xxx

# Auth
AUTH_SECRET=xxx
AUTH_GOOGLE_ID=xxx.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=GOCSPX-xxx
```

### 10.3 Performance Optimizations

1. **Pre-seed demo data**: 50 students, 10 companies, pre-computed matches
2. **Cache agent responses**: Redis cache with TTL for repeated queries
3. **Streaming everything**: Vercel AI SDK streaming — responses appear word-by-word
4. **Optimistic UI**: Update immediately, sync async
5. **Pre-warm**: Visit key pages before demo to prime serverless functions
6. **Edge functions**: Use Vercel Edge Runtime for low-latency API routes

---

## 11. Demo Script

### 5-7 Minute Walkthrough

```
MINUTE 0-1: THE PROBLEM
"Meet Priya. 3rd-year CSE student. She's been using ChatGPT for placement
prep. Every conversation starts from scratch. Nobody follows up. Nobody
holds her accountable. Nobody knows her story. She's on her own."

MINUTE 1-2: ONBOARDING
- Upload Priya's resume → Watch AI analyze in real-time (streaming)
- AI identifies: "Strong React, weak DSA, no system design, missing internship"
- AI creates: 4-week prep plan targeting Wipro, TCS, Amazon
- Show Memory Panel: "Look what the AI already knows about her"

MINUTE 2-4: THE COACH IN ACTION
- Chat: "What should I prepare this week?"
- AI RECALLS: "Last session you struggled with tree problems. Wipro visits Thursday."
- AI DECIDES: "I'm overriding your array practice — trees are more critical."
- AI ACTS: Creates specific tasks with deadlines inline
- Show Memory Panel updating in real-time
- "This is not a chatbot. This is a coach that THINKS and REMEMBERS."

MINUTE 4-5: PROACTIVE INTELLIGENCE
- Show notification that arrived WITHOUT being asked:
  "Hey Priya, TCS posted a new JD. Your match: 81%. But they need SQL —
   you haven't practiced. Here's a 3-day SQL crash course."
- "The AI doesn't wait for you. It reaches out when it matters."

MINUTE 5-6: MOCK INTERVIEW
- Quick 2-question mock (1 behavioral, 1 technical)
- AI evaluates with rubric: STAR analysis, technical scoring
- Results update the skill radar chart
- "Every interview makes the AI smarter about you."

MINUTE 6-7: TPC VIEW + IMPACT
- Switch to admin dashboard: batch overview, at-risk flags
- Show alert: "Ankit has gone silent — here's what happened and what to do"
- Show readiness: Priya went from 45 → 72 over the simulated journey
- "Without PlaceAI: students figure it out alone.
   With PlaceAI: personalized, persistent, proactive guidance at scale."
```

---

*This blueprint is the complete technical specification for PlaceAI. It covers architecture, agents, memory, database, APIs, frontend, and deployment — everything needed to build the hackathon-winning Agentic AI Career Coach.*
