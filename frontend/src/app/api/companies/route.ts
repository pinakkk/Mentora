import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const serviceClient = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: companies } = await serviceClient
    .from("companies")
    .select("*, company_requirements(*)")
    .order("visit_date", { ascending: true });

  return NextResponse.json({ companies: companies || [] });
}
