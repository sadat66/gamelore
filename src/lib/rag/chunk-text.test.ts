import { describe, expect, it } from "vitest";
import { chunkText } from "./chunk-text";

describe("chunkText", () => {
  it("returns empty array for empty or whitespace-only input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\t  ")).toEqual([]);
  });

  it("normalizes internal whitespace", () => {
    const out = chunkText("hello   world");
    expect(out).toHaveLength(1);
    expect(out[0]).toBe("hello world");
  });

  it("produces overlapping segments for long text", () => {
    const long = "a".repeat(1600);
    const chunks = chunkText(long);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]!.length).toBeLessThanOrEqual(1500);
  });
});
