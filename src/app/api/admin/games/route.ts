import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugifyTitle } from "@/lib/game-utils";
import { parseCanonicalGenreOrNull } from "@/lib/game-genres";

export const runtime = "nodejs";

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile?.is_admin) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await assertAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const genreRaw = String(form.get("genre") ?? "").trim();
  const genre = parseCanonicalGenreOrNull(genreRaw);
  if (genreRaw.length > 0 && genre === null) {
    return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
  }
  const thumb = form.get("thumbnail");

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let slug = slugifyTitle(title);
  const { data: existing } = await supabase
    .from("games")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    slug = `${slug}-${crypto.randomUUID().slice(0, 8)}`;
  }

  const { data: game, error: insertErr } = await supabase
    .from("games")
    .insert({ slug, title, thumbnail_path: null, genre })
    .select("id, slug, title, thumbnail_path, genre")
    .single();

  if (insertErr || !game) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Failed to create game" },
      { status: 500 }
    );
  }

  if (thumb instanceof File && thumb.size > 0) {
    const ext =
      thumb.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
      "jpg";
    const path = `${game.id}/cover.${ext}`;
    const buf = Buffer.from(await thumb.arrayBuffer());

    const { error: upErr } = await supabase.storage
      .from("game-thumbnails")
      .upload(path, buf, {
        contentType: thumb.type || `image/${ext}`,
        upsert: true,
      });

    if (upErr) {
      await supabase.from("games").delete().eq("id", game.id);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { error: upGameErr } = await supabase
      .from("games")
      .update({ thumbnail_path: path })
      .eq("id", game.id);

    if (upGameErr) {
      return NextResponse.json({ error: upGameErr.message }, { status: 500 });
    }

    return NextResponse.json({
      game: { ...game, thumbnail_path: path },
    });
  }

  return NextResponse.json({ game });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await assertAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const gameId = "gameId" in body && typeof (body as { gameId: unknown }).gameId === "string"
    ? (body as { gameId: string }).gameId.trim()
    : "";

  if (!gameId) {
    return NextResponse.json({ error: "gameId is required" }, { status: 400 });
  }

  if (!("genre" in body)) {
    return NextResponse.json({ error: "genre is required (string or null)" }, { status: 400 });
  }

  const g = (body as { genre: unknown }).genre;
  let genre: string | null;
  if (g === null) {
    genre = null;
  } else if (typeof g === "string") {
    const parsed = parseCanonicalGenreOrNull(g);
    if (g.trim().length > 0 && parsed === null) {
      return NextResponse.json({ error: "Invalid genre" }, { status: 400 });
    }
    genre = parsed;
  } else {
    return NextResponse.json({ error: "genre must be a string or null" }, { status: 400 });
  }

  const { data: game, error: updateErr } = await supabase
    .from("games")
    .update({ genre })
    .eq("id", gameId)
    .select("id, slug, title, thumbnail_path, genre")
    .single();

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({ game });
}
