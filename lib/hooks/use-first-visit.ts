"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bs-hero-seen";

type State = { ready: boolean; firstVisit: boolean };

// Module-level cache so multiple components reading this hook on the same
// page agree on a single verdict even if their effects fire in different
// orders. Without it the first component to mount would mark the session
// as "seen" and subsequent hooks would see firstVisit=false in the same
// render cycle — the staggered home choreography depends on all three
// consumers (AboutColumn, PostList, Header) seeing the same flag.
let cached: State | null = null;

/**
 * useFirstVisit — gates the home hero choreography. On the first navigation
 * of a session, returns `firstVisit: true` once; the same session (including
 * navigations away and back) returns `firstVisit: false` thereafter. Always
 * starts unready on the server to avoid hydration mismatch; flips `ready`
 * to true in the first client effect.
 */
export function useFirstVisit(): State {
  const [state, setState] = useState<State>(
    () => cached ?? { ready: false, firstVisit: false },
  );

  useEffect(() => {
    if (cached) {
      if (!state.ready) setState(cached);
      return;
    }
    try {
      const seen = window.sessionStorage.getItem(STORAGE_KEY);
      cached = { ready: true, firstVisit: !seen };
      if (!seen) window.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing, quota, etc. — default to treating as return visit.
      cached = { ready: true, firstVisit: false };
    }
    setState(cached);
  }, [state.ready]);

  return state;
}
