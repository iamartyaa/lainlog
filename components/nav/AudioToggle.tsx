"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { PRESS } from "@/lib/motion";
import { useAudioPreference } from "@/lib/hooks/use-audio-preference";

/**
 * AudioToggle — Header-mounted speaker icon. Mirrors the ThemeToggle
 * silhouette (44×44 hit target, 14px glyph, muted-on-rest, accent-on-hover)
 * so the two siblings read as a row rather than two unrelated affordances.
 *
 * Pre-mount renders a placeholder so the layout doesn't shift between SSR
 * and the first client paint (same trick ThemeToggle uses).
 */
export function AudioToggle() {
  const { enabled, toggle } = useAudioPreference();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-block h-6 w-6 -m-[10px] p-[10px]"
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? "Sound on" : "Sound off"}
      className="inline-flex h-[44px] w-[44px] -m-[10px] items-center justify-center text-[color:var(--color-text-muted)] transition-colors hover:text-[color:var(--color-text)]"
      {...PRESS}
    >
      <span className="sr-only">{enabled ? "Sound on" : "Sound off"}</span>
      <SpeakerIcon enabled={enabled} className="h-[14px] w-[14px]" />
    </motion.button>
  );
}

function SpeakerIcon({
  enabled,
  className,
}: {
  enabled: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Speaker body — back panel + cone */}
      <path
        d="M7 3.5 L4.25 5.5 H2.5 V8.5 H4.25 L7 10.5 Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Sound waves — only visible when enabled */}
      {enabled ? (
        <>
          <path
            d="M9.25 5.5 Q10 7 9.25 8.5"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M10.75 4.25 Q12 7 10.75 9.75"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        // Mute: a single slash overlay across the speaker.
        <line
          x1="2.5"
          y1="11.5"
          x2="11.5"
          y2="2.5"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
