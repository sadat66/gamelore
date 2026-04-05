-- Groq nomic-embed-text-v1_5 uses 768 dimensions (replaces OpenAI 1536).
-- Existing vectors are incompatible; clear chunks (re-upload lore after this migration).

drop index if exists public.lore_chunks_embedding_hnsw;

drop function if exists public.match_lore_chunks(uuid, extensions.vector(1536), int);

delete from public.lore_chunks;

alter table public.lore_chunks
  alter column embedding type extensions.vector(768);

create index lore_chunks_embedding_hnsw
  on public.lore_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_lore_chunks(
  p_game_id uuid,
  p_query_embedding extensions.vector(768),
  p_match_count int default 8
)
returns table (
  content text,
  similarity float,
  metadata jsonb
)
language sql
stable
set search_path = public, extensions
as $$
  select
    c.content,
    (1 - (c.embedding <=> p_query_embedding))::float as similarity,
    c.metadata
  from public.lore_chunks c
  where c.game_id = p_game_id
  order by c.embedding <=> p_query_embedding
  limit least(p_match_count, 32);
$$;

revoke all on function public.match_lore_chunks(uuid, extensions.vector(768), int) from public;
grant execute on function public.match_lore_chunks(uuid, extensions.vector(768), int) to service_role;
