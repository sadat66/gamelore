/**
 * Canonical genres for admin dropdowns and dashboard filters.
 * Stored as plain text on `games.genre`; legacy values still display and filter.
 */
export const GAME_GENRES = [
  "Action",
  "Action-Adventure",
  "Action RPG",
  "Adventure",
  "Battle Royale",
  "Fighting",
  "FPS",
  "Horror",
  "Metroidvania",
  "MMORPG",
  "MOBA",
  "Platformer",
  "Puzzle",
  "Racing",
  "Roguelike",
  "RPG",
  "Sandbox",
  "Simulation",
  "Sports",
  "Strategy",
  "Survival",
  "Turn-Based",
  "Visual Novel",
] as const;

export type GameGenre = (typeof GAME_GENRES)[number];

const CANON = new Set<string>(GAME_GENRES);

export function isCanonicalGenre(value: string | null | undefined): value is GameGenre {
  return value != null && CANON.has(value);
}

/** Returns null for empty; throws nothing — use after trim for API validation. */
export function parseCanonicalGenreOrNull(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  return CANON.has(t) ? t : null;
}

/** Genres present in data but not in the canonical list (for filter UI). */
export function extraGenresFromGames(genres: (string | null)[]): string[] {
  const out = new Set<string>();
  for (const g of genres) {
    const t = g?.trim();
    if (t && !CANON.has(t)) out.add(t);
  }
  return [...out].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
