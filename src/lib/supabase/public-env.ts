/** Placeholders match `.github/workflows/ci.yml` so `next build` works without real env. */
const BUILD_URL = "https://placeholder.supabase.co";
const BUILD_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

const TEMPLATE_URL = "your_supabase_url_here";
const TEMPLATE_ANON = "your_supabase_anon_key_here";

export function getSupabasePublicConfig() {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonRaw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const url = urlRaw || BUILD_URL;
  const anon = anonRaw || BUILD_ANON_KEY;
  const isConfigured =
    Boolean(urlRaw && anonRaw) &&
    urlRaw !== TEMPLATE_URL &&
    anonRaw !== TEMPLATE_ANON;
  return { url, anon, isConfigured };
}
