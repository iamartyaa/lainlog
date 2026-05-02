"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SPRING } from "@/lib/motion";

const STORAGE_KEY = "lainlog:audio:prompt-dismissed";

/**
 * AudioPromptTooltip — first-visit hint anchored beside the speaker icon.
 *
 * Audio is default-on (per the 2026-05-02 flip), so this tooltip's job is
 * to tell first-time readers HOW TO MUTE — pointer at the speaker toggle.
 * It is never shown again once dismissed.
 *
 * Renders ONLY when all four conditions are true:
 *   - hydrated (avoids SSR mismatch — localStorage isn't available on the
 *     server, so the first paint is empty and the tooltip eases in once
 *     the client confirms the user qualifies)
 *   - pathname === "/"  (home page only — article pages stay quiet)
 *   - audio preference is ON (the only state where a "click to mute"
 *     hint makes sense)
 *   - localStorage[STORAGE_KEY] !== "true"  (sticky dismiss)
 *
 * Dismiss paths:
 *   - close button click → persists `prompt-dismissed = "true"` and
 *     unmounts via AnimatePresence.
 *   - AudioToggle parent flips audio OFF → `audioEnabled` prop becomes
 *     false → effect persists `prompt-dismissed = "true"` so the tooltip
 *     never reappears, even if the user later turns audio back on.
 *
 * Visual language: matches `<Callout>` (the canonical "speaking to the
 * reader" element) — rounded radius-md, var(--color-surface) bg, plain
 * 1px var(--color-rule) border. Terracotta accent placed via a small
 * musical-note glyph at the front (NOT a border-left stripe — DESIGN.md
 * §12 bans those on chrome). No drop-shadow (also §12 banned). Font-serif
 * body matches the Callout convention so the tooltip reads as an editorial
 * aside rather than a UI status line.
 *
 * Reduced-motion: <MotionConfigProvider reducedMotion="user"> already
 * collapses non-essential transforms; we belt-and-brace by passing the
 * gentle spring (motion/react will skip the y-displacement on reduce).
 *
 * Accessibility: `role="status"` so screen readers announce once, but
 * non-interruptive. Close button is keyboard-reachable with aria-label.
 */
export function AudioPromptTooltip({
  audioEnabled,
}: {
  audioEnabled: boolean;
}) {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [dismissed, setDismissed] = useState(true); // safe default → no flash

  useEffect(() => {
    setHydrated(true);
    try {
      setDismissed(
        window.localStorage.getItem(STORAGE_KEY) === "true",
      );
    } catch {
      setDismissed(true);
    }
  }, []);

  // Auto-dismiss + persist when audio gets muted. The user has just acted
  // on the hint — keep the tooltip from ever coming back.
  useEffect(() => {
    if (!hydrated) return;
    if (!audioEnabled && !dismissed) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "true");
      } catch {
        /* ignore */
      }
      setDismissed(true);
    }
  }, [audioEnabled, dismissed, hydrated]);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const shouldShow =
    hydrated && pathname === "/" && audioEnabled && !dismissed;

  return (
    <AnimatePresence>
      {shouldShow ? (
        <motion.div
          key="audio-prompt"
          role="status"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={SPRING.gentle}
          className="absolute right-0 top-full z-20 mt-[var(--spacing-xs)] flex items-center gap-[var(--spacing-sm)] whitespace-nowrap font-serif"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-rule)",
            borderRadius: "var(--radius-md)",
            padding: "var(--spacing-xs) var(--spacing-md)",
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            lineHeight: 1.4,
          }}
        >
          <span
            aria-hidden
            style={{
              color: "var(--color-accent)",
              fontSize: "1em",
              lineHeight: 1,
            }}
          >
            ♪
          </span>
          <span>Click here to mute the site.</span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss audio prompt"
            className="relative -mr-[var(--spacing-2xs)] inline-flex h-5 w-5 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-text-muted)] transition-colors hover:text-[color:var(--color-text)] before:absolute before:inset-[-6px] before:content-['']"
          >
            <svg
              viewBox="0 0 10 10"
              fill="none"
              className="h-[10px] w-[10px]"
              aria-hidden="true"
            >
              <line
                x1="2"
                y1="2"
                x2="8"
                y2="8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <line
                x1="8"
                y1="2"
                x2="2"
                y2="8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
