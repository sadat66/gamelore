import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { embedQuery } from "@/lib/rag/embeddings";
import { groqLoreReply, type ChatTurn } from "@/lib/groq-chat";

export const runtime = "nodejs";
export const maxDuration = 60;

function toVectorParam(embedding: number[]): string {
  return `[${embedding.map((n) => (Number.isFinite(n) ? n : 0)).join(",")}]`;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { gameId?: string; messages?: ChatTurn[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const gameId = body.gameId?.trim();
  const messages = body.messages;

  if (!gameId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "gameId and messages are required" },
      { status: 400 }
    );
  }

  const { data: game, error: gameErr } = await supabase
    .from("games")
    .select("id, title")
    .eq("id", gameId)
    .maybeSingle();

  if (gameErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const convo = messages.filter(
    (m): m is ChatTurn =>
      (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string"
  );

  const lastUser = [...convo].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return NextResponse.json(
      { error: "Include at least one user message" },
      { status: 400 }
    );
  }

  let queryEmbedding: number[];
  try {
    queryEmbedding = await embedQuery(lastUser.content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Embedding failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const service = createServiceClient();
  const { data: matches, error: rpcErr } = await service.rpc("match_lore_chunks", {
    p_game_id: gameId,
    p_query_embedding: toVectorParam(queryEmbedding),
    p_match_count: 10,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 500 });
  }

  const snippets = (matches ?? []).map(
    (m: { content: string }) => m.content as string
  );

  const historyLimit = 12;
  const trimmed = convo.slice(-historyLimit).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let reply: string;
  try {
    reply = await groqLoreReply({
      contextSnippets: snippets,
      messages: trimmed,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chat failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({
    reply,
    gameTitle: game.title,
    chunksUsed: snippets.length,
  });
}
