"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";
import { playSound } from "@/lib/audio";

type WidgetNavProps = {
  /** 0-indexed current step. */
  value: number;
  /** Total steps (≥ 1). When `total === 1` the prev/next buttons are disabled. */
  total: number;
  onChange: (next: number) => void;
  /** Show play / pause. Defaults true. */
  playable?: boolean;
  /** Auto-play interval ms when playing. Default 900. */
  playInterval?: number;
  /** Optional aria label for the whole nav (default "step controls"). */
  ariaLabel?: string;
  /**
   * Optional override of the rendered counter noun (e.g. "tick" instead of
   * "step"). The visible label remains the `n / N` numerals; this only
   * affects the accessible label. Default "step".
   */
  counterNoun?: string;
};

/**
 * WidgetNav — the canonical step-controls primitive for lainlog widgets.
 *
 * Visual: prev / play / next render as a row of self-contained pills with
 * 6px (`gap-1.5`) breathing room. Each pill carries its own 1px rule
 * border, surface bg, accent text on hover, and per-button PRESS tap
 * feedback (DESIGN.md §9 — transform-only, no width/height animation).
 *
 * Behaviour preserved:
 * - Auto-play scheduling at `playInterval` ms (1800ms under reduced motion).
 * - `IntersectionObserver` pauses autoplay when the nav scrolls off-screen
 *   (battery-life requirement on mobile when many widgets share a page).
 * - `useTapPulse` ring-pulse on prev / next so heavy-commit actions feel
 *   tactile.
 * - `Progress-Tick` plays on every user-driven press (prev / play / pause /
 *   replay / next). Auto-advance ticks stay silent.
 *
 * Accessibility:
 * - The next button carries `aria-current="step"` while there are still
 *   steps ahead.
 * - The `n / N` counter is `aria-live="polite"` only after the user has
 *   moved at least once and is NOT auto-playing, so screen readers don't
 *   get flooded.
 * - All hit targets are ≥ 44 × 44 (DESIGN.md §11).
 */
export function WidgetNav({
  value,
  total,
  onChange,
  playable = true,
  playInterval = 900,
  ariaLabel = "step controls",
  counterNoun = "step",
}: WidgetNavProps) {
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(true);
  const onChangeRef = useRef(onChange);
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const userMovedRef = useRef(false);
  const prevPulse = useTapPulse<HTMLButtonElement>();
  const nextPulse = useTapPulse<HTMLButtonElement>();

  onChangeRef.current = onChange;

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      userMovedRef.current = true;
      onChangeRef.current(clamped);
    },
    [total],
  );

  // Auto-play loop.
  useEffect(() => {
    if (!playing || !inView) return;
    const interval = prefersReducedMotion ? 1800 : playInterval;
    const id = setInterval(() => {
      if (value >= total - 1) {
        setPlaying(false);
        return;
      }
      go(value + 1);
    }, interval);
    return () => clearInterval(id);
  }, [playing, inView, value, total, go, playInterval, prefersReducedMotion]);

  // IntersectionObserver: pause autoplay off-screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const atStart = value <= 0;
  const atEnd = value >= total - 1;
  const onlyOne = total <= 1;

  // Each button is a self-contained pill: full text contrast, 1 px rule
  // border, opaque surface at rest. Hover lifts the text to terracotta.
  // Disabled keeps the §11 0.4 floor.
  const btnClass =
    "inline-flex items-center justify-center min-h-[44px] min-w-[44px] " +
    "px-[var(--spacing-sm)] py-[var(--spacing-2xs)] rounded-[var(--radius-md)] " +
    "border border-[color:var(--color-rule)] bg-[color:var(--color-surface)] " +
    "text-[color:var(--color-text)] " +
    "transition-colors disabled:opacity-40 disabled:cursor-not-allowed " +
    "hover:enabled:text-[color:var(--color-accent)] focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]";

  // Counter live-region: silent during autoplay, polite once the user has
  // taken at least one action. On first mount we keep it `off` so screen
  // readers don't announce the initial "1 / N".
  const liveMode = playing
    ? "off"
    : userMovedRef.current
      ? "polite"
      : "off";

  const counterLabel = useMemo(
    () => `${counterNoun} ${value + 1} of ${total}`,
    [counterNoun, value, total],
  );

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-x-[var(--spacing-sm)] gap-y-[var(--spacing-2xs)] font-sans"
      style={{ fontSize: "var(--text-ui)" }}
    >
      <div className="inline-flex items-center gap-1.5">
        <motion.button
          ref={(node) => {
            prevPulse.ref.current = node;
          }}
          type="button"
          onClick={() => {
            playSound("Progress-Tick");
            prevPulse.pulse();
            go(value - 1);
          }}
          disabled={atStart || onlyOne}
          aria-label="Previous step — Left arrow"
          className={btnClass}
          {...PRESS}
        >
          ← prev
        </motion.button>

        {playable && !onlyOne ? (
          <motion.button
            type="button"
            onClick={() => {
              // Progress-Tick on every play/pause/replay press — these
              // advance the widget through its state machine. Auto-advance
              // between steps stays silent (autonomous animation).
              playSound("Progress-Tick");
              if (atEnd) {
                go(0);
                setPlaying(true);
              } else {
                setPlaying((p) => !p);
              }
            }}
            aria-label={
              playing
                ? "Pause auto-play — Space"
                : atEnd
                  ? "Replay from start — Space"
                  : "Play auto-play — Space"
            }
            aria-pressed={playing}
            className={btnClass}
            style={{ color: playing ? "var(--color-accent)" : undefined }}
            {...PRESS}
          >
            {playing ? "pause" : atEnd ? "replay ▸" : "play ▸"}
          </motion.button>
        ) : null}

        <motion.button
          ref={(node) => {
            nextPulse.ref.current = node;
          }}
          type="button"
          onClick={() => {
            playSound("Progress-Tick");
            nextPulse.pulse();
            go(value + 1);
          }}
          disabled={atEnd || onlyOne}
          aria-current={atEnd ? undefined : "step"}
          aria-label="Next step — Right arrow"
          className={btnClass}
          {...PRESS}
        >
          next →
        </motion.button>
      </div>

      <span
        aria-live={liveMode}
        aria-atomic="true"
        className="ml-auto font-mono tabular-nums"
        style={{
          fontSize: "var(--text-ui)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="sr-only">{counterLabel}</span>
        <span aria-hidden>
          {value + 1} / {total}
        </span>
      </span>
    </div>
  );
}
