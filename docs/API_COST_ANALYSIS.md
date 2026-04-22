# Mentora — API Cost Analysis & Optimization Guide

> **Purpose**: Complete inventory of all external API calls, per-user cost modeling, scaling projections to 10K and 100K users, and a detailed optimization plan.
> **Last Updated**: April 2026
> **Current Stack**: Groq (GPT-OSS 120B + Llama 3.3 70B + Whisper + Orpheus TTS), OpenAI Embeddings, Supabase (Postgres + pgvector + Storage + Auth), Upstash Redis, Vercel.
> **Pricing Sources**: Groq Console (April 2026), OpenAI Platform, Supabase Pricing, Upstash Pricing, Vercel Pricing.

---

## Table of Contents

1. [Stack & API Call Inventory](#1-stack--api-call-inventory)
2. [Pricing Reference (April 2026)](#2-pricing-reference-april-2026)
3. [Per-Session Cost Breakdown](#3-per-session-cost-breakdown)
4. [Monthly Cost Model — 100 MAU Baseline](#4-monthly-cost-model--100-mau-baseline)
5. [Scaling Projection — 10,000 Users](#5-scaling-projection--10000-users)
6. [Scaling Projection — 100,000 Users](#6-scaling-projection--100000-users)
7. [Infrastructure Costs at Scale](#7-infrastructure-costs-at-scale)
8. [Detailed Optimization Plan](#8-detailed-optimization-plan)
9. [Cost Monitoring, Quotas & Alerts](#9-cost-monitoring-quotas--alerts)
10. [Unit-Economics & Pricing Recommendations](#10-unit-economics--pricing-recommendations)

---

## 1. Stack & API Call Inventory

Mentora talks to five external providers. The actual model bindings live in [frontend/src/lib/ai/provider.ts](../frontend/src/lib/ai/provider.ts) and [frontend/src/lib/groq/client.ts](../frontend/src/lib/groq/client.ts).

### 1.1 Model tiers (as wired in code)

| Tier | Model | Provider | Used by |
|------|-------|----------|---------|
| **`chatModel`** (primary reasoning) | `openai/gpt-oss-120b` | Groq | Coach chat, mock interview turns, plan generation, resume analysis, interview prep |
| **`fastModel`** (cheap & fast) | `llama-3.3-70b-versatile` | Groq | Fact extraction, burnout detection, accountability nudges, micro-assessments, GitHub/LinkedIn audits, summarization |
| **STT** | `whisper-large-v3-turbo` | Groq | Voice mock interview — student speech → text |
| **TTS** | `canopylabs/orpheus-v1-english` | Groq | Voice mock interview — AI speech |
| **Embeddings** | `text-embedding-3-small` | OpenAI | Memory recall, duplicate detection, conversation summary |

### 1.2 Every external API call, by feature

| # | Feature | Provider | Model/Service | When called | Frequency |
|---|---------|----------|---------------|-------------|-----------|
| 1 | Coach chat (streaming) | Groq | gpt-oss-120b | Every student message | Hot path |
| 2 | Mock interview (text) | Groq | gpt-oss-120b | Every interview turn | Hot path |
| 3 | Mock interview STT | Groq | whisper-large-v3-turbo | Each student speech segment | Per segment |
| 4 | Mock interview TTS | Groq | orpheus-v1-english | Each AI utterance | Per response |
| 5 | Resume analysis | Groq | gpt-oss-120b | On resume upload | 1× per upload |
| 6 | Plan generation | Groq | gpt-oss-120b | Plan creation/update | 1× per plan |
| 7 | Interview prep briefing | Groq | gpt-oss-120b | Before scheduled interview | 1× per interview |
| 8 | Fact extraction (async) | Groq | llama-3.3-70b | After every conversation | Async, debounced |
| 9 | Burnout detection | Groq | llama-3.3-70b | Weekly check / on demand | Cron + on-demand |
| 10 | Accountability nudges | Groq | llama-3.3-70b | Cron (daily/weekly) | Scheduled |
| 11 | Micro-assessment scoring | Groq | llama-3.3-70b | After each micro-assessment | Per assessment |
| 12 | GitHub audit | Groq | llama-3.3-70b | Diagnostic stage | 1× per student |
| 13 | LinkedIn audit | Groq | llama-3.3-70b | Diagnostic stage | 1× per student |
| 14 | Memory fact embedding | OpenAI | text-embedding-3-small | On fact store | Per fact |
| 15 | Memory recall embedding | OpenAI | text-embedding-3-small | Before agent call | Per turn |
| 16 | Duplicate detection | OpenAI | text-embedding-3-small | Before fact store | Per fact |
| 17 | Vector search | Supabase | pgvector RPC (`match_memories`) | Before agent call | Per turn |
| 18 | Auth | Supabase | GoTrue | Login/signup/refresh | Per session |
| 19 | File upload | Supabase | Storage | Resume upload | Per upload |
| 20 | Rate limiting | Upstash | Redis `@upstash/ratelimit` | Every API request | Every request |
| 21 | Health check | Multi | All services | Cron | Every 5 min |

---

## 2. Pricing Reference (April 2026)

> Prices are public list prices at the time of writing. Groq's pricing changes fairly often — re-check `console.groq.com/pricing` before budgeting.

### 2.1 LLM & audio pricing

| Provider | Model | Metric | Price | Notes |
|----------|-------|--------|-------|-------|
| **Groq** | `openai/gpt-oss-120b` | Input tokens | **$0.15 / 1M** | ~30× cheaper than Claude Sonnet input |
| **Groq** | `openai/gpt-oss-120b` | Output tokens | **$0.75 / 1M** | ~20× cheaper than Claude Sonnet output |
| **Groq** | `llama-3.3-70b-versatile` | Input tokens | **$0.59 / 1M** | |
| **Groq** | `llama-3.3-70b-versatile` | Output tokens | **$0.79 / 1M** | |
| **Groq** | `whisper-large-v3-turbo` | Audio | **$0.04 / hour** | 10s min billing per request |
| **Groq** | `whisper-large-v3` | Audio | $0.111 / hour | More accurate, ~2.8× pricier |
| **Groq** | `distil-whisper-large-v3-en` | Audio | $0.02 / hour | English-only, ~2× cheaper than turbo |
| **Groq** | `canopylabs/orpheus-v1-english` (TTS) | Characters | **~$50 / 1M chars** | Premium voice; price band — confirm on console |
| **OpenAI** | `text-embedding-3-small` | Input tokens | **$0.02 / 1M** | 1536 dims, used via OpenAI API directly |
| **OpenAI** | `tts-1` (fallback option) | Characters | $15 / 1M chars | Not currently wired but listed for comparison |

### 2.2 Infra pricing

| Provider | Service | Metric | Price |
|----------|---------|--------|-------|
| **Supabase** | Postgres (Pro) | Storage | $0.125 / GB over 8 GB |
| **Supabase** | Egress | Bandwidth | $0.021 / GB over 250 GB |
| **Supabase** | Storage (objects) | Storage | $0.021 / GB over 100 GB |
| **Upstash** | Redis | Commands | $0.20 / 100K commands |
| **Vercel** | Functions (Pro) | Invocations | $0.60 / 1M over plan |
| **Vercel** | Bandwidth (Pro) | Egress | $0.15 / GB over 1 TB |

### 2.3 Why Mentora's per-turn cost is dominated by TTS, not the LLM

Because GPT-OSS 120B on Groq is very cheap at output, the most expensive line item per voice-mock session is **TTS** — a single 20-minute mock can burn more on voice synthesis than on every GPT-OSS call combined. Any cost plan has to handle TTS explicitly.

---

## 3. Per-Session Cost Breakdown

All token assumptions below are drawn from the actual system prompts in [frontend/src/server/prompts/](../frontend/src/server/prompts/) and the context builder in [frontend/src/server/memory/context-builder.ts](../frontend/src/server/memory/context-builder.ts).

### 3.1 Coaching chat session — 10 turns

```
System prompt (coach-system.ts):      ~2,000 tokens  (cached after turn 1)
Context injection (memory + tasks):   ~1,500 tokens  (partially cached)
Per student message:                  ~100 tokens
Per AI response:                      ~300 tokens
Chat history sent each turn (grows linearly).

TOKEN TOTALS (naive, no optimization)
  Input  (cumulative across 10 turns): ~54,000 tokens
  Output (10 responses):               ~3,000 tokens

ASYNC after session:
  Fact extraction (fastModel):  2,000 in + 500 out
  Embedding 3 facts:            150 tokens
  Recall embedding at session start: 100 tokens

COST
  gpt-oss-120b chat:   (54,000 / 1M × $0.15) + (3,000 / 1M × $0.75)
                     = $0.0081 + $0.00225 = $0.01035
  llama-70b extract:   (2,000 / 1M × $0.59) + (500 / 1M × $0.79)
                     = $0.00118 + $0.000395 ≈ $0.00158
  Embeddings:          250 / 1M × $0.02 ≈ $0.000005
  Redis (~10 cmds):    $0.00002
                                                    ──────────
                               TOTAL per session: ≈ $0.012
```

### 3.2 Voice mock interview — 20 min, 7 questions

```
Student audio: ~10 min total (billed to STT)
AI audio:      ~8 min total (~7 × 900 chars ≈ 6,300 chars of TTS + 2,000 chars debrief ≈ 8,300 chars)

LLM (gpt-oss-120b, 7 turns + debrief)
  Input:  ~42,000 tokens
  Output: ~4,300 tokens
  Cost: (42,000/1M × $0.15) + (4,300/1M × $0.75)
      = $0.0063 + $0.00323 ≈ $0.0095

STT (whisper-large-v3-turbo)
  0.167 hr × $0.04 = $0.0067

TTS (Orpheus ~$50/1M chars)
  8,300 × $50 / 1,000,000 = $0.415    ← dominant cost

Memory/embeddings post-session: ~$0.0018
                                              ──────────
  TOTAL per voice mock (Orpheus TTS):  ≈ $0.433
  TOTAL per voice mock (browser TTS):  ≈ $0.018
  TOTAL per text-only mock:            ≈ $0.011
```

> **Key insight:** Orpheus TTS alone is ~96% of a voice mock's cost. Every plan below treats "premium voice" as a paid/gated feature.

### 3.3 Resume analysis

```
Resume text:            ~3,000 tokens
System prompt:          ~2,000 tokens
Output (skills, gaps):  ~2,000 tokens
Embeddings (~5 skills): ~250 tokens

Cost: (5,000/1M × $0.15) + (2,000/1M × $0.75) + 250×$0.02/1M
    = $0.00075 + $0.0015 + ~$0
    ≈ $0.0023 per analysis
```

### 3.4 Plan generation

```
Student context:  ~2,000 tokens
Company data:     ~1,500 tokens
System prompt:    ~2,500 tokens
Plan output:      ~3,000 tokens

Cost: (6,000/1M × $0.15) + (3,000/1M × $0.75)
    = $0.0009 + $0.00225 ≈ $0.0032 per plan
```

### 3.5 Diagnostic pipeline (one-time per student)

GitHub audit + LinkedIn audit + 3 micro-assessments + resume analysis, all on `fastModel` except resume which uses `chatModel`.

```
GitHub audit:          ~$0.003
LinkedIn audit:        ~$0.003
3 micro-assessments:   ~$0.006
Resume analysis:       ~$0.0023
Embeddings for skills: ~$0.00001
                       ──────────
TOTAL one-time cost:   ≈ $0.015 per student (lifetime)
```

### 3.6 Summary — all sessions priced

| Feature | Cost/session | Primary cost driver |
|---------|-------------:|--------------------|
| Coaching chat (10 turns) | **$0.012** | gpt-oss-120b output |
| Voice mock (Orpheus TTS) | **$0.433** | TTS |
| Voice mock (browser TTS) | **$0.018** | STT + LLM |
| Text-only mock | **$0.011** | gpt-oss-120b |
| Resume analysis | **$0.0023** | gpt-oss-120b output |
| Plan generation | **$0.0032** | gpt-oss-120b output |
| Interview prep briefing | **$0.0030** | gpt-oss-120b output |
| Async fact extraction | **$0.0016** | llama-3.3-70b |
| Diagnostic pipeline (one-time) | **$0.015** | fastModel calls |

---

## 4. Monthly Cost Model — 100 MAU Baseline

Mix from current product telemetry and the [BLUEPRINT.md](./BLUEPRINT.md) target usage.

| Feature | Sessions / user / month | Cost / session | Monthly |
|---------|------------------------:|---------------:|--------:|
| Coaching chat | 12 | $0.012 | $14.40 |
| Voice mock (Orpheus) | 2 | $0.433 | $86.60 |
| Text mock | 1 | $0.011 | $1.10 |
| Resume analysis | 0.5 | $0.0023 | $0.12 |
| Plan generation | 1 | $0.0032 | $0.32 |
| Interview prep | 0.5 | $0.0030 | $0.15 |
| Fact extraction (async) | 15 | $0.0016 | $2.40 |
| Diagnostic pipeline | 0.1 (amortized) | $0.015 | $0.15 |
| **API subtotal** | | | **≈ $105/month** |
| Supabase / Upstash / Vercel | Free tiers | — | $0 |
| **Total** | | | **≈ $105/month** |
| **Per user** | | | **≈ $1.05/user/month** |

Voice mock TTS is ~82% of the 100-MAU bill by itself. This is the single biggest cost lever in the whole system.

---

## 5. Scaling Projection — 10,000 Users

### 5.1 Assumptions

| Metric | Conservative | **Moderate (baseline)** | Heavy |
|--------|-------------:|------------------------:|------:|
| MAU | 3,000 (30%) | **5,000 (50%)** | 8,000 (80%) |
| Chat sessions / MAU / month | 8 | **12** | 20 |
| Voice mocks (Orpheus) / MAU | 1 | **3** | 5 |
| Text mocks / MAU | 1 | **1** | 2 |
| Resume analyses / MAU | 0.3 | **0.5** | 1 |
| Plan gens / MAU | 0.5 | **1** | 2 |
| Interview prep / MAU | 0.3 | **0.5** | 1 |
| Fact extractions / MAU (auto) | 10 | **16** | 30 |
| New diagnostic pipelines / month | 800 | 1,000 | 1,500 |

### 5.2 Moderate scenario — 5,000 MAU (the plan-for number)

| Feature | Sessions | Cost/session | Monthly |
|---------|---------:|-------------:|--------:|
| Coaching chat | 60,000 | $0.012 | $720 |
| Voice mock (Orpheus) | 15,000 | $0.433 | **$6,495** |
| Text mock | 5,000 | $0.011 | $55 |
| Resume analysis | 2,500 | $0.0023 | $6 |
| Plan generation | 5,000 | $0.0032 | $16 |
| Interview prep | 2,500 | $0.0030 | $8 |
| Fact extraction (async) | 80,000 | $0.0016 | $128 |
| Diagnostic pipelines | 1,000 | $0.015 | $15 |
| **API subtotal** | | | **$7,443** |
| Supabase Pro + overages | | | $140 |
| Upstash Redis PAYG | | | $30 |
| Vercel Pro + overages | | | $100 |
| Monitoring (Sentry) | | | $26 |
| **Grand total** | | | **≈ $7,740 / month** |
| **Per MAU** | | | **$1.55 / user / month** |

### 5.3 Conservative and heavy

| Scenario | MAU | API monthly | Infra monthly | **Total** | $ / MAU |
|----------|----:|------------:|--------------:|----------:|--------:|
| Conservative | 3,000 | $2,880 | $200 | **$3,080** | $1.03 |
| **Moderate** | **5,000** | **$7,443** | **$296** | **$7,740** | **$1.55** |
| Heavy | 8,000 | $19,700 | $500 | **$20,200** | $2.52 |

### 5.4 What dominates the 10K bill

- **Voice mock TTS (Orpheus): 70–85% of API spend** in every scenario.
- **gpt-oss-120b chat: <10%** — stunningly cheap on Groq.
- **Infra: <5%** — essentially a rounding error compared to the voice-mock line.

---

## 6. Scaling Projection — 100,000 Users

At this scale the mix matters more than ever — a 1% swing in voice-mock usage moves thousands of dollars.

### 6.1 Assumptions

| Metric | Conservative | **Moderate (baseline)** | Heavy |
|--------|-------------:|------------------------:|------:|
| MAU | 25,000 (25%) | **40,000 (40%)** | 65,000 (65%) |
| Chat sessions / MAU / month | 8 | **12** | 20 |
| Voice mocks (Orpheus) / MAU | 0.5 | **1.5** | 3 |
| Text mocks / MAU | 1 | **1** | 2 |
| Resume analyses / MAU | 0.2 | **0.4** | 0.8 |
| Plan gens / MAU | 0.3 | **0.8** | 1.5 |
| Fact extractions / MAU | 10 | **14** | 25 |
| New diagnostics / month | 5,000 | 8,000 | 12,000 |

> At 100K, voice-mock intensity drops because quotas/paywalls kick in (see §8 and §9).

### 6.2 Moderate scenario — 40,000 MAU

| Feature | Sessions | Cost/session | Monthly |
|---------|---------:|-------------:|--------:|
| Coaching chat | 480,000 | $0.012 | $5,760 |
| Voice mock (Orpheus) | 60,000 | $0.433 | **$25,980** |
| Text mock | 40,000 | $0.011 | $440 |
| Resume analysis | 16,000 | $0.0023 | $37 |
| Plan generation | 32,000 | $0.0032 | $102 |
| Interview prep | 16,000 | $0.0030 | $48 |
| Fact extraction (async) | 560,000 | $0.0016 | $896 |
| Diagnostic pipelines | 8,000 | $0.015 | $120 |
| **API subtotal** | | | **$33,383** |
| Supabase Team + overages | | | $900 |
| Upstash Redis Pro | | | $200 |
| Vercel Pro + functions | | | $600 |
| Sentry Team | | | $80 |
| CDN / egress | | | $250 |
| **Grand total (pre-optimization)** | | | **≈ $35,400 / month** |
| **Per MAU** | | | **$0.89 / user / month** |

### 6.3 Conservative and heavy

| Scenario | MAU | API monthly | Infra monthly | **Total** | $ / MAU |
|----------|----:|------------:|--------------:|----------:|--------:|
| Conservative | 25,000 | $9,900 | $1,400 | **$11,300** | $0.45 |
| **Moderate** | **40,000** | **$33,400** | **$2,030** | **$35,430** | **$0.89** |
| Heavy | 65,000 | $96,800 | $3,400 | **$100,200** | $1.54 |

### 6.4 Post-optimization targets (see §8)

| Scenario | Pre-opt total | Post-opt total | $ / MAU | Reduction |
|----------|--------------:|---------------:|--------:|----------:|
| Moderate (40K MAU) | $35,430 | **~$10,800** | **$0.27** | **−70%** |
| Heavy (65K MAU) | $100,200 | ~$31,000 | $0.48 | −69% |

The main levers (itemized in §8.1): (1) migrate Orpheus → browser TTS as default, (2) prompt cache the system prompt (now supported via vLLM-style caching on some Groq deployments; otherwise emulate with sliding-window), (3) sliding-window + summary for chat context, (4) usage quotas on voice mocks.

### 6.5 Annualized at 100K users

```
Moderate, pre-opt:   $35,400 / mo  →  $424,800 / yr
Moderate, post-opt:  $10,800 / mo  →  $129,600 / yr

At a $6/mo subscription with 20% paid conversion (8,000 paying):
  Revenue  = 8,000 × $6 × 12 = $576,000 / yr
  Margin   = $576K − $129.6K ≈ $446K / yr (77% gross margin, post-opt)

At $4/mo with 30% paid conversion (12,000 paying):
  Revenue  = 12,000 × $4 × 12 = $576,000 / yr
  Margin   ≈ same $446K
```

---

## 7. Infrastructure Costs at Scale

Scaling table for planning purposes. Picks the smallest tier that comfortably fits the workload, including headroom for spikes.

| Users (total) | Supabase | Upstash | Vercel | Sentry | CDN | **Total infra / mo** |
|---------:|----------|---------|--------|--------|-----|----------------------:|
| 100 | Free | Free | Hobby | Free | — | **$0** |
| 1,000 | Pro $25 | Free | Hobby | Dev $26 | — | **$51** |
| 5,000 | Pro $75 | PAYG $15 | Pro $50 | Dev $26 | — | **$166** |
| 10,000 | Pro $125 | PAYG $30 | Pro $120 | Dev $26 | — | **$301** |
| 50,000 | Team $599 | Pro $100 | Pro $300 | Team $80 | $50 | **$1,129** |
| 100,000 | Team $599 + $300 overage | Pro $200 | Pro $600 | Team $80 | $250 | **$2,029** |
| 250,000 | Enterprise (custom) ~$2K | Custom ~$500 | Enterprise ~$1.5K | ~$200 | ~$500 | **~$4,700** |

At 100K users, infra is <6% of total cost — the LLM/TTS bill is the story.

---

## 8. Detailed Optimization Plan

Optimizations ranked by **impact per engineering-hour**. Quoted savings assume the **5K MAU moderate** baseline ($7,443/mo API) or **40K MAU moderate** ($33,383/mo API).

### 8.1 P0 — ship before the first 1K users cross the platform

#### 8.1.1 Make browser TTS the default; Orpheus is a paid "Premium Voice"

**What:** Default the mock interviewer to the Web Speech API. Keep Orpheus behind a `premiumVoice: true` flag on the student record, gated by subscription or explicit opt-in.

**Why it matters:** Orpheus TTS is 96% of voice-mock cost. Browser TTS is free, works in Chrome/Edge/Safari, and is good enough for practice.

**Expected savings:**
- 5K MAU: $6,495 → ~$260 on voice mocks = **−$6,235 / mo (−84% of total API bill)**
- 40K MAU: $25,980 → ~$1,040 = **−$24,940 / mo (−74% of total API bill)**

**Implementation sketch:** feature flag in [frontend/src/lib/groq/client.ts](../frontend/src/lib/groq/client.ts) TTS function; client-side fallback uses `window.speechSynthesis`.

**Risk:** browser voice quality is inferior. Mitigation — gate Orpheus behind the paid plan so paying users still get the premium experience.

---

#### 8.1.2 Prompt caching (or sliding-window equivalent) for chat

**What:** The system prompt (~2,000 tokens) is repeated every turn. Two options:
1. If Groq exposes prompt-caching on gpt-oss-120b (check `cache_control` header), mark the system prompt as cacheable.
2. If not yet available, replace cumulative history with a **sliding window of the last 6 messages + one running summary** generated by `fastModel`.

**Why it matters:** Chat input tokens grow linearly per turn. A 20-turn session currently sends ~200K cumulative input tokens. With a sliding window, it stays ~10K regardless of length.

**Expected savings:**
- 5K MAU: chat spend $720 → ~$380 = **−$340 / mo**
- 40K MAU: chat spend $5,760 → ~$3,000 = **−$2,760 / mo**
- At 100K+ heavy usage this grows nonlinearly — capping growth is the real win.

**Implementation sketch:** modify context builder in [frontend/src/server/memory/context-builder.ts](../frontend/src/server/memory/context-builder.ts) to truncate history to last N messages and prepend a summary. Summary generated by `fastModel` once per 5 messages.

**Risk:** losing conversational nuance. Mitigation — keep the running summary detailed and always include the last 6 raw turns.

---

#### 8.1.3 Hard usage quotas (free tier caps)

**What:** Free users get a finite allocation; overages require upgrade. Suggested caps:

| Tier | Chat / day | Voice mocks / week | Text mocks / week | Diagnostic | Premium TTS |
|------|-----------:|-------------------:|------------------:|:---------:|:-----------:|
| Free | 20 turns | 0 (text only) | 2 | 1 (one-time) | ❌ |
| Pro ($6/mo) | Unlimited | 3 | Unlimited | 1 | browser only |
| Premium ($12/mo) | Unlimited | Unlimited | Unlimited | 1 | ✅ Orpheus |

**Why it matters:** Without quotas, a single abusive user can burn $50/day. With them, cost per free user stays capped at ~$0.30/month.

**Implementation sketch:** Upstash-backed rate limiter in [frontend/src/lib/ratelimit.ts](../frontend/src/lib/ratelimit.ts); existing infra already supports per-feature limits.

**Expected savings:** Caps heavy-scenario blowout. At 100K users the difference between "heavy" ($100K/mo) and "moderate" ($35K/mo) is entirely usage-quota-driven.

---

#### 8.1.4 Cache chat-context builds in Redis (5 min TTL)

**What:** `buildContext()` is called at the start of every chat turn and re-runs several DB queries (profile, recent memories, active tasks). Cache the result keyed by `studentId` with a 5-minute TTL; invalidate on memory/task writes.

**Why it matters:** Reduces Supabase query load by ~50% on the hot path. Not a big direct $ savings but keeps infra tier down as MAU grows.

**Expected savings:** ~$50–150/mo at 40K MAU (delays Supabase tier upgrades).

---

### 8.2 P1 — ship before scaling past 10K users

#### 8.2.1 Switch STT to `distil-whisper-large-v3-en`

**What:** Replace `whisper-large-v3-turbo` with `distil-whisper-large-v3-en` in [frontend/src/lib/groq/client.ts](../frontend/src/lib/groq/client.ts).

**Why it matters:** Mentora serves Indian campus placements; interviews are almost always in English. Distil-Whisper is ~2× cheaper ($0.02/hr vs $0.04/hr) and faster.

**Expected savings:** STT is small, so $30–150/mo. Worth it because the change is one line.

---

#### 8.2.2 Batch fact-extraction debouncing

**What:** Currently fact extraction fires per conversation turn boundary. Instead, debounce per-student to **at most one extraction every 10 min**, consuming all new messages in one call.

**Why it matters:** Chat-heavy users currently trigger many overlapping extractions. Batching collapses multiple small `fastModel` calls into one, halving per-turn fixed-prompt overhead.

**Expected savings:**
- 5K MAU: $128 → $70 = **−$58/mo**
- 40K MAU: $896 → $500 = **−$396/mo**

---

#### 8.2.3 Async-offload heavy agents to a queue

**What:** Move burnout detection, accountability nudges, and diagnostic audits to a background queue (Upstash QStash or Supabase Edge Functions cron) instead of serverless functions. Critical path stays hot; non-critical work runs async.

**Why it matters:** Vercel invocation pricing + cold-start latency add up. A queue also enables batching multiple students per cron tick.

**Expected savings:** ~$50–200/mo in Vercel function invocations at 40K MAU. Indirect: better UX.

---

#### 8.2.4 Embedding deduplication

**What:** Before calling `text-embedding-3-small` for a new fact, hash the normalized text and check Redis for a prior embedding. Embeddings are deterministic — no need to recompute.

**Why it matters:** Embedding cost is already tiny ($0.02/1M tokens), but the real win is latency and pgvector write amplification. The system already does similarity dedup; add content-hash dedup as a fast-path.

**Expected savings:** ~$5/mo API; meaningful latency improvement.

---

### 8.3 P2 — consider at 50K+ users

#### 8.3.1 Self-host Whisper on a GPU

At >50K MAU, a dedicated A10G or L4 instance ($0.75–1.00/hr on AWS or Modal) can serve all STT traffic for ~$600/mo vs. $2,500+/mo on Groq at heavy usage. Break-even: ~1,500 hours of audio/month.

#### 8.3.2 Route simple chat turns to `fastModel`

**What:** A small classifier (on `fastModel` itself) decides whether a chat turn needs gpt-oss-120b's reasoning or can be handled by Llama 3.3. Greetings, acknowledgements, and short factual responses → `fastModel`.

**Expected savings:** ~30–40% of chat LLM cost. At 40K MAU post-TTS-optimization, that's another $1,500/mo.

#### 8.3.3 Negotiate committed-volume Groq pricing

At >$10K/mo Groq spend, reach out for annual committed-use discounts (typically 15–30% off list).

#### 8.3.4 Regionalize Supabase / add read replicas

At 100K+ users with Indian concentration, a Mumbai-region Supabase project cuts egress bills and latency. Read replicas ease the memory-recall query load.

---

### 8.4 Optimization impact — summary table

All numbers relative to the **moderate** scenario at the respective scale.

| # | Strategy | Complexity | Savings @ 5K MAU | Savings @ 40K MAU | Priority |
|---|----------|-----------:|-----------------:|------------------:|----------|
| 8.1.1 | Browser TTS default, Orpheus paid | Low | **−$6,235** | **−$24,940** | **P0** |
| 8.1.2 | Prompt cache / sliding window | Medium | −$340 | −$2,760 | **P0** |
| 8.1.3 | Usage quotas | Medium | Caps blowout | Caps blowout | **P0** |
| 8.1.4 | Redis context cache | Medium | −$50 | −$150 | **P0** |
| 8.2.1 | distil-whisper STT | Low | −$30 | −$150 | P1 |
| 8.2.2 | Debounce fact extraction | Low | −$58 | −$396 | P1 |
| 8.2.3 | Queue heavy agents | Medium | −$50 | −$200 | P1 |
| 8.2.4 | Embedding dedup | Low | ~$5 | ~$40 | P1 |
| 8.3.1 | Self-host Whisper | High | — | −$2,000 | P2 (at 50K+) |
| 8.3.2 | Route simple turns to fastModel | Medium | −$200 | −$1,500 | P2 |
| 8.3.3 | Committed-volume Groq pricing | Low | — | −15–30% | P2 |

### 8.5 Combined post-optimization targets

| Scale | Baseline | After P0 | After P0+P1 | After P0+P1+P2 |
|-------|---------:|---------:|------------:|---------------:|
| 5K MAU | $7,740 | $1,115 | $970 | — |
| 40K MAU | $35,430 | $7,580 | $6,830 | **$3,330** |
| 65K MAU (heavy) | $100,200 | $28,100 | $25,200 | ~$15,500 |

At 40K MAU, the realistic post-P0 cost is **~$7.6K/mo ($0.19/MAU)** — dominated by gpt-oss-120b chat and infra, with TTS contained to paying users.

---

## 9. Cost Monitoring, Quotas & Alerts

### 9.1 Per-call telemetry

Instrument every API-invoking route. Suggested schema (already partially present in logs — consolidate into one table):

```ts
interface APICallMetric {
  provider: "groq" | "openai" | "supabase" | "upstash";
  model: string;                 // e.g. "openai/gpt-oss-120b"
  feature:                       // stable keys for aggregation
    | "coach_chat" | "mock_voice" | "mock_text"
    | "resume" | "plan" | "interview_prep"
    | "memory_extract" | "memory_embed"
    | "diagnostic_github" | "diagnostic_linkedin"
    | "micro_assessment" | "burnout" | "accountability";
  inputTokens: number;
  outputTokens: number;
  audioSeconds?: number;         // STT
  ttsCharacters?: number;        // TTS
  latencyMs: number;
  cost: number;                  // derived at write-time from §2 table
  studentId: string;
  sessionId: string;
  timestamp: Date;
}
```

Persist to Supabase `api_usage_logs` (partitioned monthly). Feed a real-time admin dashboard at `/admin/costs`.

### 9.2 Alert thresholds

| Metric | Warning | Critical | Action |
|--------|--------:|---------:|--------|
| Daily API spend | $200 | $500 | Auto-page on-call, investigate |
| Per-user daily spend | $3 | $10 | Hard-cap user, flag for review |
| Single request input tokens | 50K | 100K | Context explosion — audit prompt |
| Single student chat turns/hour | 60 | 120 | Rate-limit, possible abuse |
| Groq error rate (5-min window) | 5% | 15% | Failover to backup provider |
| Streamed TTFB | 3s | 8s | Investigate Groq region |
| Monthly budget burn | 80% by day 20 | 100% any day | Tighten quotas, throttle free tier |

### 9.3 Quota enforcement — concrete plan

Extend [frontend/src/lib/ratelimit.ts](../frontend/src/lib/ratelimit.ts) with per-feature limiters:

```
coachChat:    Ratelimit.slidingWindow(20,  "1d")   // Free tier
mockVoice:    Ratelimit.fixedWindow(0,    "1w")   // Free = 0, Pro = 3
mockText:     Ratelimit.fixedWindow(2,    "1w")
resumeAnalyze: Ratelimit.fixedWindow(3,   "7d")
planGenerate: Ratelimit.fixedWindow(4,    "30d")
```

Reads the student's `subscription_tier` from Supabase and picks the appropriate limiter. Returns 402 (Payment Required) with upgrade CTA on exceed.

### 9.4 Abuse & anomaly detection

- **Daily cost cap per student**: $2 free / $10 Pro / $30 Premium. Hard fail API calls once exceeded until daily reset.
- **Context-length cap**: reject any API request with >30K input tokens (runaway prompt indicates bug or abuse).
- **Duplicate request dedup**: Redis-backed SHA256 of (userId, endpoint, body) with 30-second TTL — short-circuits accidental double-clicks that double-charge.

---

## 10. Unit-Economics & Pricing Recommendations

### 10.1 Break-even by tier (post-P0 optimization)

| Tier | Monthly cost to serve | Suggested price | Gross margin |
|------|-----------------------:|----------------:|-------------:|
| Free (quota-capped) | $0.15 | $0 | Acquisition cost |
| Pro (browser TTS, unlimited chat + text mock) | $0.25 | $6 | 96% |
| Premium (Orpheus TTS, unlimited voice mocks) | $1.80 | $12 | 85% |
| Institutional (college bulk, per-student) | $0.35 | $4/student/semester | 91% |

### 10.2 Scenario recap — what to budget

| Scale | Pre-optimization | Post-P0 | What the user actually pays |
|------:|-----------------:|--------:|-----------------------------|
| 100 MAU | $105 | $20 | Free |
| 5K MAU | $7.7K | $1.1K | Free + 10% Pro |
| 10K MAU | ~$15K | ~$2.5K | Free + 15% Pro |
| 40K MAU | $35K | $7.6K | Free + 20% Pro + 5% Premium |
| 100K MAU heavy | $100K | $28K | Same mix, quotas enforced |

### 10.3 The three things that decide whether this scales profitably

1. **Keep Orpheus TTS behind a paywall.** Non-negotiable. Every cost curve in this doc bends on this one switch.
2. **Ship sliding-window context before 10K MAU.** Otherwise chat costs grow quadratically with session length.
3. **Enforce per-student daily dollar caps.** A single runaway loop can otherwise destroy a month's margin.

---

*This analysis should be re-verified monthly. Groq pricing in particular has been trending down ~20% per quarter; re-run the model whenever list prices change. All section-3 costs derive from the token budgets in the system prompts — any material prompt changes (added tools, longer context injection) require redoing §3 before redoing §5 and §6.*
