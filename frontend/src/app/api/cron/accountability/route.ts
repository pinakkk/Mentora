/**
 * F8/F9 — Accountability + Escalation cron.
 *
 * Wraps the same sweep as /api/cron/nudges but allows running it more
 * frequently (e.g. every 6h) so the escalation pipeline triggers fast
 * for at-risk students.
 *
 * vercel.json example:
 *   { "path": "/api/cron/accountability", "schedule": "0 *\/6 * * *" }
 */

import { NextResponse } from "next/server";
import { isAuthorizedCron, unauthorizedCronResponse } from "@/lib/cron";
import { runAccountabilitySweep } from "@/server/agents/accountability";

export const maxDuration = 300;

export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) return unauthorizedCronResponse();

  const results = await runAccountabilitySweep({ limit: 200 });
  return NextResponse.json({
    ok: true,
    processed: results.length,
    escalations: results
      .filter((r) => r.escalated)
      .map((r) => ({
        studentId: r.studentId,
        studentName: r.studentName,
        level: r.level,
      })),
  });
}

export const POST = GET;
