"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { playSound } from "@/lib/audio";

/**
 * NavigationSounds — plays Page-Enter on every client-side navigation.
 *
 * - Skips the very first mount (initial page load — readers haven't
 *   gestured yet so AudioContext likely suspended; honoring the audio
 *   playbook's "no autoplay on first load" rule too).
 * - Single beat per navigation. An earlier revision played Page-Exit
 *   then Page-Enter 120 ms apart — user feedback called the pair "dub-
 *   dub", wanted "just dub". Page-Exit was removed entirely from the
 *   vocabulary in favour of one focused arrival cue.
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
    playSound("Page-Enter");
  }, [pathname]);

  return null;
}
