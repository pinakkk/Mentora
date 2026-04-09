# PlaceAI — API Cost Analysis & Optimization Guide

> **Purpose**: Complete inventory of all external API calls, per-user cost modeling, scaling projections, and optimization strategies  
> **Last Updated**: April 2026  
> **Pricing Sources**: OpenRouter API, Groq Console, Supabase Pricing, Upstash Pricing, Vercel Pricing

---

## Table of Contents

1. [API Call Inventory](#1-api-call-inventory)
2. [Per-Session Cost Breakdown](#2-per-session-cost-breakdown)
3. [Monthly Cost Model (Current)](#3-monthly-cost-model-current)
4. [Scaling Projection: 10,000 Users](#4-scaling-projection-10000-users)
5. [Infrastructure Costs](#5-infrastructure-costs)
6. [Total Cost Summary](#6-total-cost-summary)
7. [Optimization Strategies](#7-optimization-strategies)
8. [Cost Monitoring & Alerts](#8-cost-monitoring--alerts)

---

## 1. API Call Inventory

### 1.1 All External API Calls Made by PlaceAI

| # | Feature | API Provider | Model/Service | Endpoint | When Called |
|---|---------|-------------|---------------|----------|------------|
| 1 | Coaching Chat | OpenRouter | Claude Sonnet 4 | `/chat/completions` (streaming) | Every chat message |
| 2 | Mock Interview (text) | OpenRouter | Claude Sonnet 4 | `/chat/completions` (streaming) | Every interview turn |
| 3 | Mock Interview (voice STT) | Groq | whisper-large-v3-turbo | `/audio/transcriptions` | Every student speech segment |
| 4 | Mock Interview (voice TTS) | OpenAI | tts-1 | `/audio/speech` | Every AI response sentence |
| 5 | Memory Fact Extraction | OpenRouter | Claude Sonnet 4 | `/chat/completions` | Async after every conversation |
| 6 | Memory Embedding | OpenRouter | text-embedding-3-small | `/embeddings` | Every fact stored + every recall query |
| 7 | Memory Recall (vector search) | Supabase | pgvector RPC | `match_memories` | Before every agent call |
| 8 | Resume Analysis | OpenRouter | Claude Sonnet 4 | `/chat/completions` | On resume upload |
| 9 | Plan Generation | OpenRouter | Claude Sonnet 4 | `/chat/completions` | On plan creation/update |
| 10 | Readiness Computation | Supabase | PostgreSQL | Direct query | After assessments |
| 11 | Duplicate Detection | OpenRouter | text-embedding-3-small | `/embeddings` | Before every fact store |
| 12 | Conversation Summary | OpenRouter | text-embedding-3-small | `/embeddings` | After conversation save |
| 13 | Auth | Supabase | GoTrue | Auth endpoints | Login/signup/refresh |
| 14 | File Upload | Supabase | Storage | Upload endpoint | Resume upload |
| 15 | Rate Limiting | Upstash | Redis | REST commands | Every API request |
| 16 | Health Check | Multiple | All services | Various | Periodic (every 5 min) |

### 1.2 API Pricing Reference Table

| Provider | Model/Service | Metric | Price | Notes |
|----------|--------------|--------|-------|-------|
| **OpenRouter** | Claude Sonnet 4 | Input tokens | $3.00 / 1M tokens | ~750 words per 1K tokens |
| **OpenRouter** | Claude Sonnet 4 | Output tokens | $15.00 / 1M tokens | Completions are 5x costlier |
| **OpenRouter** | Claude Sonnet 4 | Cache read | $0.30 / 1M tokens | 10x cheaper than fresh input |
| **OpenRouter** | text-embedding-3-small | Input tokens | $0.02 / 1M tokens | 1536 dimensions |
| **Groq** | whisper-large-v3-turbo | Audio | $0.04 / hour | Min 10s billing per request |
| **Groq** | whisper-large-v3 | Audio | $0.111 / hour | More accurate, 2.8x pricier |
| **OpenAI** | tts-1 | Characters | $15.00 / 1M chars | ~150K words ≈ 1M chars |
| **OpenAI** | tts-1-hd | Characters | $30.00 / 1M chars | Higher quality voice |
| **Supabase** | PostgreSQL (Pro) | Storage | $0.125 / GB (over 8GB) | 8 GB included |
| **Supabase** | Bandwidth | Egress | $0.021 / GB (over 100GB) | 100 GB included |
| **Upstash** | Redis | Commands | $0.20 / 100K commands | First 500K/mo free |
| **Vercel** | Serverless Functions | Invocations | $0.60 / 1M (Pro) | 1M free on Hobby |

---

## 2. Per-Session Cost Breakdown

### 2.1 Coaching Chat Session (10 turns average)

```
Assumptions:
- System prompt: ~2,000 tokens
- Context injection (memory, tasks, profile): ~1,500 tokens
- Each user message: ~100 tokens
- Each AI response: ~300 tokens
- Context grows cumulatively (chat history sent each turn)
- Async fact extraction after session

TOKEN CALCULATION:
─────────────────
Turn 1:  Input = 2000 + 1500 + 100 = 3,600    Output = 300
Turn 2:  Input = 3,600 + 300 + 100 = 4,000     Output = 300
Turn 3:  Input = 4,000 + 300 + 100 = 4,400     Output = 300
...
Turn 10: Input = 3,600 + (9 × 400) = 7,200     Output = 300

Total input  ≈ 54,000 tokens  (sum of growing context)
Total output ≈ 3,000 tokens

Fact extraction (async):
  Input:  ~2,000 tokens (last 6 messages + extraction prompt)
  Output: ~500 tokens (extracted facts JSON)

Memory recall (before session):
  1 embedding call: ~100 tokens input

Embedding for fact storage (after session):
  ~3 facts × ~50 tokens each = 150 tokens

COST PER CHAT SESSION:
──────────────────────
LLM (chat):        (54,000 / 1M × $3) + (3,000 / 1M × $15)  = $0.162 + $0.045 = $0.207
LLM (extraction):  (2,000 / 1M × $3) + (500 / 1M × $15)     = $0.006 + $0.008 = $0.014
Embeddings:        (250 / 1M × $0.02)                         = $0.000005 ≈ $0.00
Redis (rate limit): ~10 commands                               = $0.00002 ≈ $0.00
                                                                ─────────────────
                                                    TOTAL:      $0.221 per session
```

### 2.2 Voice Mock Interview Session (20 min, 7 questions)

```
Assumptions:
- Student speaks ~10 min total (in ~7 segments of ~85s each)
- AI speaks ~8 min total (~7 responses)
- Each response: ~150 words ≈ ~900 characters
- System prompt + context: ~3,000 tokens
- Each student answer transcript: ~150 tokens
- Each AI response (question + brief eval): ~400 tokens

STT (Groq Whisper):
  10 min audio = 0.167 hours
  Cost: 0.167 × $0.04 = $0.0067
  (7 API calls, min 10s each → actual billing ≈ 70s min → still ~$0.0008)
  Actual: max(10 min, 70s min billing) → $0.0067

LLM (Claude Sonnet 4):
  Cumulative input across 7 turns:
    Turn 1: 3000 + 150 = 3,150
    Turn 7: 3000 + 7×(150+400) = 6,850
    Total input ≈ 35,000 tokens
  Total output: 7 × 400 = 2,800 tokens
  Debrief output: ~1,500 tokens (comprehensive feedback)
  Debrief input: ~7,000 tokens (full history)
  
  Total input:  42,000 tokens
  Total output: 4,300 tokens
  
  Cost: (42,000/1M × $3) + (4,300/1M × $15) = $0.126 + $0.065 = $0.191

TTS (OpenAI tts-1):
  AI total speech: ~7 responses × 900 chars = 6,300 characters
  Debrief TTS: ~2,000 characters
  Total: ~8,300 characters
  Cost: 8,300 / 1M × $15 = $0.125

Memory & Embeddings (post-session):
  Fact extraction: $0.014
  Embeddings: ~$0.00
  Assessment storage: $0.00 (Supabase query)

COST PER VOICE MOCK INTERVIEW:
──────────────────────────────
Groq STT:           $0.007
Claude LLM:         $0.191
OpenAI TTS:         $0.125
Memory/Embeddings:  $0.014
                    ──────────
        TOTAL:      $0.337 per session (with TTS)
        TOTAL:      $0.212 per session (with browser TTS — free)
        TOTAL:      $0.198 per session (text-only mock — existing)
```

### 2.3 Text Mock Interview Session (existing, 7 questions)

```
Same LLM costs as voice mock, minus STT and TTS:

Claude LLM:         $0.191
Memory/Embeddings:  $0.014
                    ──────────
        TOTAL:      $0.205 per session
```

### 2.4 Resume Analysis

```
Resume text: ~3,000 tokens (typical 1-2 page resume)
System prompt: ~2,000 tokens
Analysis output: ~2,000 tokens (skills, gaps, scores)
Embeddings: ~5 skills × 50 tokens = 250 tokens

LLM:        (5,000/1M × $3) + (2,000/1M × $15)  = $0.015 + $0.030 = $0.045
Embeddings: (250/1M × $0.02)                      = $0.000005 ≈ $0.00
                                                     ────────────────
                                         TOTAL:     $0.045 per analysis
```

### 2.5 Plan Generation

```
Student context: ~2,000 tokens
Company data: ~1,500 tokens
System prompt: ~2,500 tokens
Plan output: ~3,000 tokens (multi-week plan with tasks)

LLM: (6,000/1M × $3) + (3,000/1M × $15) = $0.018 + $0.045 = $0.063
                                              ────────────────
                                  TOTAL:      $0.063 per plan
```

### 2.6 Summary Table

| Feature | Cost per Session | API Calls per Session | Primary Cost Driver |
|---------|-----------------|----------------------|-------------------|
| Coaching Chat (10 turns) | **$0.221** | ~12 (LLM + embeddings) | Claude output tokens |
| Voice Mock Interview (20 min) | **$0.337** | ~22 (STT + LLM + TTS) | TTS generation |
| Voice Mock (browser TTS) | **$0.212** | ~15 (STT + LLM) | Claude output tokens |
| Text Mock Interview | **$0.205** | ~10 (LLM + embeddings) | Claude output tokens |
| Resume Analysis | **$0.045** | ~3 (LLM + embeddings) | Claude output tokens |
| Plan Generation | **$0.063** | ~3 (LLM + embeddings) | Claude output tokens |
| Memory Extraction (async) | **$0.014** | ~5 (LLM + embeddings) | Claude input tokens |

---

## 3. Monthly Cost Model (Current)

### Assumptions: Early Stage (100 active users)

| Metric | Value |
|--------|-------|
| Registered users | 200 |
| Monthly active users (MAU) | 100 |
| Sessions per user per month | See below |

| Feature | Sessions/User/Month | Cost/Session | Monthly Cost |
|---------|-------------------|-------------|-------------|
| Coaching Chat | 12 | $0.221 | $265 |
| Voice Mock Interview | 2 | $0.337 | $67 |
| Text Mock Interview | 1 | $0.205 | $21 |
| Resume Analysis | 0.5 | $0.045 | $2 |
| Plan Generation | 1 | $0.063 | $6 |
| Memory Extraction | 15 (auto) | $0.014 | $21 |
| **API Subtotal** | | | **$382/month** |

| Infrastructure | Monthly Cost |
|---------------|-------------|
| Supabase (Free tier) | $0 |
| Upstash Redis (Free tier) | $0 |
| Vercel (Hobby) | $0 |
| **Infrastructure Subtotal** | **$0/month** |

### **Total at 100 users: ~$382/month ($3.82/user/month)**

---

## 4. Scaling Projection: 10,000 Users

### Assumptions

| Metric | Conservative | Moderate | Heavy |
|--------|-------------|----------|-------|
| Registered users | 10,000 | 10,000 | 10,000 |
| Monthly active users | 3,000 (30%) | 5,000 (50%) | 8,000 (80%) |
| Chat sessions/user/month | 8 | 12 | 20 |
| Voice mocks/user/month | 1 | 3 | 5 |
| Text mocks/user/month | 1 | 1 | 2 |
| Resume analyses/user/month | 0.3 | 0.5 | 1 |
| Plan generations/user/month | 0.5 | 1 | 2 |

### 4.1 Conservative Scenario (3,000 MAU)

| Feature | Total Sessions | Cost/Session | Monthly Cost |
|---------|---------------|-------------|-------------|
| Coaching Chat | 24,000 | $0.221 | $5,304 |
| Voice Mock (w/ TTS) | 3,000 | $0.337 | $1,011 |
| Text Mock | 3,000 | $0.205 | $615 |
| Resume Analysis | 900 | $0.045 | $41 |
| Plan Generation | 1,500 | $0.063 | $95 |
| Memory Extraction | 30,000 | $0.014 | $420 |
| **API Subtotal** | | | **$7,486/month** |

### 4.2 Moderate Scenario (5,000 MAU) — LIKELY

| Feature | Total Sessions | Cost/Session | Monthly Cost |
|---------|---------------|-------------|-------------|
| Coaching Chat | 60,000 | $0.221 | $13,260 |
| Voice Mock (w/ TTS) | 15,000 | $0.337 | $5,055 |
| Text Mock | 5,000 | $0.205 | $1,025 |
| Resume Analysis | 2,500 | $0.045 | $113 |
| Plan Generation | 5,000 | $0.063 | $315 |
| Memory Extraction | 80,000 | $0.014 | $1,120 |
| **API Subtotal** | | | **$20,888/month** |

### 4.3 Heavy Scenario (8,000 MAU)

| Feature | Total Sessions | Cost/Session | Monthly Cost |
|---------|---------------|-------------|-------------|
| Coaching Chat | 160,000 | $0.221 | $35,360 |
| Voice Mock (w/ TTS) | 40,000 | $0.337 | $13,480 |
| Text Mock | 16,000 | $0.205 | $3,280 |
| Resume Analysis | 8,000 | $0.045 | $360 |
| Plan Generation | 16,000 | $0.063 | $1,008 |
| Memory Extraction | 216,000 | $0.014 | $3,024 |
| **API Subtotal** | | | **$56,512/month** |

---

## 5. Infrastructure Costs

### At 10,000 Users (Moderate Scenario)

| Service | Tier | Monthly Cost | Notes |
|---------|------|-------------|-------|
| **Supabase** | Pro | $25 + ~$50 overages | ~15 GB database, moderate bandwidth |
| **Upstash Redis** | Pay-as-you-go | ~$30 | ~15M commands/month |
| **Vercel** | Pro | $20 + ~$100 overages | ~2M function invocations |
| **Domain + DNS** | Cloudflare | $0-20 | Free tier sufficient |
| **Monitoring** | Sentry (Developer) | $0-26 | Error tracking |
| **Infrastructure Subtotal** | | **~$250/month** | |

### Infrastructure Scaling Notes

| Users | Supabase | Redis | Vercel | Total Infra |
|-------|----------|-------|--------|-------------|
| 100 | Free ($0) | Free ($0) | Free ($0) | **$0** |
| 1,000 | Pro ($25) | Free ($0) | Hobby ($0) | **$25** |
| 5,000 | Pro ($75) | PAYG ($15) | Pro ($50) | **$140** |
| 10,000 | Pro ($125) | PAYG ($30) | Pro ($120) | **$275** |
| 50,000 | Team ($599) | Pro ($100) | Pro ($300) | **$999** |

---

## 6. Total Cost Summary

### Per-User Monthly Cost

| Scenario | API Cost/User | Infra Cost/User | Total/User |
|----------|-------------|----------------|-----------|
| 100 users (free infra) | $3.82 | $0.00 | **$3.82** |
| 1,000 users | $3.20 | $0.03 | **$3.23** |
| 5,000 users (moderate) | $4.18 | $0.03 | **$4.21** |
| 10,000 users (moderate) | $4.18 | $0.03 | **$4.21** |
| 10,000 users (heavy) | $7.06 | $0.03 | **$7.09** |

### Monthly Total at Key Milestones

| Users (MAU) | API Costs | Infra Costs | **Total/Month** | Notes |
|-------------|-----------|------------|----------------|-------|
| 100 | $382 | $0 | **$382** | Free tiers cover infra |
| 500 | $1,910 | $25 | **$1,935** | Supabase Pro needed |
| 1,000 | $3,200 | $25 | **$3,225** | Still manageable |
| 5,000 | $20,888 | $140 | **$21,028** | Optimization critical |
| 10,000 | $20,888-$56,512 | $275 | **$21,163-$56,787** | Need cost controls |

### Annual Projection (Moderate, 5,000 MAU)

```
Monthly:  $21,028
Annual:   $252,336
Per user: $50.52/year ($4.21/month)

Break-even pricing:
  If subscription model: $7-10/user/month covers costs + margin
  If freemium: Need ~30% conversion at $15/month
  If institutional (college buys): $5-8/student/semester
```

---

## 7. Optimization Strategies

### 7.1 High Impact — Implement First

#### Strategy 1: Prompt Caching (Save 30-50% on LLM input costs)

```
CURRENT: Every chat turn sends full system prompt + context = fresh tokens
OPTIMIZED: Use OpenRouter's cache feature for system prompts

How:
- Claude supports automatic prompt caching on OpenRouter
- System prompt + static context = cached after first request
- Subsequent turns in same session pay $0.30/1M (vs $3.00/1M) for cached portion
- System prompt (~3,500 tokens) cached = saves ~$0.01 per turn

Savings estimate:
  Chat session (10 turns): $0.221 → ~$0.165 (25% savings)
  Mock interview (7 turns): $0.191 → ~$0.145 (24% savings)
  
  At 5,000 MAU: saves ~$4,000/month
```

#### Strategy 2: Use Claude Haiku for Fact Extraction (Save 80% on extraction)

```
CURRENT: Claude Sonnet 4 ($3/$15 per 1M) for async fact extraction
OPTIMIZED: Claude Haiku 4.5 ($0.80/$4.00 per 1M) — fast, cheap, good enough

Fact extraction is a structured task (JSON output, clear format).
Haiku handles it well — doesn't need Sonnet's reasoning ability.

Savings estimate:
  Per extraction: $0.014 → ~$0.004 (71% savings)
  At 5,000 MAU (80K extractions): saves ~$800/month
```

#### Strategy 3: Browser TTS as Default (Save 100% on TTS costs)

```
CURRENT: OpenAI TTS-1 at $15/1M characters = $0.125 per mock session
OPTIMIZED: Browser Web Speech API (free) as default, OpenAI as premium option

Modern browsers (Chrome, Edge, Safari) have decent TTS quality.
Offer OpenAI TTS as a "Premium Voice" toggle.

Savings estimate:
  Per voice mock: $0.337 → $0.212 (37% savings)
  At 5,000 MAU (15K voice mocks): saves ~$1,875/month
```

#### Strategy 4: Reduce Chat Context Window (Save 20-30% on input tokens)

```
CURRENT: All previous messages sent every turn (context grows linearly)
OPTIMIZED: Sliding window of last 6 messages + summarized older context

Implementation:
  1. After 6 messages, summarize older messages (1 Haiku call)
  2. Send: system prompt + summary + last 6 messages
  3. Context stays roughly constant instead of growing

Savings estimate:
  Chat session input tokens: 54,000 → ~30,000 (44% savings on input)
  Per session: $0.221 → ~$0.155 (30% savings)
  At 5,000 MAU: saves ~$3,960/month
```

### 7.2 Medium Impact — Implement at Scale

#### Strategy 5: Batch Embedding Calls

```
CURRENT: Individual embedding API call per fact (separate HTTP requests)
OPTIMIZED: Batch multiple facts into single embeddings.create() call

Already partially implemented via embedBatch() in embeddings.ts.
Ensure fact extraction batches all extracted facts in one call.

Savings: Reduces API latency and overhead, minimal cost savings
  (~$0.02/1M tokens means embeddings are already nearly free)
```

#### Strategy 6: Redis Caching for Repeated Queries

```
CURRENT: Every chat session calls buildContext() → fresh DB + embedding queries
OPTIMIZED: Cache student profile + recent context in Redis (TTL: 5 min)

Implementation:
  1. Cache key: `context:${studentId}:${hash(userMessage)}`
  2. On cache hit: skip DB queries and embedding recall
  3. On cache miss: full build, then cache result
  
Savings: Reduces Supabase load, faster responses
  Supabase queries saved: ~50% (profiles rarely change mid-session)
```

#### Strategy 7: Whisper Model Selection by Language

```
CURRENT: Always use whisper-large-v3-turbo for STT
OPTIMIZED: Use distil-whisper-large-v3-en for English-only users

distil-whisper is even faster and cheaper for English-only transcription.
Since PlaceAI targets Indian campus placements (English interviews),
this is a safe optimization.

Savings: ~15-20% on STT costs (already minimal)
```

### 7.3 Low Priority — Future Optimization

#### Strategy 8: Self-Host Whisper on GPU

```
At very high scale (50K+ users), self-hosting Whisper on a GPU instance
is cheaper than Groq API:

  AWS g5.xlarge (A10G GPU): ~$1.00/hr
  Can process: ~200 concurrent streams
  Break-even: ~750 hours of audio/month ($30 on Groq)
  
Only worthwhile at massive scale. Groq is optimal for <50K users.
```

#### Strategy 9: Switch to Anthropic Direct API

```
OpenRouter adds a small markup over direct Anthropic pricing.
At scale, going direct to Anthropic API saves ~5-10%.

Anthropic direct: $3.00/$15.00 per 1M (same as OpenRouter currently)
But OpenRouter provides model fallbacks, load balancing, and observability
that may be worth the markup.

Evaluate at >$10K/month API spend.
```

#### Strategy 10: Implement Usage Quotas

```
Free tier:   5 chat sessions/day, 2 mock interviews/week
Pro tier:    Unlimited chat, 5 mocks/week, voice interviews
Premium:     Everything unlimited, priority API access

This caps costs per user and creates monetization opportunity.
```

### 7.4 Optimization Impact Summary

| Strategy | Complexity | Monthly Savings (5K MAU) | Priority |
|----------|-----------|------------------------|----------|
| Prompt caching | Low | ~$4,000 | **P0 — Do immediately** |
| Haiku for extraction | Low | ~$800 | **P0 — Do immediately** |
| Browser TTS default | Low | ~$1,875 | **P1 — Do at launch** |
| Sliding window context | Medium | ~$3,960 | **P1 — Do at launch** |
| Batch embeddings | Low | ~$50 | P2 |
| Redis context cache | Medium | ~$200 (latency win) | P2 |
| Distil-whisper | Low | ~$30 | P3 |
| Self-host Whisper | High | Varies | P3 (at 50K+) |
| Direct Anthropic API | Low | ~$500 | P3 (at $10K+/mo) |
| Usage quotas | Medium | Caps growth | **P1 — Revenue critical** |

### Total optimized cost (with P0 + P1 strategies):

```
Before optimization (5K MAU):  $20,888/month
After P0 strategies:           $16,088/month  (-23%)
After P0 + P1 strategies:     $10,253/month  (-51%)

Per-user cost drops: $4.18 → $2.05/month
```

---

## 8. Cost Monitoring & Alerts

### 8.1 Metrics to Track

```typescript
// Recommended monitoring for each API call:

interface APICallMetric {
  provider: "openrouter" | "groq" | "supabase" | "upstash";
  model: string;
  feature: "chat" | "mock_voice" | "mock_text" | "resume" | "plan" | "memory";
  inputTokens: number;
  outputTokens: number;
  audioSeconds?: number;      // For Groq STT
  ttsCharacters?: number;     // For OpenAI TTS
  latencyMs: number;
  cost: number;               // Calculated from tokens × price
  studentId: string;
  sessionId: string;
  timestamp: Date;
}
```

### 8.2 Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Daily API spend | >$200 | >$500 | Investigate spike, check for abuse |
| Per-user daily spend | >$5 | >$10 | Rate limit user, check for loops |
| Single request tokens | >50K input | >100K input | Check for context explosion |
| Groq error rate | >5% | >15% | Check API status, enable fallback |
| LLM latency (TTFB) | >3s | >8s | Check OpenRouter status |
| TTS latency | >2s | >5s | Fall back to browser TTS |
| Monthly budget | >80% of budget | >100% | Enable usage quotas |

### 8.3 Logging Implementation

```typescript
// Add to each API route:
async function logAPIUsage(metric: APICallMetric) {
  // 1. Log to Supabase (for analytics dashboard)
  await supabase.from("api_usage_logs").insert(metric);
  
  // 2. Increment Redis counters (for real-time alerts)
  await redis.incrby(`daily_cost:${today}`, Math.round(metric.cost * 10000));
  await redis.incrby(`user_cost:${metric.studentId}:${today}`, Math.round(metric.cost * 10000));
  
  // 3. Check thresholds
  const dailyCost = await redis.get(`daily_cost:${today}`);
  if (dailyCost > 5000000) { // $500
    await alertAdmin("CRITICAL: Daily API spend exceeded $500");
  }
}
```

### 8.4 Budget Dashboard (For Admin)

```
┌──────────────────────────────────────────────────────┐
│ API COST DASHBOARD — April 2026                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Monthly Budget: $25,000    Spent: $12,450 (49.8%)    │
│ ██████████████████████░░░░░░░░░░░░░░░░░░░░ 49.8%     │
│                                                       │
│ Daily Average: $415    Today: $380                    │
│                                                       │
│ BY FEATURE:                                           │
│  Chat:          $8,200  (65.9%)  ████████████████     │
│  Voice Mock:    $2,800  (22.5%)  ██████               │
│  Text Mock:     $650    (5.2%)   ██                   │
│  Resume:        $200    (1.6%)   █                    │
│  Memory:        $450    (3.6%)   █                    │
│  Plans:         $150    (1.2%)   █                    │
│                                                       │
│ BY PROVIDER:                                          │
│  OpenRouter:    $11,800 (94.8%)                       │
│  Groq:          $120    (1.0%)                        │
│  OpenAI TTS:    $530    (4.3%)                        │
│                                                       │
│ TOP USERS (cost):                                     │
│  1. student_abc  $42.50  (38 sessions)               │
│  2. student_def  $35.20  (31 sessions)               │
│  3. student_ghi  $28.10  (25 sessions)               │
│                                                       │
│ ALERTS:                                               │
│  ⚠️ User student_xyz hit daily limit (5 mocks)       │
│  ✅ All API providers healthy                         │
└──────────────────────────────────────────────────────┘
```

---

*This cost analysis should be reviewed monthly as API pricing changes frequently. OpenRouter and Groq both trend toward lower prices over time.*
