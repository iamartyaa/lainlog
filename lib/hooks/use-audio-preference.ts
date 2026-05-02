"use client";

import { useCallback, useEffect, useState } from "react";
import { playSound } from "@/lib/audio";

const STORAGE_KEY = "lainlog:audio";

/**
 * useAudioPreference — owns the `lainlog:audio` localStorage flag and the
 * matching React state. SSR-safe: initial render is always `false` to keep
 * server + client output identical, then `useEffect` reads localStorage on
 * mount and re-renders if the user opted in previously.
 *
 * Cross-tab sync: subscribes to `storage` events so flipping the toggle in
 * one tab updates every other open tab in the same origin.
 *
 * iOS AudioContext unlock: when the user just turned audio ON, we
 * synchronously call `playSound("Pop")` from inside the click handler. The
 * click is a real user gesture, so Safari's autoplay policy lets the
 * AudioContext resume. Without this preview the first non-toggle sound
 * would silently fail on iOS until another gesture happened.
 */
export function useAudioPreference(): {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (on: boolean) => void;
} {
  const [enabled, setEnabledState] = useState<boolean>(false);

  // Hydrate from localStorage post-mount (avoids hydration mismatch).
  // Default ON: unset / null reads as on; only an explicit "off" mutes.
  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      setEnabledState(v === null ? true : v === "on");
    } catch {
      // Private mode / disabled storage — keep default false.
    }
  }, []);

  // Cross-tab sync via the `storage` event. A null `newValue` (the key was
  // removed in another tab) follows the same default-ON rule as initial
  // hydration.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY) return;
      setEnabledState(e.newValue === null ? true : e.newValue === "on");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setEnabled = useCallback((on: boolean) => {
    setEnabledState(on);
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
    } catch {
      // Storage unavailable — state still flips in-memory.
    }
    // Fire the unlock preview before this tick returns. We persist FIRST
    // so `playSound` reads `"on"` on the same call.
    if (on) {
      playSound("Pop");
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  return { enabled, toggle, setEnabled };
}
