/**
 * Turn structured JSON lore into plain text for chunking / embeddings.
 * Handles arrays of entries, nested objects, and common string fields.
 */
export function jsonToLoreText(value: unknown): string {
  return walk(value).trim();
}

function walk(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    const blocks = value.map((item, i) => {
      const inner = walk(item);
      if (!inner) return "";
      return value.length > 1 ? `[Entry ${i + 1}]\n${inner}` : inner;
    });
    return blocks.filter(Boolean).join("\n\n---\n\n");
  }

  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const parts: string[] = [];

    for (const [k, v] of Object.entries(o)) {
      if (v === null || v === undefined) continue;

      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        parts.push(`${k}: ${v}`);
        continue;
      }

      const inner = walk(v);
      if (inner) {
        parts.push(`${k}:\n${inner}`);
      }
    }

    return parts.join("\n\n");
  }

  return "";
}
