import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await serviceClient.storage
      .from("resumes")
      .upload(fileName, arrayBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = serviceClient.storage
      .from("resumes")
      .getPublicUrl(data.path);

    // Update student's resume URL
    await serviceClient
      .from("students")
      .update({ resume_url: urlData.publicUrl })
      .eq("auth_id", user.id);

    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (err) {
    console.error("Resume upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
