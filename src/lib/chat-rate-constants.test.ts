import { describe, expect, it } from "vitest";
import {
  CHAT_RATE_MAX_DEFAULT,
  CHAT_RATE_WINDOW_MS_DEFAULT,
  getChatRateSecondsLeft,
} from "./chat-rate-constants";

describe("getChatRateSecondsLeft", () => {
  it("returns 0 when under the limit", () => {
    const now = 1_000_000;
    const ts = [now - 1000];
    expect(
      getChatRateSecondsLeft(ts, now, CHAT_RATE_WINDOW_MS_DEFAULT, CHAT_RATE_MAX_DEFAULT)
    ).toBe(0);
  });

  it("returns positive seconds when window is full", () => {
    const windowMs = 60_000;
    const max = 2;
    const now = 1_000_000;
    const ts = [now - 30_000, now - 10_000];
    const left = getChatRateSecondsLeft(ts, now, windowMs, max);
    expect(left).toBeGreaterThan(0);
    expect(left).toBeLessThanOrEqual(50);
  });
});
