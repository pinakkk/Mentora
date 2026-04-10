/**
 * Groq-friendly structured JSON generation.
 *
 * Why this exists
 * ---------------
 * The Vercel AI SDK's `Output.object({ schema })` helper sends
 * `response_format: { type: "json_schema", json_schema: ... }` under the
 * hood. Groq's Llama 3.3 70B does NOT support `json_schema` mode (only
 * `json_object` for some models), so every Output.object call fails with:
 *
 *   AI_APICallError: This model does not support response format `json_schema`.
 *
 * The fix: drop Output.object, ask the model to emit JSON via the prompt,
 * strip any markdown code fences, and validate with Zod ourselves. This
 * keeps us model-agnostic — works on Groq, OpenAI, OpenRouter, anything.
 */

import { generateText, type LanguageModel } from "ai";
import { z } from "zod";

interface GenerateJsonOpts<T> {
  model: LanguageModel;
  prompt: string;
  schema: z.ZodSchema<T>;
  /** Hint for the model — appended to the prompt automatically. */
  jsonInstruction?: string;
  /** Retry once if Zod validation fails (default true). */
  retry?: boolean;
}

const DEFAULT_INSTRUCTION =
  "Return ONLY a valid JSON object. No prose, no markdown code fences, no commentary. Start with `{` and end with `}`.";

/**
 * Generate text from `model` and parse it as JSON validated against `schema`.
 * Throws on irrecoverable parse / validation failures.
 */
export async function generateJson<T>({
  model,
  prompt,
  schema,
  jsonInstruction = DEFAULT_INSTRUCTION,
  retry = true,
}: GenerateJsonOpts<T>): Promise<T> {
  const fullPrompt = `${prompt}\n\n${jsonInstruction}`;

  const attempt = async (extraNote?: string): Promise<T> => {
    const result = await generateText({
      model,
      prompt: extraNote ? `${fullPrompt}\n\n${extraNote}` : fullPrompt,
    });
    const raw = stripFences(result.text);
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new JsonParseError(
        `Model output was not valid JSON: ${(e as Error).message}`,
        raw
      );
    }
    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      throw new JsonSchemaError(
        `Model output failed schema validation: ${validation.error.message}`,
        parsed
      );
    }
    return validation.data;
  };

  try {
    return await attempt();
  } catch (err) {
    if (!retry) throw err;
    if (err instanceof JsonParseError || err instanceof JsonSchemaError) {
      // One retry with a stronger hint, then give up.
      return await attempt(
        "Your previous response was invalid. Return ONLY the JSON object, nothing else."
      );
    }
    throw err;
  }
}

/**
 * Strip ```json … ``` or ``` … ``` fences and surrounding whitespace.
 * Also tries to find the first {…} block if the model added preamble.
 */
export function stripFences(text: string): string {
  let s = text.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json|JSON)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  s = s.trim();
  // If there's still preamble, try to extract the first {...} block.
  if (!s.startsWith("{") && !s.startsWith("[")) {
    const objMatch = s.match(/\{[\s\S]*\}/);
    if (objMatch) return objMatch[0];
    const arrMatch = s.match(/\[[\s\S]*\]/);
    if (arrMatch) return arrMatch[0];
  }
  return s;
}

export class JsonParseError extends Error {
  constructor(message: string, public raw: string) {
    super(message);
    this.name = "JsonParseError";
  }
}

export class JsonSchemaError extends Error {
  constructor(message: string, public parsed: unknown) {
    super(message);
    this.name = "JsonSchemaError";
  }
}
