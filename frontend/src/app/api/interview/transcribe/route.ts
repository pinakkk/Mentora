import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/groq/client";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile) {
    return Response.json({ error: "No audio file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await audioFile.arrayBuffer());

  // Skip very short recordings
  if (buffer.length < 1000) {
    return Response.json(
      { error: "Audio too short. Please try again." },
      { status: 400 }
    );
  }

  const text = await transcribeAudio(buffer);

  return Response.json({ success: true, text });
}
