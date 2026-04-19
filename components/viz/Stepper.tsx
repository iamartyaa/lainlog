"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
 */
export function Stepper({ value, total, onChange, playable = true, playInterval = 900 }: Props) {
  const [playing, setPlaying] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      onChangeRef.current(clamped);
    },
    [total],
  );

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (value >= total - 1) {
        setPlaying(false);
        return;
      }
      go(value + 1);
    }, playInterval);
    return () => clearInterval(id);
  }, [playing, value, total, go, playInterval]);

  const atStart = value <= 0;
  const atEnd = value >= total - 1;

  return (
    <div className="flex items-center gap-[var(--spacing-sm)] font-sans" style={{ fontSize: "var(--text-ui)" }}>
      <button
        type="button"
        onClick={() => go(value - 1)}
        disabled={atStart}
        aria-label="Previous step"
        className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:text-[color:var(--color-accent)]"
      >
        ← prev
      </button>

      {playable ? (
        <button
          type="button"
          onClick={() => {
            if (atEnd) {
              go(0);
              setPlaying(true);
            } else {
              setPlaying((p) => !p);
            }
          }}
          aria-label={playing ? "Pause" : "Play"}
          className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] transition-colors hover:text-[color:var(--color-accent)]"
          style={{ color: playing ? "var(--color-accent)" : undefined }}
        >
          {playing ? "pause" : atEnd ? "replay ▸" : "play ▸"}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => go(value + 1)}
        disabled={atEnd}
        aria-label="Next step"
        className="rounded-[var(--radius-sm)] px-[var(--spacing-sm)] py-[var(--spacing-2xs)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:text-[color:var(--color-accent)]"
      >
        next →
      </button>

      <span
        className="ml-auto font-mono tabular-nums"
        style={{
          fontSize: "var(--text-small)",
          color: "var(--color-text-muted)",
        }}
      >
        {value + 1} / {total}
      </span>
    </div>
  );
}
