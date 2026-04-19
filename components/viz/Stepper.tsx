"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";

type Props = {
  /** 0-indexed current step. */
  value: number;
  /** Total steps (0..total-1 are valid). */
  total: number;
  onChange: (next: number) => void;
  /** Enable auto-play. Defaults true. */
  playable?: boolean;
  /** Milliseconds per auto-play step. */
  playInterval?: number;
};

/**
 * Stepper — prev / play / next controls. Pair with <Scrubber> or use alone.
 * Keyboard: ←/→ while focused anywhere inside the containing widget.
 * Auto-play pauses whenever the Stepper scrolls out of the viewport so
 * background widgets don't drain battery on mobile.
 */
export function Stepper({ value, total, onChange, playable = true, playInterval = 900 }: Props) {
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(true);
  const onChangeRef = useRef(onChange);
  const containerRef = useRef<HTMLDivElement>(null);
  onChangeRef.current = onChange;

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      onChangeRef.current(clamped);
    },
    [total],
  );

  const prev = useTapPulse<HTMLButtonElement>();
  const next = useTapPulse<HTMLButtonElement>();

  useEffect(() => {
    if (!playing || !inView) return;
    const id = setInterval(() => {
      if (value >= total - 1) {
        setPlaying(false);
        return;
      }
      go(value + 1);
    }, playInterval);
    return () => clearInterval(id);
  }, [playing, inView, value, total, go, playInterval]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const atStart = value <= 0;
  const atEnd = value >= total - 1;

  const btnClass =
    "rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] min-h-[44px] inline-flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:text-[color:var(--color-accent)]";

  return (
    <div
      ref={containerRef}
      className="flex items-center gap-x-[var(--spacing-sm)] gap-y-[var(--spacing-2xs)] flex-wrap font-sans"
      style={{ fontSize: "var(--text-ui)" }}
    >
      <motion.button
        ref={prev.ref}
        type="button"
        onClick={() => {
          prev.pulse();
          go(value - 1);
        }}
        disabled={atStart}
        aria-label="Previous step — Left arrow"
        className={btnClass}
        {...PRESS}
      >
        ← prev
      </motion.button>

      {playable ? (
        <motion.button
          type="button"
          onClick={() => {
            if (atEnd) {
              go(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
          aria-label={playing ? "Pause auto-play — Space" : "Play auto-play — Space"}
          className={btnClass}
          style={{ color: playing ? "var(--color-accent)" : undefined }}
          {...PRESS}
        >
          {playing ? "pause" : atEnd ? "replay ▸" : "play ▸"}
        </motion.button>
      ) : null}

      <motion.button
        ref={next.ref}
        type="button"
        onClick={() => {
          next.pulse();
          go(value + 1);
        }}
        disabled={atEnd}
        aria-label="Next step — Right arrow"
        className={btnClass}
        {...PRESS}
      >
        next →
      </motion.button>

      <span
        className="ml-auto font-mono tabular-nums"
        style={{
          fontSize: "var(--text-ui)",
          color: "var(--color-text-muted)",
        }}
      >
        {value + 1} / {total}
      </span>
    </div>
  );
}
