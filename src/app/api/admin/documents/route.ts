import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ingestLoreDocument } from "@/lib/rag/ingest";

export const runtime = "nodejs";
export const maxDuration = 120;

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180) || "document";
}

async function assertAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return !error && profile?.is_admin === true;
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
  const gameId = String(form.get("gameId") ?? "").trim();
  const file = form.get("file");

  if (!gameId || !(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "gameId and file are required" },
      { status: 400 }
    );
  }

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .maybeSingle();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const originalFilename = file.name;
  const mime = file.type || "application/octet-stream";
  const storageName = safeFileName(originalFilename);
  const docId = crypto.randomUUID();
  const storagePath = `${gameId}/${docId}/${storageName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await supabase.storage
    .from("lore-sources")
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: docRow, error: docInsErr } = await supabase
    .from("lore_documents")
    .insert({
      id: docId,
      game_id: gameId,
      storage_path: storagePath,
      original_filename: originalFilename,
      mime_type: mime,
      status: "processing",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (docInsErr || !docRow) {
    await supabase.storage.from("lore-sources").remove([storagePath]);
    return NextResponse.json(
      { error: docInsErr?.message ?? "Failed to record document" },
      { status: 500 }
    );
  }

  const service = createServiceClient();

  try {
    const { chunkCount } = await ingestLoreDocument({
      supabase: service,
      gameId,
      documentId: docId,
      buffer,
      mime,
      filename: originalFilename,
    });

    await service
      .from("lore_documents")
      .update({ status: "ready", chunk_count: chunkCount, error_message: null })
      .eq("id", docId);

    return NextResponse.json({
      documentId: docId,
      chunkCount,
      status: "ready",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    await service
      .from("lore_documents")
      .update({ status: "error", error_message: message })
      .eq("id", docId);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
