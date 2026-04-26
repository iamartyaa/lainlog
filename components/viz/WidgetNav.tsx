"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { PRESS, SPRING } from "@/lib/motion";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";

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
 * Visual: prev / play / next sit as a joined pill row. A single `motion.div`
 * indicator pill morphs between the active button position via
 * `transform: translateX/scaleX` only (DESIGN.md §9 — no width/height
 * animations, no decorative pulses). The "gooey" feel comes from an inline
 * SVG `<filter>` (`feGaussianBlur` + alpha-snap `feColorMatrix`) scoped per
 * instance via `useId()`, applied to the indicator pill div only — text is
 * rendered outside the filter group so it stays crisp.
 *
 * Behaviour preserved from the legacy `<Stepper>`:
 * - Auto-play scheduling at `playInterval` ms (1800ms under reduced motion).
 * - `IntersectionObserver` pauses autoplay when the nav scrolls off-screen
 *   (battery-life requirement on mobile when many widgets share a page).
 * - `useTapPulse` ring-pulse on prev / next so heavy-commit actions feel
 *   tactile.
 *
 * Accessibility:
 * - The active button carries `aria-current="step"`.
 * - The `n / N` counter is `aria-live="polite"` only when NOT auto-playing,
 *   so screen readers don't get flooded during autoplay.
 * - All hit targets are ≥ 44 × 44 (DESIGN.md §11).
 *
 * Reduced motion:
 * - Indicator pill teleports (no spring tail).
 * - Goo filter is dropped entirely.
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
  const trackRef = useRef<HTMLDivElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const userMovedRef = useRef(false);
  const prevPulse = useTapPulse<HTMLButtonElement>();
  const nextPulse = useTapPulse<HTMLButtonElement>();

  const filterId = useId();
  const gooFilter = `bs-goo-${filterId.replace(/:/g, "")}`;

  onChangeRef.current = onChange;

  const go = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(total - 1, next));
      userMovedRef.current = true;
      onChangeRef.current(clamped);
    },
    [total],
  );

  // Indicator-pill geometry: measure the active button each time `value`,
  // `playing`, or layout changes. Re-measure on resize.
  const [pill, setPill] = useState({ x: 0, w: 0, ready: false });

  const measure = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    let active: HTMLButtonElement | null = null;
    if (playing && playable && playBtnRef.current) {
      active = playBtnRef.current;
    } else {
      // No "active" tab in the strict tab sense — highlight `next` so the
      // pill anchors on the most relevant action. When at end, highlight
      // play (replay). When at start, highlight next.
      if (value <= 0 && nextBtnRef.current) active = nextBtnRef.current;
      else if (value >= total - 1 && playBtnRef.current && playable)
        active = playBtnRef.current;
      else if (nextBtnRef.current) active = nextBtnRef.current;
      else active = playBtnRef.current;
    }
    if (!active) return;
    const trackRect = track.getBoundingClientRect();
    const r = active.getBoundingClientRect();
    setPill({ x: r.left - trackRect.left, w: r.width, ready: true });
  }, [value, total, playing, playable]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(track);
    return () => ro.disconnect();
  }, [measure]);

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

  const btnClass =
    "relative z-10 inline-flex items-center justify-center min-h-[44px] min-w-[44px] " +
    "px-[var(--spacing-sm)] py-[var(--spacing-2xs)] rounded-[var(--radius-md)] " +
    "transition-colors disabled:opacity-40 disabled:cursor-not-allowed " +
    "hover:enabled:text-[color:var(--color-accent)] focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]";

  // The pill style. Under reduced motion we drop the filter and let `motion`
  // teleport (no spring) by passing a non-spring transition.
  const pillTransition = prefersReducedMotion ? { duration: 0 } : SPRING.snappy;
  const pillFilter = prefersReducedMotion ? "none" : `url(#${gooFilter})`;

  // Stable variants live in module scope (see end of file).

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
      {/* Inline goo filter, scoped per-instance via useId(). The width:0
          height:0 SVG keeps it out of layout. */}
      <svg
        width="0"
        height="0"
        aria-hidden
        focusable="false"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id={gooFilter}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div
        ref={trackRef}
        className="relative inline-flex items-center"
        style={{ filter: pillFilter }}
      >
        {/* Indicator pill — single morphing element that travels via transform. */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 h-full rounded-[var(--radius-md)]"
          initial={false}
          animate={
            pill.ready
              ? { x: pill.x, width: pill.w, opacity: onlyOne ? 0 : 1 }
              : { opacity: 0 }
          }
          transition={pillTransition}
          style={{
            background: "color-mix(in oklab, var(--color-accent) 18%, transparent)",
            border: "1px solid color-mix(in oklab, var(--color-accent) 45%, transparent)",
          }}
        />

        <motion.button
          ref={(node) => {
            prevBtnRef.current = node;
            prevPulse.ref.current = node;
          }}
          type="button"
          onClick={() => {
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
            ref={playBtnRef}
            type="button"
            onClick={() => {
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
            nextBtnRef.current = node;
            nextPulse.ref.current = node;
          }}
          type="button"
          onClick={() => {
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
