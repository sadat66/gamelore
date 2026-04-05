import Groq from "groq-sdk";

export type ChatTurn = { role: "user" | "assistant" | "system"; content: string };

function getClient(): Groq {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is required for chat.");
  }
  return new Groq({ apiKey: key });
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
    content: `You are the GameLore Oracle for ONE game. Answer using ONLY the CONTEXT snippets below (uploaded lore). 
Rules:
- If the answer is not supported by the context, say clearly that this is not in the uploaded lore.
- Prefer direct paraphrase of the lore; do not invent plot, dates, or characters.
- You may refer to snippet numbers like [1] when helpful.

CONTEXT:
${contextBlock || "(No matching lore chunks were retrieved.)"}`,
  };

  const groq = getClient();
  const completion = await groq.chat.completions.create({
    model,
    messages: [system, ...params.messages],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const text = completion.choices[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("Empty response from Groq.");
  }
  return text;
}
