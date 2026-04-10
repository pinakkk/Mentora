/**
 * F7 — Proactive nudges cron.
 *
 * Runs the accountability sweep across all students and persists nudges.
 * Schedule daily (or every 6h) via Vercel Cron in vercel.json:
 *
 *   {
 *     "crons": [
 *       { "path": "/api/cron/nudges", "schedule": "0 9 * * *" }
 *     ]
 *   }
 */

import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCronResponse } from "@/lib/cron";
import { runAccountabilitySweep } from "@/server/agents/accountability";

export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return unauthorizedCronResponse();

  const startedAt = Date.now();
  const results = await runAccountabilitySweep({ limit: 200 });
  const elapsedMs = Date.now() - startedAt;

  return NextResponse.json({
    ok: true,
    sentNudges: results.length,
    escalated: results.filter((r) => r.escalated).length,
    byLevel: {
      l1: results.filter((r) => r.level === 1).length,
      l2: results.filter((r) => r.level === 2).length,
      l3: results.filter((r) => r.level === 3).length,
    },
    elapsedMs,
  });
}

// Vercel Cron sends GET, but allow POST for manual triggers from local dev / tools.
export const POST = GET;
