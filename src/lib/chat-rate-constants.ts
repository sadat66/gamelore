/** Defaults for chat rate limit (must match `chat-rate-limit.ts` when env is unset). */
export const CHAT_RATE_WINDOW_MS_DEFAULT = 60_000;
export const CHAT_RATE_MAX_DEFAULT = 2;

/**
 * Seconds until another message is allowed (sliding window), from local send timestamps only.
 */
export function getChatRateSecondsLeft(
  sendTimestamps: number[],
  now: number,
  windowMs = CHAT_RATE_WINDOW_MS_DEFAULT,
  max = CHAT_RATE_MAX_DEFAULT
): number {
  const recent = sendTimestamps
    .filter((t) => now - t < windowMs)
    .sort((a, b) => a - b);
  if (recent.length < max) return 0;
  const unlockAt = recent[0]! + windowMs;
  return Math.max(0, Math.ceil((unlockAt - now) / 1000));
}
