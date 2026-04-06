import { describe, expect, it } from "vitest";
import { slugifyTitle } from "./game-utils";

describe("slugifyTitle", () => {
  it("slugifies basic titles", () => {
    expect(slugifyTitle("The Elder Scrolls V")).toBe("the-elder-scrolls-v");
  });

  it("strips leading and trailing punctuation", () => {
    expect(slugifyTitle("  ---Hello World!!!  ")).toBe("hello-world");
  });

  it("returns fallback for empty result", () => {
    expect(slugifyTitle("!!!")).toBe("game");
  });
});
