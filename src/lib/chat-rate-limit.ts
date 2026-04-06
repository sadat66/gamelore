import {
  CHAT_RATE_MAX_DEFAULT,
  CHAT_RATE_WINDOW_MS_DEFAULT,
} from "@/lib/chat-rate-constants";

/**
 * Sliding-window limit for chat POSTs per authenticated user.
 * In-memory: counts apply per server instance (fine for dev / single-node).
 */
const buckets = new Map<string, number[]>();

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function takeChatRateSlot(userId: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const windowMs = parsePositiveInt(process.env.CHAT_RATE_WINDOW_MS, CHAT_RATE_WINDOW_MS_DEFAULT);
  const max = parsePositiveInt(process.env.CHAT_RATE_MAX, CHAT_RATE_MAX_DEFAULT);

  const now = Date.now();
  let times = buckets.get(userId) ?? [];
  times = times.filter((t) => now - t < windowMs);

  if (times.length >= max) {
    const oldest = times[0]!;
    const retryAfterMs = Math.max(0, windowMs - (now - oldest));
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  times.push(now);
  buckets.set(userId, times);
  return { ok: true };
}
