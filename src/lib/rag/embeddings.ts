import OpenAI from "openai";

/** DB column + index use 768-dim vectors (see migration `embeddings_768_groq`). */
export const EMBEDDING_DIM = 768;

export type EmbeddingProvider = "nomic" | "openai-compatible" | "openai";

const NOMIC_URL = "https://api-atlas.nomic.ai/v1/embedding/text";
const NOMIC_MODEL =
  process.env.NOMIC_EMBEDDING_MODEL?.trim() || "nomic-embed-text-v1.5";

const OPENAI_EMBED_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";

function assertDim(label: string, vec: number[]) {
  if (vec.length !== EMBEDDING_DIM) {
    throw new Error(
      `${label}: expected ${EMBEDDING_DIM}-dim vectors (current DB). Got ${vec.length}. Use a 768-dim model or change the schema.`
    );
  }
}

/**
 * Groq does not reliably expose embedding models on all accounts; use Nomic or OpenAI-compatible instead.
 * Chat can still use GROQ_API_KEY via groq-chat.ts.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const explicit = process.env.EMBEDDING_PROVIDER?.toLowerCase().trim();
  if (
    explicit === "nomic" ||
    explicit === "openai-compatible" ||
    explicit === "openai"
  ) {
    return explicit;
  }
  if (process.env.NOMIC_API_KEY?.trim()) {
    return "nomic";
  }
  if (
    process.env.EMBEDDINGS_BASE_URL?.trim() &&
    process.env.EMBEDDINGS_MODEL?.trim()
  ) {
    return "openai-compatible";
  }
  if (process.env.OPENAI_API_KEY?.trim()) {
    return "openai";
  }
  throw new Error(
    "Embeddings: set NOMIC_API_KEY (cloud, 768-dim), " +
      "or EMBEDDINGS_BASE_URL + EMBEDDINGS_MODEL for OpenAI-compatible /v1/embeddings (LM Studio, Ollama, vLLM, etc.; 768-dim vectors). " +
      "EMBEDDINGS_API_KEY is optional (omit for local LM Studio). " +
      "Or OPENAI_API_KEY. GROQ_API_KEY is chat-only."
  );
}

export function getEmbeddingDimensions(): number {
  return EMBEDDING_DIM;
}

async function embedNomic(
  texts: string[],
  purpose: "index" | "query"
): Promise<number[][]> {
  const key = process.env.NOMIC_API_KEY?.trim();
  if (!key) throw new Error("NOMIC_API_KEY is required for Nomic embeddings.");

  const task_type =
    purpose === "query" ? "search_query" : "search_document";
  const batchSize = 32;
  const out: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const slice = texts.slice(i, i + batchSize);
    const res = await fetch(NOMIC_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: NOMIC_MODEL,
        texts: slice,
        task_type,
        dimensionality: EMBEDDING_DIM,
      }),
    });

    const raw = await res.text();
    if (!res.ok) {
      throw new Error(`Nomic embeddings failed (${res.status}): ${raw}`);
    }

    let parsed: { embeddings?: number[][] };
    try {
      parsed = JSON.parse(raw) as { embeddings?: number[][] };
    } catch {
      throw new Error(`Nomic embeddings: invalid JSON: ${raw.slice(0, 200)}`);
    }

    const embeddings = parsed.embeddings;
    if (!embeddings || embeddings.length !== slice.length) {
      throw new Error("Nomic embeddings: unexpected response shape.");
    }

    for (const vec of embeddings) {
      assertDim("Nomic", vec);
      out.push(vec);
    }
  }

  return out;
}

async function embedOpenAiCompatible(texts: string[]): Promise<number[][]> {
  const base = process.env.EMBEDDINGS_BASE_URL?.trim().replace(/\/$/, "");
  const apiKey = process.env.EMBEDDINGS_API_KEY?.trim();
  const model = process.env.EMBEDDINGS_MODEL?.trim();
  if (!base || !model) {
    throw new Error(
      "OpenAI-compatible embeddings need EMBEDDINGS_BASE_URL and EMBEDDINGS_MODEL (EMBEDDINGS_API_KEY optional for LM Studio)."
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const url = `${base}/embeddings`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      input: texts.length === 1 ? texts[0] : texts,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Embeddings API failed (${res.status}): ${raw}`);
  }

  const parsed = JSON.parse(raw) as {
    data?: { embedding: number[]; index: number }[];
  };
  const data = parsed.data;
  if (!data?.length) {
    throw new Error("Embeddings API: missing data[] in response.");
  }

  data.sort((a, b) => a.index - b.index);
  const vectors = data.map((d) => d.embedding);
  for (const vec of vectors) {
    assertDim("OpenAI-compatible", vec);
  }
  return vectors;
}

async function embedOpenAI(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error("OPENAI_API_KEY is required for OpenAI embeddings.");
  }
  const openai = new OpenAI({ apiKey: key });
  const res = await openai.embeddings.create({
    model: OPENAI_EMBED_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIM,
  });
  const vectors = res.data.map((d) => d.embedding);
  for (const vec of vectors) {
    assertDim("OpenAI", vec);
  }
  return vectors;
}

/**
 * @param purpose — Nomic uses `search_document` for chunks and `search_query` for user questions (better retrieval).
 */
export async function embedTexts(
  texts: string[],
  purpose: "index" | "query" = "index"
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const provider = getEmbeddingProvider();

  if (provider === "nomic") {
    return embedNomic(texts, purpose);
  }
  if (provider === "openai-compatible") {
    return embedOpenAiCompatible(texts);
  }
  return embedOpenAI(texts);
}

export async function embedQuery(text: string): Promise<number[]> {
  const [v] = await embedTexts([text], "query");
  return v;
}
