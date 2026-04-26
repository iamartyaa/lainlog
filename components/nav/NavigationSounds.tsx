"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { playSound } from "@/lib/audio";

/**
 * NavigationSounds — plays Page-Exit then Page-Enter on every client-side
 * navigation.
 *
 * - Skips the very first mount (initial page load — readers haven't
 *   gestured yet so AudioContext likely suspended; honoring the audio
 *   playbook's "no autoplay on first load" rule too).
 * - Page-Exit fires immediately on path change; Page-Enter fires
 *   ~120 ms later so the two sounds aren't a single muddled blip.
 *   The 120 ms gap matches the fast-end of motion/react SPRING.snappy
 *   so it feels paired with the visual route change.
 * - All gating (audio off, reduced-motion, hidden tab, throttle) is
 *   handled inside playSound — this component is dumb.
 */
export function NavigationSounds() {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);

  useEffect(() => {
    if (prev.current === null) {
      // First mount; don't play.
      prev.current = pathname;
      return;
    }
    if (prev.current === pathname) return;
    prev.current = pathname;
    playSound("Page-Exit");
    const t = setTimeout(() => playSound("Page-Enter"), 120);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
