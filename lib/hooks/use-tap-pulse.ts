"use client";

import { useCallback, useRef } from "react";

/**
 * useTapPulse — re-triggers the `.bs-press` ring-pulse keyframe every time the
 * consumer's onClick fires. CSS keyframes don't replay on re-add of the same
 * class; forcing a reflow between remove and add is the cheapest way to
 * restart the animation reliably across browsers.
 *
 * Reserved for heavy-commit actions (Stepper advance). Other buttons should
 * stick to `PRESS` scale-only to avoid visual noise.
 */
export function useTapPulse<T extends HTMLElement = HTMLButtonElement>() {
  const ref = useRef<T | null>(null);

  const pulse = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("bs-press");
    void el.offsetWidth;
    el.classList.add("bs-press");
  }, []);

  return { ref, pulse };
}
