import mammoth from "mammoth";
import { jsonToLoreText } from "./json-to-lore-text";

export async function extractTextFromBuffer(
  buf: Buffer,
  mime: string,
  filename: string
): Promise<string> {
  const lower = filename.toLowerCase();

  if (mime === "application/pdf" || lower.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buf });
    try {
      const result = await parser.getText();
      return (result.text ?? "").trim();
    } finally {
      await parser.destroy();
    }
  }

  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lower.endsWith(".docx")
  ) {
    const res = await mammoth.extractRawText({ buffer: buf });
    return (res.value ?? "").trim();
  }

  if (
    mime === "application/json" ||
    mime === "text/json" ||
    mime === "application/ld+json" ||
    lower.endsWith(".json")
  ) {
    const raw = buf.toString("utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new Error("Invalid JSON — fix syntax or upload UTF-8 .json.");
    }
    const text = jsonToLoreText(parsed);
    if (!text) {
      throw new Error("JSON parsed but contained no text fields to index.");
    }
    return text;
  }

  throw new Error(
    "Unsupported file type. Upload PDF, DOCX, or JSON (Word .doc is not supported — save as DOCX)."
  );
}
