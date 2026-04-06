import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicThumbnailUrl } from "@/lib/game-utils";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: games, error } = await supabase
    .from("games")
    .select("id, slug, title, thumbnail_path, genre")
    .order("genre", { ascending: true, nullsFirst: false })
    .order("title");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    games: (games ?? []).map((g) => ({
      id: g.id,
      slug: g.slug,
      title: g.title,
      genre: g.genre ?? null,
      thumbnail_url: publicThumbnailUrl(g.thumbnail_path),
    })),
  });
}
