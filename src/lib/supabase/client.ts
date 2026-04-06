"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/public-env";

export function createClient() {
  const { url, anon } = getSupabasePublicConfig();
  return createBrowserClient(url, anon);
}
