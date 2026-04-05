import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkText } from "./chunk-text";
import { embedTexts } from "./embeddings";
import { extractTextFromBuffer } from "./extract-text";

function vectorLiteral(embedding: number[]): string {
  return `[${embedding.map((n) => (Number.isFinite(n) ? n : 0)).join(",")}]`;
}

export async function ingestLoreDocument(params: {
  supabase: SupabaseClient;
  gameId: string;
  documentId: string;
  buffer: Buffer;
  mime: string;
  filename: string;
}): Promise<{ chunkCount: number }> {
  const { supabase, gameId, documentId, buffer, mime, filename } = params;

  const text = await extractTextFromBuffer(buffer, mime, filename);
  const pieces = chunkText(text);
  if (pieces.length === 0) {
    throw new Error("No extractable text in this file.");
  }

  const batchSize = 64;
  let inserted = 0;

  for (let offset = 0; offset < pieces.length; offset += batchSize) {
    const slice = pieces.slice(offset, offset + batchSize);
    const vectors = await embedTexts(slice);
    const rows = slice.map((content, i) => ({
      game_id: gameId,
      document_id: documentId,
      chunk_index: offset + i,
      content,
      embedding: vectorLiteral(vectors[i]!),
      metadata: { source: filename },
    }));

    const { error } = await supabase.from("lore_chunks").insert(rows);
    if (error) throw new Error(error.message);
    inserted += rows.length;
  }

  return { chunkCount: inserted };
}
