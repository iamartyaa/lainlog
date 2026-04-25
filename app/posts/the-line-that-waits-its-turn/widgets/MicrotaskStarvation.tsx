"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { TextHighlighter } from "@/components/fancy";
import { SPRING, PRESS } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";

const HL_COLOR = "color-mix(in oklab, var(--color-accent) 28%, transparent)";
const HL_TX = { type: "spring" as const, duration: 0.9, bounce: 0 };

function CaptionCue({ children }: { children: React.ReactNode }) {
  return (
    <TextHighlighter
      triggerType="auto"
      transition={HL_TX}
      highlightColor={HL_COLOR}
      className="rounded-[0.2em] px-[1px]"
    >
      {children}
    </TextHighlighter>
  );
}

/* ---------------------------------------------------------------------------
 * MicrotaskStarvation — two-lane visualization that lets the reader feel
 * the freeze.
 *
 * IDLE  : a requestAnimationFrame ticks the "frame counter" lane visibly. A
 *         "click me" button increments a "clicks" counter normally. Both
 *         lanes drop a dot per tick to show the rhythm.
 * RUNAWAY: a recursive Promise chain — Promise.resolve().then(loop) —
 *         schedules itself forever (capped at MAX_ROUNDS to protect the
 *         page). The microtask lane fills with dots at high speed; the
 *         frame-counter stops; the click-me button stops responding.
 * STOP   : flips the loop off; rAF resumes; reader sees recovery.
 *
 * Hard caps:
 *   MAX_ROUNDS — 500 microtask hops before auto-bail
 *   MAX_MS     — 1000 ms wall-clock guard
 *
 * Reduced-motion path: a static "before / after" diptych using the same
 * lane shapes — no live loop, no rAF, no Promise self-scheduling.
 * --------------------------------------------------------------------------*/

const MAX_ROUNDS = 500;
const MAX_MS = 1000;
const LANE_DOT_CAP = 80;

type Mode = "idle" | "runaway";

function useFrameTicker(active: boolean, onFrame: () => void) {
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const cbRef = useRef(onFrame);
  cbRef.current = onFrame;

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const loop = (t: number) => {
      if (cancelled) return;
      // Throttle to ~30 fps so dots are visible on slow screens.
      if (t - lastRef.current >= 33) {
        lastRef.current = t;
        cbRef.current();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [active]);
}

function Lane({
  label,
  count,
  dots,
  filled,
  frozen,
}: {
  label: string;
  count: number;
  dots: number;
  filled: boolean;
  frozen: boolean;
}) {
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="flex items-baseline justify-between font-sans"
        style={{ fontSize: 11, color: "var(--color-text-muted)" }}
      >
        <span style={{ letterSpacing: "0.02em" }}>{label}</span>
        <span
          className="font-mono tabular-nums"
          style={{
            color: frozen ? "var(--color-text-muted)" : "var(--color-text)",
            fontSize: 12,
          }}
        >
          {count.toLocaleString()}
        </span>
      </div>
      <div
        style={{
          border: "1px dashed var(--color-rule)",
          borderRadius: "var(--radius-sm)",
          padding: 8,
          minHeight: 40,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 4,
          background: "color-mix(in oklab, var(--color-surface) 30%, transparent)",
        }}
      >
        {Array.from({ length: Math.min(dots, LANE_DOT_CAP) }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: filled
                ? "var(--color-accent)"
                : "color-mix(in oklab, var(--color-text-muted) 80%, transparent)",
              opacity: filled ? 0.85 : 0.55,
            }}
          />
        ))}
        {dots > LANE_DOT_CAP ? (
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              color: "var(--color-text-muted)",
              marginLeft: 4,
            }}
          >
            +{dots - LANE_DOT_CAP}
          </span>
        ) : null}
        {dots === 0 ? (
          <span
            className="font-sans"
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              opacity: 0.5,
              fontStyle: "italic",
            }}
          >
            empty
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ClickMeButton({
  clicks,
  onClick,
  frozen,
}: {
  clicks: number;
  onClick: () => void;
  frozen: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-col gap-[var(--spacing-2xs)]">
      <div
        className="flex items-baseline justify-between font-sans"
        style={{ fontSize: 11, color: "var(--color-text-muted)" }}
      >
        <span style={{ letterSpacing: "0.02em" }}>UI thread</span>
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 12, color: "var(--color-text)" }}
        >
          {clicks} click{clicks === 1 ? "" : "s"}
        </span>
      </div>
      <motion.button
        type="button"
        onClick={onClick}
        className="font-sans rounded-[var(--radius-sm)] min-h-[44px]"
        style={{
          padding: "10px 14px",
          fontSize: "var(--text-ui)",
          background: frozen
            ? "color-mix(in oklab, var(--color-surface) 80%, transparent)"
            : "color-mix(in oklab, var(--color-accent) 14%, transparent)",
          color: frozen ? "var(--color-text-muted)" : "var(--color-accent)",
          border: `1px solid ${
            frozen ? "var(--color-rule)" : "var(--color-accent)"
          }`,
          cursor: "pointer",
          transition: reduce
            ? "none"
            : "background 200ms, color 200ms, border-color 200ms",
        }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={SPRING.snappy}
      >
        {frozen ? "click me (try it — nothing)" : "click me"}
      </motion.button>
    </div>
  );
}

/**
 * MicrotaskStarvation (W4) — feel the freeze. Two lanes (microtask vs
 * rAF/render) plus a click-me button. Toggle Runaway to start a recursive
 * Promise chain; the rAF dots stop landing and the button stops responding
 * until you toggle Stop. Recovery is visible too — that's the point.
 *
 * One verb: toggle (start / stop the runaway loop).
 *
 * Hard cap: MAX_ROUNDS / MAX_MS. Reduced-motion path replaces the live
 * loop with a static before/after diptych.
 *
 * Frame stability (R6): all four panes have fixed min-heights; lane dots
 * cap at LANE_DOT_CAP and overflow into a "+N" indicator instead of
 * growing the container.
 */
export function MicrotaskStarvation() {
  const reduce = useReducedMotion();

  const [mode, setMode] = useState<Mode>("idle");
  const [microDots, setMicroDots] = useState(0);
  const [microCount, setMicroCount] = useState(0);
  const [frameDots, setFrameDots] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [clicks, setClicks] = useState(0);

  // The runaway loop is driven imperatively by Promise.then re-scheduling.
  // We use a stop flag the loop checks each round. No setState during loop —
  // we keep the live count in a ref, then commit it once when the loop bails.
  const stopRef = useRef(false);
  const microRef = useRef(0);

  const startRunaway = useCallback(() => {
    stopRef.current = false;
    microRef.current = 0;
    const start = performance.now();

    function step() {
      if (
        stopRef.current ||
        microRef.current >= MAX_ROUNDS ||
        performance.now() - start > MAX_MS
      ) {
        // Bail. Commit final counts in one paint.
        setMicroCount((c) => c + microRef.current);
        setMicroDots((d) => Math.min(d + microRef.current, LANE_DOT_CAP));
        setMode("idle");
        return;
      }
      microRef.current++;
      Promise.resolve().then(step);
    }
    Promise.resolve().then(step);
  }, []);

  const handleToggle = () => {
    if (mode === "runaway") {
      // Stop button — flag tells the loop to bail at its next check.
      stopRef.current = true;
      return;
    }
    if (reduce) {
      // Reduced-motion: simulate the freeze synthetically without actually
      // blocking. Bump the counters to the same end state in one paint.
      setMicroCount((c) => c + MAX_ROUNDS);
      setMicroDots((d) => Math.min(d + MAX_ROUNDS, LANE_DOT_CAP));
      return;
    }
    setMode("runaway");
    startRunaway();
  };

  const handleReset = () => {
    stopRef.current = true;
    setMode("idle");
    setMicroDots(0);
    setMicroCount(0);
    setFrameDots(0);
    setFrameCount(0);
    setClicks(0);
  };

  // Drive the rAF lane only when we're not running the runaway loop. The
  // whole point: when the microtask drain is in progress, this hook can't
  // get its callbacks fired anyway — but we explicitly pause it on mode
  // change so the post-runaway state shows the freeze cleanly.
  useFrameTicker(mode === "idle" && !reduce, () => {
    setFrameCount((c) => c + 1);
    setFrameDots((d) => Math.min(d + 1, LANE_DOT_CAP));
  });

  // Reset only the lanes' dots on mode change so the reader can replay.
  // (counters stay so they can compare totals across runs.)

  const isFrozen = mode === "runaway";

  return (
    <WidgetShell
      title="microtask starvation · feel the freeze"
      measurements={
        isFrozen ? "runaway · frames stalled" : `${frameCount} frames · ${microCount} micro`
      }
      caption={
        isFrozen ? (
          <>
            <CaptionCue>Loop running.</CaptionCue> The microtask queue keeps
            re-filling itself. The render thread can&apos;t reach a frame, the
            click-me button can&apos;t process input — the page is technically
            alive but functionally frozen.
          </>
        ) : microCount > 0 ? (
          <>
            <CaptionCue>Runaway resolved.</CaptionCue> While the Promise kept
            re-scheduling itself, no rAF fired and no click registered. The
            microtask queue stayed non-empty, so the loop never moved on. That
            is why one runaway Promise can stall a tab.
          </>
        ) : (
          <>
            <CaptionCue>Tap <em>start runaway</em>.</CaptionCue> The microtask
            lane will fill instantly while the frame lane stops. Try clicking
            the button mid-run — it won&apos;t respond. Hit <em>stop</em> to
            see the page recover.
          </>
        )
      }
      captionTone="prominent"
      controls={
        <div className="flex flex-wrap items-center justify-center gap-[var(--spacing-sm)] w-full">
          <motion.button
            type="button"
            onClick={handleToggle}
            className="font-sans rounded-[var(--radius-md)] min-h-[44px]"
            style={{
              padding: "8px 18px",
              fontSize: "var(--text-ui)",
              background: isFrozen ? "transparent" : "var(--color-accent)",
              color: isFrozen ? "var(--color-accent)" : "var(--color-bg)",
              border: isFrozen
                ? "1px solid var(--color-accent)"
                : "none",
            }}
            {...PRESS}
          >
            {isFrozen ? "stop" : microCount > 0 ? "run again ▸" : "start runaway ▸"}
          </motion.button>
          <motion.button
            type="button"
            onClick={handleReset}
            className="font-sans rounded-[var(--radius-md)] min-h-[44px]"
            style={{
              padding: "8px 14px",
              fontSize: "var(--text-ui)",
              color: "var(--color-text-muted)",
              background: "transparent",
              border: "1px solid var(--color-rule)",
            }}
            {...PRESS}
          >
            reset
          </motion.button>
        </div>
      }
    >
      <div className="flex flex-col gap-[var(--spacing-md)]">
        {/* Two columns on lg, stacked on mobile. Microtask lane on top so the
            reader's eye lands there first when it suddenly fills. */}
        <div className="bs-starvation-grid">
          <Lane
            label="microtask queue"
            count={microCount}
            dots={microDots}
            filled
            frozen={false}
          />
          <Lane
            label="render frames (rAF)"
            count={frameCount}
            dots={frameDots}
            filled={false}
            frozen={isFrozen}
          />
        </div>
        <ClickMeButton
          clicks={clicks}
          onClick={() => setClicks((c) => c + 1)}
          frozen={isFrozen}
        />
        <style>{`
          .bs-starvation-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--spacing-md);
          }
          @media (min-width: 640px) {
            .bs-starvation-grid {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </div>
    </WidgetShell>
  );
}
