-- Explicit grants for PostgREST / supabase-js (Data API).
-- New Supabase projects (from ~May 30) no longer grant Data API roles access to
-- new public tables by default; existing projects follow later. RLS still applies
-- after these privileges — they only allow the role to attempt the operation.

grant usage on schema public to anon, authenticated, service_role;

-- profiles: row insert is via trigger (security definer); users select/update own
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- games, lore_documents: authenticated operations are constrained by RLS
grant select, insert, update, delete on public.games to authenticated;
grant all on public.games to service_role;

grant select, insert, update, delete on public.lore_documents to authenticated;
grant all on public.lore_documents to service_role;

-- lore_chunks: clients get no rows (RLS); service_role used for ingestion + match_lore_chunks
grant select on public.lore_chunks to authenticated;
grant all on public.lore_chunks to service_role;
