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
  /** SHA-256 of the raw PDF bytes — hex. Used as a cache key. */
  contentHash: string;
}

const MAX_RESUME_CHARS = 18_000; // ~5–6k tokens; plenty for a CV

/**
 * Fetch a PDF from a public URL and extract its text.
 *
 * Throws on network or parse errors — let the route handler turn them into
 * a 4xx/5xx Response.
 */
export async function parseResumeFromUrl(url: string): Promise<ParsedResume> {
  // Allow CDN caching — the storage URL is content-addressed by upload timestamp
  // so the bytes never change for a given URL. `no-store` was blocking reuse
  // between the upload and the analyze round-trip.
  const res = await fetch(url);
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
  // Hash and parse in parallel — both are independent CPU/IO work.
  const [contentHash, parsed] = await Promise.all([
    sha256Hex(bytes),
    (async () => {
      const pdf = await getDocumentProxy(bytes);
      return extractText(pdf, { mergePages: true });
    })(),
  ]);

  // unpdf returns either a string (mergePages=true) or string[] (mergePages=false).
  // We asked for merged so it should be a string, but be defensive.
  const fullText = Array.isArray(parsed.text) ? parsed.text.join("\n\n") : parsed.text;
  const cleaned = normalizeWhitespace(fullText);
  const truncated = cleaned.length > MAX_RESUME_CHARS;
  const text = truncated ? cleaned.slice(0, MAX_RESUME_CHARS) : cleaned;

  return {
    text,
    numPages: parsed.totalPages,
    truncated,
    contentHash,
  };
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // Copy into a fresh ArrayBuffer — Uint8Array<ArrayBufferLike> (which may
  // be backed by SharedArrayBuffer) isn't assignable to SubtleCrypto's
  // BufferSource under strict TS settings.
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const digest = await crypto.subtle.digest("SHA-256", ab);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeWhitespace(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
