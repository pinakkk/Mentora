import { createClient } from "@supabase/supabase-js";
import { embedText } from "./embeddings";
import { pushHotFact, pushSummary, getHotFacts } from "./episodic";
import type { MemoryFact } from "@/types/memory";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * MemoryManager — façade over the 3-layer memory system.
 *
 *   storeFact()       → writes to Layer 3 (pgvector) AND mirrors to Layer 2
 *                       (Redis hot cache) so the next chat turn doesn't have
 *                       to embed-search to find a fact we just learned.
 *
 *   recall()          → semantic search against pgvector. Used by the
 *                       context builder which also reads the Redis hot list.
 *
 *   storeConversationSummary() → writes summary to Layer 2 episodic Redis
 *                                AND persists in conversations.summary so it
 *                                survives Redis evictions.
 */
export class MemoryManager {
  /**
   * Store a new memory fact with embedding (Layer 3 + Layer 2 mirror).
   */
  async storeFact(
    studentId: string,
    fact: string,
    category: string,
    importance: "high" | "medium" | "low" = "medium"
  ): Promise<string | null> {
    // Check for duplicate (cosine similarity > 0.9)
    const isDup = await this.isDuplicate(studentId, fact);
    if (isDup) return null;

    const embedding = await embedText(fact);

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("memory_facts")
      .insert({
        id: crypto.randomUUID(),
        student_id: studentId,
        fact,
        category,
        importance,
        embedding: JSON.stringify(embedding),
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error storing fact:", error);
      return null;
    }

    // Mirror to episodic hot cache (non-blocking — fire & log).
    pushHotFact(studentId, {
      fact,
      category,
      importance,
      createdAt: now,
    }).catch((e) => console.warn("[memory] episodic mirror failed:", e));

    return data.id;
  }

  /**
   * Check if a similar fact already exists (cosine similarity > 0.9)
   */
  async isDuplicate(studentId: string, fact: string): Promise<boolean> {
    const embedding = await embedText(fact);

    const { data } = await supabase.rpc("match_memories", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: 0.9,
      match_count: 1,
      filter_student_id: studentId,
    });

    return data && data.length > 0;
  }

  /**
   * Recall relevant memories for a given query (Layer 3 — pgvector).
   */
  async recall(
    studentId: string,
    query: string,
    limit: number = 10,
    threshold: number = 0.5
  ): Promise<MemoryFact[]> {
    const embedding = await embedText(query);

    const { data, error } = await supabase.rpc("match_memories", {
      query_embedding: JSON.stringify(embedding),
      match_threshold: threshold,
      match_count: limit,
      filter_student_id: studentId,
    });

    if (error) {
      console.error("Error recalling memories:", error);
      return [];
    }

    return (data || []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      studentId,
      fact: d.fact as string,
      category: d.category as MemoryFact["category"],
      importance: d.importance as MemoryFact["importance"],
      similarity: d.similarity as number,
      createdAt: "",
      updatedAt: "",
    }));
  }

  /**
   * Read facts from the Redis hot cache (Layer 2). Cheap, no embedding call.
   * Returns an empty list if Redis isn't configured.
   */
  async hotFacts(studentId: string, limit = 10): Promise<MemoryFact[]> {
    const hot = await getHotFacts(studentId, limit);
    return hot.map((h, i) => ({
      id: `hot:${i}`,
      studentId,
      fact: h.fact,
      category: h.category as MemoryFact["category"],
      importance: h.importance as MemoryFact["importance"],
      createdAt: h.createdAt,
      updatedAt: h.createdAt,
    }));
  }

  /**
   * Get all facts for a student (for Coach's Notebook UI)
   */
  async getAllFacts(studentId: string): Promise<MemoryFact[]> {
    const { data, error } = await supabase
      .from("memory_facts")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting facts:", error);
      return [];
    }

    return (data || []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      studentId: d.student_id as string,
      fact: d.fact as string,
      category: d.category as MemoryFact["category"],
      importance: d.importance as MemoryFact["importance"],
      createdAt: d.created_at as string,
      updatedAt: d.updated_at as string,
    }));
  }

  /**
   * Persist a conversation summary BOTH in Postgres (durable) and Redis
   * (hot episodic cache). The pgvector embedding is best-effort.
   */
  async storeConversationSummary(
    studentId: string,
    conversationId: string,
    summary: string
  ): Promise<void> {
    // Update the existing conversation row with the summary text + embedding.
    let embeddingJson: string | null = null;
    try {
      const emb = await embedText(summary);
      embeddingJson = JSON.stringify(emb);
    } catch (e) {
      console.warn("[memory] summary embedding failed (continuing):", e);
    }

    const updates: Record<string, unknown> = { summary };
    if (embeddingJson) updates.summary_embedding = embeddingJson;

    const { error } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", conversationId);

    if (error) {
      console.error("[memory] conversation summary persist failed:", error);
    }

    // Mirror into episodic Layer-2 cache.
    pushSummary(studentId, summary).catch((e) =>
      console.warn("[memory] episodic summary push failed:", e)
    );
  }

  /**
   * Get recent conversation summaries from Postgres (durable fallback).
   * The context builder prefers Redis but falls back here.
   */
  async getRecentSummaries(studentId: string, limit: number = 3) {
    const { data } = await supabase
      .from("conversations")
      .select("id, summary, created_at")
      .eq("student_id", studentId)
      .not("summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  }
}

export const memoryManager = new MemoryManager();
