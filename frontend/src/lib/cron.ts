/**
 * Cron auth helper.
 *
 * All /api/cron/* routes must be invoked with one of:
 *   - Authorization: Bearer ${CRON_SECRET}            (Vercel Cron header)
 *   - x-cron-secret: ${CRON_SECRET}
 *
 * If CRON_SECRET is not set we deny everything (fail-closed).
 */

export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization") || "";
  const headerSecret = req.headers.get("x-cron-secret") || "";

  if (authHeader === `Bearer ${secret}`) return true;
  if (headerSecret === secret) return true;
  return false;
}

export function unauthorizedCronResponse(): Response {
  return new Response(
    JSON.stringify({ error: "Cron unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
