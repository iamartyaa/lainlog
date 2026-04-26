"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { PRESS } from "@/lib/motion";
import { playSound } from "@/lib/audio";
import { useAudioPreference } from "@/lib/hooks/use-audio-preference";
import { AudioPromptTooltip } from "./AudioPromptTooltip";

/**
 * AudioToggle — Header-mounted speaker icon. Mirrors the ThemeToggle
 * silhouette (44×44 hit target, 14px glyph, muted-on-rest, accent-on-hover)
 * so the two siblings read as a row rather than two unrelated affordances.
 *
 * Pre-mount renders a placeholder so the layout doesn't shift between SSR
 * and the first client paint (same trick ThemeToggle uses).
 *
 * Co-located <AudioPromptTooltip> renders on the home page when audio is
 * off and the user hasn't dismissed the hint. The relative wrapper anchors
 * the absolute-positioned tooltip beside this icon.
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
    <span className="relative inline-flex">
      <motion.button
        type="button"
        onClick={() => {
          // Fire Radio BEFORE flipping the preference. While the user is
          // turning audio OFF, the pref is still "on" at this point so the
          // gate passes — they hear a confirmation tap. While the user is
          // turning audio ON, the gate blocks Radio (pref still "off"); the
          // unlock-preview Pop inside `setEnabled` is the audible
          // confirmation instead. Net result: every click has feedback.
          playSound("Radio");
          toggle();
        }}
        aria-pressed={enabled}
        aria-label={enabled ? "Sound on" : "Sound off"}
        className="inline-flex h-[44px] w-[44px] -m-[10px] items-center justify-center text-[color:var(--color-text-muted)] transition-colors hover:text-[color:var(--color-text)]"
        {...PRESS}
      >
        <span className="sr-only">{enabled ? "Sound on" : "Sound off"}</span>
        <SpeakerIcon enabled={enabled} className="h-[14px] w-[14px]" />
      </motion.button>
      <AudioPromptTooltip audioEnabled={enabled} />
    </span>
  );
}

function SpeakerIcon({
  enabled,
  className,
}: {
  enabled: boolean;
  className?: string;
}) {
  // The speaker glyph fills the viewBox vertically (y=1.5 → 12.5) so it
  // reads at the same apparent size as the sun/moon glyph in <ThemeToggle>.
  // The earlier draft only used y=3.5–10.5 (~50% of the box), making the
  // icon visibly shorter than its sibling.
  return (
    <svg
      viewBox="0 0 14 14"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Speaker body — back panel + cone (taller, fills box) */}
      <path
        d="M6.75 1.75 L3.5 4.5 H1.75 V9.5 H3.5 L6.75 12.25 Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Sound waves — only visible when enabled */}
      {enabled ? (
        <>
          <path
            d="M9 5 Q10 7 9 9"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M10.75 3.25 Q12.5 7 10.75 10.75"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        // Mute: a single slash overlay across the speaker.
        <line
          x1="1.75"
          y1="12.25"
          x2="12.25"
          y2="1.75"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
