-- pgvector + game-scoped lore for RAG
create extension if not exists vector with schema extensions;

-- ---------------------------------------------------------------------------
-- Profiles (admin flag)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
where not exists (select 1 from public.profiles p where p.id = auth.users.id)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Games
-- ---------------------------------------------------------------------------
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  thumbnail_path text,
  created_at timestamptz not null default now()
);

create index if not exists games_slug_idx on public.games (slug);

alter table public.games enable row level security;

create policy "games_select_authenticated"
  on public.games for select
  to authenticated
  using (true);

create policy "games_admin_all"
  on public.games for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- Uploaded source documents (metadata only; files live in Storage)
-- ---------------------------------------------------------------------------
create table if not exists public.lore_documents (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'ready', 'error')),
  error_message text,
  chunk_count int not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists lore_documents_game_id_idx on public.lore_documents (game_id);

alter table public.lore_documents enable row level security;

create policy "lore_documents_select_admin"
  on public.lore_documents for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

create policy "lore_documents_insert_admin"
  on public.lore_documents for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

create policy "lore_documents_update_admin"
  on public.lore_documents for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

-- ---------------------------------------------------------------------------
-- Chunk embeddings (no direct client access; use service role + RPC)
-- ---------------------------------------------------------------------------
create table if not exists public.lore_chunks (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  document_id uuid not null references public.lore_documents (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding extensions.vector(1536) not null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists lore_chunks_game_id_idx on public.lore_chunks (game_id);
create index if not exists lore_chunks_document_id_idx on public.lore_chunks (document_id);

create index if not exists lore_chunks_embedding_hnsw
  on public.lore_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

alter table public.lore_chunks enable row level security;

-- Block anon/authenticated table reads; server uses service role.
create policy "lore_chunks_no_direct"
  on public.lore_chunks for select
  to authenticated
  using (false);

-- ---------------------------------------------------------------------------
-- Similarity search (called from backend with service role)
-- ---------------------------------------------------------------------------
create or replace function public.match_lore_chunks(
  p_game_id uuid,
  p_query_embedding extensions.vector(1536),
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

revoke all on function public.match_lore_chunks(uuid, extensions.vector, int) from public;
grant execute on function public.match_lore_chunks(uuid, extensions.vector, int) to service_role;

-- ---------------------------------------------------------------------------
-- Storage buckets (Supabase Storage)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('game-thumbnails', 'game-thumbnails', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('lore-sources', 'lore-sources', false)
on conflict (id) do nothing;

-- Public read for game thumbnails
create policy "game_thumbnails_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'game-thumbnails');

-- Admins manage thumbnails
create policy "game_thumbnails_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'game-thumbnails'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

create policy "game_thumbnails_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'game-thumbnails'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

create policy "game_thumbnails_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'game-thumbnails'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

-- Lore source files: admins only
create policy "lore_sources_admin_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lore-sources'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

create policy "lore_sources_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'lore-sources'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );

create policy "lore_sources_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'lore-sources'
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.is_admin = true
    )
  );
