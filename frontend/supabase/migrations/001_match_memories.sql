-- Enable pgvector if not already enabled
create extension if not exists vector;

-- RPC function for semantic memory search using cosine similarity
create or replace function match_memories(
  query_embedding text,
  match_threshold float,
  match_count int,
  filter_student_id uuid
)
returns table (
  id uuid,
  fact text,
  category text,
  importance text,
  similarity float
)
language plpgsql
as $$
begin
  return query
    select
      mf.id,
      mf.fact,
      mf.category::text,
      mf.importance::text,
      1 - (mf.embedding <=> query_embedding::vector) as similarity
    from memory_facts mf
    where mf.student_id = filter_student_id
      and mf.embedding is not null
      and 1 - (mf.embedding <=> query_embedding::vector) > match_threshold
    order by mf.embedding <=> query_embedding::vector
    limit match_count;
end;
$$;
