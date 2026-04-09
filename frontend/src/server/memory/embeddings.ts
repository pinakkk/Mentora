import OpenAI from "openai";

const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function embedText(text: string): Promise<number[]> {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set — returning zero embedding");
    return new Array(1536).fill(0);
  }

  const response = await openrouter.embeddings.create({
    model: "openai/text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  if (!process.env.OPENROUTER_API_KEY) {
    console.error("OPENROUTER_API_KEY is not set — returning zero embeddings");
    return texts.map(() => new Array(1536).fill(0));
  }

  const response = await openrouter.embeddings.create({
    model: "openai/text-embedding-3-small",
    input: texts,
    dimensions: 1536,
  });
  return response.data.map((d) => d.embedding);
}
