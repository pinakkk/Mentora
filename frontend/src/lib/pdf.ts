/**
 * Serverless-friendly PDF text extraction.
 *
 * Uses `unpdf` (a serverless build of pdfjs-dist) — works on Vercel/Edge/Node
 * without binary deps. The legacy `pdf-parse` package pulls in a node-only
 * test fixture path that breaks in serverless bundles, so we don't use it.
 */

import { extractText, getDocumentProxy } from "unpdf";

export interface ParsedResume {
  text: string;
  numPages: number;
  truncated: boolean;
}

const MAX_RESUME_CHARS = 18_000; // ~5–6k tokens; plenty for a CV

/**
 * Fetch a PDF from a public URL and extract its text.
 *
 * Throws on network or parse errors — let the route handler turn them into
 * a 4xx/5xx Response.
 */
export async function parseResumeFromUrl(url: string): Promise<ParsedResume> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch resume PDF: ${res.status} ${res.statusText}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("pdf") && !url.toLowerCase().endsWith(".pdf")) {
    // Some Supabase storage URLs don't return content-type — only fail if both
    // header AND extension look wrong.
    throw new Error(`Resume URL is not a PDF (content-type: ${contentType})`);
  }

  const buf = await res.arrayBuffer();
  return await parseResumeFromBuffer(new Uint8Array(buf));
}

/**
 * Extract text from an in-memory PDF buffer.
 */
export async function parseResumeFromBuffer(
  bytes: Uint8Array
): Promise<ParsedResume> {
  const pdf = await getDocumentProxy(bytes);
  const result = await extractText(pdf, { mergePages: true });

  // unpdf returns either a string (mergePages=true) or string[] (mergePages=false).
  // We asked for merged so it should be a string, but be defensive.
  const fullText = Array.isArray(result.text) ? result.text.join("\n\n") : result.text;
  const cleaned = normalizeWhitespace(fullText);
  const truncated = cleaned.length > MAX_RESUME_CHARS;
  const text = truncated ? cleaned.slice(0, MAX_RESUME_CHARS) : cleaned;

  return {
    text,
    numPages: result.totalPages,
    truncated,
  };
}

function normalizeWhitespace(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
