import { createClient } from "@supabase/supabase-js";
import { embedText } from "./embeddings";
import type { MemoryFact } from "@/types/memory";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class MemoryManager {
  /**
   * Store a new memory fact with embedding
   */
  async storeFact(
    studentId: string,
    fact: string,
    category: string,
    importance: "high" | "medium" | "low" = "medium"
  ): Promise<string | null> {
    // Check for duplicate (cosine similarity > 0.9)
    const isDuplicate = await this.isDuplicate(studentId, fact);
    if (isDuplicate) return null;

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
   * Recall relevant memories for a given query
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
   * Get all facts for a student (for Coach's Notebook)
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
   * Store a conversation summary with embedding
   */
  async storeConversationSummary(
    studentId: string,
    conversationId: string,
    summary: string
  ): Promise<void> {
    const embedding = await embedText(summary);

    await supabase.from("conversation_summaries").insert({
      id: crypto.randomUUID(),
      student_id: studentId,
      conversation_id: conversationId,
      summary,
      embedding: JSON.stringify(embedding),
    });
  }

  /**
   * Get recent conversation summaries
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
