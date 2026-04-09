import { createClient } from "@/lib/supabase/server";
import { generateSpeech } from "@/lib/groq/client";

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
    const audioBuffer = await generateSpeech(text);

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    // Return error so client can fall back to browser TTS
    return Response.json(
      { error: "TTS generation failed", fallbackToBrowser: true },
      { status: 500 }
    );
  }
}
