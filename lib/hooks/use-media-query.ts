"use client";

import { useEffect, useState } from "react";

/**
 * useMediaQuery — SSR-safe `matchMedia` subscription. Returns `false` during
 * the server render and on the first client render, then updates on mount
 * once `window` is available. Prefer CSS container queries where possible;
 * reach for this only when a widget's layout decision genuinely needs JS.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}
