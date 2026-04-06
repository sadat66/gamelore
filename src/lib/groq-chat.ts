import Groq from "groq-sdk";

export type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

function getClient(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is required for chat.");
  }
  return new Groq({ apiKey: key });
}

function maxOutputTokens(): number {
  const raw = process.env.GROQ_MAX_OUTPUT_TOKENS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n >= 64 && n <= 8192) return n;
  return 384;
}

export async function groqLoreReply(params: {
  contextSnippets: string[];
  messages: ChatTurn[];
}): Promise<string> {
  const model =
    process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

  const contextBlock = params.contextSnippets
    .map((c, i) => `[${i + 1}] ${c}`)
    .join("\n\n");

  const system: ChatTurn = {
    role: "system",
    content: `You are the Grimoire Oracle, an expert historian and master of this game's universe. Your voice is that of an ancient chronicler—authoritative, immersive, and wise.

Rules for your prophecy:
- Default to a concise answer (about 2–6 sentences) unless the question clearly needs a structured list or step-by-step detail.
- **Never** mention words like "snippets," "context," "uploaded lore," or "provided text."
- Weave the facts below into a seamless narrative. Do not use citation numbers like [1] or [2].
- If the exact answer is missing, provide a wise interpretation based on the themes and related facts you *do* have, or note that the chronicles are silent on this particular mystery.
- Do not invent characters or plot points that contradict the tone of this game.

LORE CHRONICLES:
${contextBlock || "(The chronicles of this era are currently lost to time.)"}`,
  };

  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model,
    messages: [system, ...params.messages],
    temperature: 0.3,
    max_tokens: maxOutputTokens(),
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Empty response from Groq.");
  }
  return text;
}
