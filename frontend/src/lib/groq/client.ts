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
// Groq Orpheus has a 200-character limit per request.
// We split longer text into chunks at sentence boundaries.

function splitTextForTTS(text: string, maxLen = 190): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Find the best split point (sentence boundary within limit)
    let splitAt = -1;
    for (const delim of [". ", "? ", "! ", "; ", ", "]) {
      const idx = remaining.lastIndexOf(delim, maxLen);
      if (idx > 0 && idx > splitAt) {
        splitAt = idx + delim.length;
      }
    }

    // If no sentence boundary found, split at space
    if (splitAt <= 0) {
      splitAt = remaining.lastIndexOf(" ", maxLen);
    }
    // Last resort: hard cut
    if (splitAt <= 0) {
      splitAt = maxLen;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Generate speech for a single chunk (must be <=200 chars).
 * Returns a complete, self-contained audio buffer.
 */
export async function generateSpeechChunk(text: string): Promise<ArrayBuffer> {
  const response = await groq.audio.speech.create({
    model: "canopylabs/orpheus-v1-english",
    input: text.slice(0, 200),
    voice: "troy",
    response_format: "wav",
  });

  return await response.arrayBuffer();
}

/**
 * Split text into TTS-safe chunks and generate audio for each.
 * Returns an array of base64-encoded wav segments.
 */
export async function generateSpeechSegments(text: string): Promise<string[]> {
  const chunks = splitTextForTTS(text);
  const segments: string[] = [];

  for (const chunk of chunks) {
    const buffer = await generateSpeechChunk(chunk);
    const base64 = Buffer.from(buffer).toString("base64");
    segments.push(base64);
  }

  return segments;
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
