import { createClient } from "@/lib/supabase/server";
import { generateSpeechSegments } from "@/lib/groq/client";

export const maxDuration = 30;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await req.json();

  if (!text) {
    return Response.json({ error: "No text provided" }, { status: 400 });
  }

  try {
    const segments = await generateSpeechSegments(text);

    return Response.json({
      success: true,
      segments, // array of base64-encoded wav audio chunks
      format: "wav",
    });
  } catch (error) {
    console.error("TTS error:", error);
    return Response.json(
      { error: "TTS generation failed", fallbackToBrowser: true },
      { status: 500 }
    );
  }
}
