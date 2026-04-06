"use client";

import { useCallback, useRef } from "react";

/**
 * Prevents overlapping async submit/actions (double-click, Enter + click, etc.).
 * Call `acquire()` at the start; always `release()` in `finally`.
 */
export function useSubmitLock() {
  const locked = useRef(false);

  const acquire = useCallback((): boolean => {
    if (locked.current) return false;
    locked.current = true;
    return true;
  }, []);

  const release = useCallback(() => {
    locked.current = false;
  }, []);

  return { acquire, release };
}
