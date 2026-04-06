-- Optional genre label for games (browse/sort in dashboard)
alter table public.games
  add column if not exists genre text;

create index if not exists games_genre_idx on public.games (genre);
