const GAMESPOT_API_BASE = "https://www.gamespot.com/api";

/** GameSpot requires a non-generic User-Agent; override in .env.local with your contact info. */
const DEFAULT_USER_AGENT =
  "Gamelore/1.0 (+https://www.gamespot.com/api/; set GAMESPOT_USER_AGENT for your email or site)";

export const GAMESPOT_ALLOWED_ENDPOINTS = [
  "games",
  "reviews",
  "articles",
  "videos",
  "images",
] as const;

export type GamespotListEndpoint = (typeof GAMESPOT_ALLOWED_ENDPOINTS)[number];

export function isGamespotListEndpoint(s: string): s is GamespotListEndpoint {
  return (GAMESPOT_ALLOWED_ENDPOINTS as readonly string[]).includes(s);
}

export function getGamespotConfig(): { apiKey: string; userAgent: string } | null {
  const apiKey = process.env.GAMESPOT_API_KEY?.trim();
  if (!apiKey) return null;
  const userAgent =
    process.env.GAMESPOT_USER_AGENT?.trim() || DEFAULT_USER_AGENT;
  return { apiKey, userAgent };
}

/** Server-side call to GameSpot list endpoints (API key stays on the server). */
export async function fetchGamespotApi(
  endpoint: GamespotListEndpoint,
  params: Record<string, string> = {},
): Promise<Response> {
  const cfg = getGamespotConfig();
  if (!cfg) {
    throw new Error("MISSING_GAMESPOT_CONFIG");
  }

  const url = new URL(`${GAMESPOT_API_BASE}/${endpoint}/`);
  url.searchParams.set("api_key", cfg.apiKey);
  url.searchParams.set("format", "json");
  for (const [key, val] of Object.entries(params)) {
    if (val) url.searchParams.set(key, val);
  }

  return fetch(url.toString(), {
    headers: {
      "User-Agent": cfg.userAgent,
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });
}

export interface GameNews {
  id: number;
  title: string;
  summary: string;
  thumbnail: string;
  published_at: string;
  url: string;
}

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=800&auto=format&fit=crop";

function pickImageUrl(image: unknown): string {
  if (!image || typeof image !== "object") return FALLBACK_THUMB;
  const img = image as Record<string, unknown>;

  // Prefer largest assets first (GameSpot often includes `original` + only tiny string URLs).
  const hiResStringKeys = [
    "original",
    "super_url",
    "screen_url",
    "medium_url",
    "screen_large",
    "screen_medium",
  ] as const;
  for (const key of hiResStringKeys) {
    const v = img[key];
    if (typeof v === "string" && v.length > 0) return v;
  }

  const maybeObjectUrlKeys = [
    "screen_large",
    "screen_medium",
    "screen_small",
    "square_small",
  ] as const;
  for (const key of maybeObjectUrlKeys) {
    const v = img[key];
    if (typeof v === "string" && v.length > 0) return v;
    if (v && typeof v === "object") {
      const u = (v as { url?: string }).url;
      if (typeof u === "string" && u.length > 0) return u;
    }
  }

  for (const key of ["thumb_url", "icon_url", "screen_tiny", "square_tiny"] as const) {
    const v = img[key];
    if (typeof v === "string" && v.length > 0) return v;
  }

  return FALLBACK_THUMB;
}

function mapArticleToGameNews(raw: unknown): GameNews | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  const id = Number(a.id);
  if (!Number.isFinite(id)) return null;
  const title = typeof a.title === "string" ? a.title : "";
  if (!title) return null;

  const summary =
    typeof a.deck === "string" && a.deck.length > 0
      ? a.deck
      : "Read the full article on GameSpot.";

  const url =
    typeof a.site_detail_url === "string" && a.site_detail_url.length > 0
      ? a.site_detail_url
      : "https://www.gamespot.com/news/";

  let published_at: string;
  if (typeof a.publish_date === "string" && a.publish_date.length >= 10) {
    published_at = a.publish_date.slice(0, 10);
  } else {
    published_at = new Date().toISOString().slice(0, 10);
  }

  return {
    id,
    title,
    summary,
    thumbnail: pickImageUrl(a.image),
    published_at,
    url,
  };
}

const MOCK_NEWS: GameNews[] = [
  {
    id: 1,
    title: "Elden Ring: Shadow of the Erdtree Lore Deep Dive",
    summary:
      "Exploring the mysterious Land of Shadow and the truth about Miquella's journey beyond the Erdtree.",
    thumbnail:
      "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop",
    published_at: "2026-04-05",
    url: "#",
  },
  {
    id: 2,
    title: "The Witcher 4: Everything We Know About Project Polaris",
    summary:
      "New details have emerged about the next saga in The Witcher universe, including a shift to Unreal Engine 5.",
    thumbnail:
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop",
    published_at: "2026-04-04",
    url: "#",
  },
  {
    id: 3,
    title: "Hollow Knight: Silksong Release Date Leak?",
    summary:
      "Rumors suggest a surprising announcement for Hornet's adventure might be closer than we think.",
    thumbnail:
      "https://images.unsplash.com/photo-1614027164847-1b2809eb1895?q=80&w=1965&auto=format&fit=crop",
    published_at: "2026-04-03",
    url: "#",
  },
  {
    id: 4,
    title: "Dark Souls 3 Remastered: The Unkindled One Returns",
    summary:
      "Tracing the echoes of Lothric as speculations of a modern glow-up for the final Dark Souls title heat up.",
    thumbnail:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    published_at: "2026-04-02",
    url: "#",
  },
];

/** Latest articles for the homepage (GameSpot API; mock if unset or on error). */
export async function getLatestNews(limit = 4): Promise<GameNews[]> {
  const mockNews = MOCK_NEWS;

  if (process.env.GAMESPOT_USE_MOCK === "true") {
    return mockNews.slice(0, limit);
  }

  if (!getGamespotConfig()) {
    return mockNews.slice(0, limit);
  }

  try {
    const cap = Math.min(Math.max(limit, 1), 20);
    const res = await fetchGamespotApi("articles", {
      limit: String(cap),
      sort: "publish_date:desc",
      field_list: "id,title,deck,image,publish_date,site_detail_url",
    });

    if (!res.ok) {
      let detail = "";
      try {
        const errText = await res.text();
        const parsed = JSON.parse(errText) as { error?: string };
        if (typeof parsed?.error === "string") detail = `: ${parsed.error}`;
      } catch {
        /* ignore */
      }
      console.warn(`[GameSpot] articles HTTP ${res.status}${detail}`);
      return mockNews.slice(0, limit);
    }

    const data = (await res.json()) as { results?: unknown[] };
    const results = data.results;
    if (!Array.isArray(results) || results.length === 0) {
      return mockNews.slice(0, limit);
    }

    const mapped = results
      .map(mapArticleToGameNews)
      .filter((item): item is GameNews => item !== null);

    if (mapped.length === 0) {
      return mockNews.slice(0, limit);
    }

    return mapped.slice(0, limit);
  } catch (e) {
    console.error("[GameSpot] getLatestNews:", e);
    return mockNews.slice(0, limit);
  }
}
