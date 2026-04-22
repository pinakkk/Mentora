import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

/**
 * Rate limiting helpers.
 *
 * Each "kind" maps to a sliding-window quota tuned to the per-call cost of the
 * route. If Upstash is not configured, `enforce()` becomes a no-op so that
 * local dev / preview deploys keep working — but we log a warning so it's
 * obvious when going to prod.
 */

type Kind =
  | "chat"           // streaming Coach chat (LLM-heavy)
  | "interview"      // mock interview prepare/evaluate (Sonnet + Groq)
  | "resume"         // resume parse + diagnostic + auto-plan
  | "diagnostic"     // GitHub/LinkedIn audit, micro-assessment
  | "default";       // catch-all

interface Quota {
  requests: number;
  windowSec: number;
}

const QUOTAS: Record<Kind, Quota> = {
  chat:       { requests: 30, windowSec: 60 },          // 30 chat turns / minute
  interview:  { requests: 20, windowSec: 60 },          // 20 question evals / minute
  resume:     { requests: 5,  windowSec: 60 * 60 },     // 5 resume analyses / hour
  diagnostic: { requests: 10, windowSec: 60 * 60 },     // 10 audits / hour
  default:    { requests: 60, windowSec: 60 },
};

const _cache = new Map<Kind, Ratelimit | null>();

function limiterFor(kind: Kind): Ratelimit | null {
  if (_cache.has(kind)) return _cache.get(kind)!;

  const redis = getRedis();
  if (!redis) {
    _cache.set(kind, null);
    return null;
  }

  const quota = QUOTAS[kind];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(quota.requests, `${quota.windowSec} s`),
    analytics: false,
    prefix: `mentora:rl:${kind}`,
  });
  _cache.set(kind, limiter);
  return limiter;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetSec: number;
}

/**
 * Returns a limit decision for `identifier`. If Upstash isn't configured,
 * returns `{ ok: true }` so the route doesn't break in dev.
 *
 * Identifier should be the authenticated user id (or IP fallback).
 */
export async function checkRateLimit(
  kind: Kind,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = limiterFor(kind);
  if (!limiter) return { ok: true, remaining: -1, resetSec: 0 };

  const { success, remaining, reset } = await limiter.limit(identifier);
  return {
    ok: success,
    remaining,
    resetSec: Math.max(0, Math.ceil((reset - Date.now()) / 1000)),
  };
}

/**
 * Convenience wrapper for route handlers — returns a 429 Response if blocked,
 * `null` if the request should proceed.
 *
 *   const blocked = await rateLimitOrReject("chat", user.id);
 *   if (blocked) return blocked;
 */
export async function rateLimitOrReject(
  kind: Kind,
  identifier: string
): Promise<Response | null> {
  const result = await checkRateLimit(kind, identifier);
  if (result.ok) return null;

  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      retryAfterSec: result.resetSec,
      message: `Too many requests. Try again in ${result.resetSec}s.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.resetSec),
        "X-RateLimit-Remaining": String(result.remaining),
      },
    }
  );
}
