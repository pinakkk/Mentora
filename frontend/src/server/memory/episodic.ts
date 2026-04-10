import { getRedis } from "@/lib/redis";

/**
 * EPISODIC MEMORY (Layer 2 of the 3-layer memory architecture).
 *
 *   Layer 1: Working memory      — in-request only (the messages array)
 *   Layer 2: Episodic memory     — Redis, TTL'd, hot recent context     ← this file
 *   Layer 3: Semantic memory     — pgvector, permanent, dedup'd facts
 *
 * What lives here:
 *   - Last N conversation summaries (most recent 5)
 *   - Recently extracted facts (so we don't have to embed-search them again)
 *   - Last interaction timestamp
 *   - Last detected emotional state (for the burnout / escalation pipeline)
 *
 * Everything is keyed by `studentId`. TTLs let stale episodic context fall
 * out automatically — refreshed on each touch.
 *
 * If Redis isn't configured (`getRedis()` returns null) every function in
 * here is a safe no-op. Callers must already handle that gracefully.
 */

const TTL_SUMMARIES_SEC = 60 * 60 * 24 * 7;       // 7 days
const TTL_FACTS_SEC     = 60 * 60 * 24 * 3;       // 3 days
const TTL_STATE_SEC     = 60 * 60 * 24 * 14;      // 14 days

const MAX_SUMMARIES = 5;
const MAX_HOT_FACTS = 20;

const k = {
  summaries: (sid: string) => `placeai:ep:summaries:${sid}`,
  hotFacts:  (sid: string) => `placeai:ep:hotfacts:${sid}`,
  state:     (sid: string) => `placeai:ep:state:${sid}`,
};

export interface EpisodicSummary {
  text: string;
  createdAt: string;
}

export interface EpisodicHotFact {
  fact: string;
  category: string;
  importance: string;
  createdAt: string;
}

export interface EpisodicState {
  lastInteractionAt: string;
  emotionalState?: "neutral" | "frustrated" | "burnout" | "anxious" | "engaged";
  emotionConfidence?: number;
  consecutiveLowEngagement?: number;
}

// ─── SUMMARIES ───────────────────────────────────────────

export async function pushSummary(
  studentId: string,
  text: string
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const entry: EpisodicSummary = { text, createdAt: new Date().toISOString() };
  // Use a Redis list as a capped FIFO of recent summaries.
  await redis.lpush(k.summaries(studentId), JSON.stringify(entry));
  await redis.ltrim(k.summaries(studentId), 0, MAX_SUMMARIES - 1);
  await redis.expire(k.summaries(studentId), TTL_SUMMARIES_SEC);
}

export async function getRecentSummaries(
  studentId: string,
  limit = MAX_SUMMARIES
): Promise<EpisodicSummary[]> {
  const redis = getRedis();
  if (!redis) return [];
  const raw = (await redis.lrange(k.summaries(studentId), 0, limit - 1)) || [];
  return raw
    .map((r) => safeParse<EpisodicSummary>(r))
    .filter((x): x is EpisodicSummary => x !== null);
}

// ─── HOT FACTS ───────────────────────────────────────────

export async function pushHotFact(
  studentId: string,
  fact: EpisodicHotFact
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.lpush(k.hotFacts(studentId), JSON.stringify(fact));
  await redis.ltrim(k.hotFacts(studentId), 0, MAX_HOT_FACTS - 1);
  await redis.expire(k.hotFacts(studentId), TTL_FACTS_SEC);
}

export async function getHotFacts(
  studentId: string,
  limit = MAX_HOT_FACTS
): Promise<EpisodicHotFact[]> {
  const redis = getRedis();
  if (!redis) return [];
  const raw = (await redis.lrange(k.hotFacts(studentId), 0, limit - 1)) || [];
  return raw
    .map((r) => safeParse<EpisodicHotFact>(r))
    .filter((x): x is EpisodicHotFact => x !== null);
}

// ─── STATE ───────────────────────────────────────────────

export async function setEpisodicState(
  studentId: string,
  patch: Partial<EpisodicState>
): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  const current = (await getEpisodicState(studentId)) || {
    lastInteractionAt: new Date().toISOString(),
  };
  const next: EpisodicState = { ...current, ...patch };
  await redis.set(k.state(studentId), JSON.stringify(next), {
    ex: TTL_STATE_SEC,
  });
}

export async function getEpisodicState(
  studentId: string
): Promise<EpisodicState | null> {
  const redis = getRedis();
  if (!redis) return null;
  const raw = await redis.get<string>(k.state(studentId));
  if (!raw) return null;
  // Upstash sometimes returns parsed objects directly when storing JSON-ish
  // strings — handle both cases.
  if (typeof raw === "object") return raw as EpisodicState;
  return safeParse<EpisodicState>(raw);
}

export async function touchInteraction(studentId: string): Promise<void> {
  await setEpisodicState(studentId, {
    lastInteractionAt: new Date().toISOString(),
  });
}

// ─── INTERNAL ────────────────────────────────────────────

function safeParse<T>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as T;
  try {
    return JSON.parse(raw as string) as T;
  } catch {
    return null;
  }
}
