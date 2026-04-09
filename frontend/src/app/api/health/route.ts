import { NextResponse } from "next/server";
import { getHealthReport } from "@/server/health/checks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const report = await getHealthReport();
  const statusCode = report.status === "down" ? 503 : 200;

  return NextResponse.json(report, {
    status: statusCode,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
