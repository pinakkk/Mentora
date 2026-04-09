import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── SPEECH-TO-TEXT (Whisper) ────────────────────────────

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(audioBuffer);
  const file = new File([uint8], "audio.webm", { type: "audio/webm" });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    language: "en",
    response_format: "json",
  });

  return transcription.text;
}

// ─── TEXT-TO-SPEECH (Orpheus) ────────────────────────────

export async function generateSpeech(text: string): Promise<ArrayBuffer> {
  const response = await groq.audio.speech.create({
    model: "playai/play-dialog",
    input: text,
    voice: "Arista-PlayDialog",
    response_format: "wav",
  });

  return await response.arrayBuffer();
}

// ─── LLM CHAT (for evaluation, debrief) ─────────────────

export async function chatCompletion(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content || "";
}

export { groq };
