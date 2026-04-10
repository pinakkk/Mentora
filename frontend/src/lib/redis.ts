import { Redis } from "@upstash/redis";

/**
 * Shared Upstash Redis client.
 *
 * Used by:
 *  - lib/ratelimit.ts            — sliding-window rate limits on expensive routes
 *  - server/memory/episodic.ts   — Layer-2 episodic memory cache (TTL'd)
 *
 * The client is intentionally lazy / safe-degraded:
 *  - When the env vars are missing (e.g. local dev without Upstash), we return
 *    `null` instead of throwing, and call sites must handle that — every
 *    consumer is written to be a no-op when Redis is unavailable.
 */

let _redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (_redis !== undefined) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn(
      "[redis] UPSTASH_REDIS_REST_URL/TOKEN not set — Redis features will be disabled"
    );
    _redis = null;
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

export const redisAvailable = (): boolean => getRedis() !== null;
