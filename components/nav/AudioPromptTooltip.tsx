"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SPRING } from "@/lib/motion";

const STORAGE_KEY = "lainlog:audio:prompt-dismissed";

/**
 * AudioPromptTooltip — first-visit hint anchored beside the speaker icon.
 *
 * Renders ONLY when all four conditions are true:
 *   - hydrated (avoids SSR mismatch — localStorage isn't available on the
 *     server, so the first paint is empty and the tooltip eases in once
 *     the client confirms the user qualifies)
 *   - pathname === "/"  (home page only — article pages stay quiet)
 *   - audio preference is OFF (no point prompting if they're already in)
 *   - localStorage[STORAGE_KEY] !== "true"  (sticky dismiss)
 *
 * Dismiss paths:
 *   - close button click → persists `prompt-dismissed = "true"` and
 *     unmounts via AnimatePresence.
 *   - AudioToggle parent flips audio ON → `audioEnabled` prop becomes
 *     true → effect persists `prompt-dismissed = "true"` so the tooltip
 *     never reappears, even if the user later turns audio back off.
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

  // Auto-dismiss + persist when audio gets turned on. The user's intent
  // is clear at that point — keep the tooltip from ever coming back.
  useEffect(() => {
    if (!hydrated) return;
    if (audioEnabled && !dismissed) {
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
    hydrated && pathname === "/" && !audioEnabled && !dismissed;

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
          className="absolute right-0 top-full mt-[var(--spacing-2xs)] z-20 flex items-center gap-[var(--spacing-2xs)] whitespace-nowrap rounded-[6px] border border-[color:var(--color-rule)] bg-[color:var(--color-surface)] py-[var(--spacing-2xs)] pl-[var(--spacing-sm)] pr-[var(--spacing-2xs)] font-mono shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          style={{
            fontSize: "var(--text-small)",
            // Terracotta accent stripe on the leading edge.
            borderLeft: "2px solid var(--color-accent)",
          }}
        >
          <span className="text-[color:var(--color-text-muted)]">
            try it with sounds on
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss audio prompt"
            className="relative inline-flex h-4 w-4 items-center justify-center text-[color:var(--color-text-muted)] transition-colors hover:text-[color:var(--color-text)] before:absolute before:inset-[-8px] before:content-['']"
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
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <line
                x1="8"
                y1="2"
                x2="2"
                y2="8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
