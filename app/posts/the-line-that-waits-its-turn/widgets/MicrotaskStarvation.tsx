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
 * Bounded microtask flood vs setTimeout(0)-yielded loop. Hard cap at 50_000
 * iterations OR 500 ms wall-clock so it can't brick the page even on slow
 * devices. The reduced-motion path skips the live loop and shows the same
 * outcome statically.
 * --------------------------------------------------------------------------*/

const MAX_ITER = 50_000;
const MAX_MS = 500;
const TICK_BATCH = 200; // for yield mode, repaint between batches

type Mode = "starve" | "yield";

function startStarve(
  setCount: (n: number) => void,
  onDone: (final: number) => void,
) {
  const start = performance.now();
  let i = 0;
  // Recursive .then chain — each tick of the chain is a microtask, so the
  // browser gets no chance to repaint until the chain ends.
  function step() {
    if (i >= MAX_ITER || performance.now() - start > MAX_MS) {
      // We can update React state here, but the paint won't happen until
      // the current microtask drain finishes.
      setCount(i);
      onDone(i);
      return;
    }
    i++;
    Promise.resolve().then(step);
  }
  Promise.resolve().then(step);
}

function startYield(
  setCount: (n: number) => void,
  onDone: (final: number) => void,
  shouldStop: () => boolean,
) {
  const start = performance.now();
  let i = 0;
  function batch() {
    if (shouldStop()) {
      onDone(i);
      return;
    }
    if (i >= MAX_ITER || performance.now() - start > MAX_MS) {
      setCount(i);
      onDone(i);
      return;
    }
    // Run a batch of work synchronously, then yield.
    const end = Math.min(i + TICK_BATCH, MAX_ITER);
    while (i < end) {
      i++;
    }
    setCount(i);
    setTimeout(batch, 0);
  }
  setTimeout(batch, 0);
}

/* Pulse-dot via rAF. Updates a ref-driven state so we can read it back to
 * see if frames landed during the last 200 ms window. In starve mode the
 * loop keeps ticking but `setCount` doesn't paint — so the dot freezes
 * because the render thread never runs. We add an explicit "frozen" flag
 * the parent flips while starve is in flight. */
function PulseDot({ frozen }: { frozen: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span
      aria-label={frozen ? "paint loop frozen" : "paint loop alive"}
      className="inline-flex items-center gap-[var(--spacing-2xs)] font-sans"
      style={{
        fontSize: "var(--text-small)",
        color: "var(--color-text-muted)",
      }}
    >
      <motion.span
        aria-hidden
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--color-accent)",
        }}
        animate={
          frozen || reduce ? { opacity: 0.25 } : { opacity: [0.3, 1] }
        }
        transition={
          frozen || reduce
            ? { duration: 0 }
            : { ...SPRING.gentle, repeat: Infinity, repeatType: "reverse" }
        }
      />
      <span>{frozen ? "paint loop frozen" : "paint loop alive"}</span>
    </span>
  );
}

/**
 * MicrotaskStarvation (W4) — bounded flood vs yielded loop. Toggle the
 * mode; the counter races the same MAX_ITER iterations either way. In
 * starve mode, the page can't repaint until the chain finishes; in yield
 * mode, the counter ticks visibly and the pulse-dot keeps pulsing.
 *
 * One verb: toggle (mode segmented control). The "run" button is the
 * engagement; the segmented control is parameter selection.
 *
 * Hard cap: 50_000 iterations OR 500 ms wall-clock — can't brick the page.
 *
 * Reduced motion: pulse-dot uses opacity only (no infinite scale animation).
 */
export function MicrotaskStarvation() {
  const [mode, setMode] = useState<Mode>("starve");
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const [final, setFinal] = useState<number | null>(null);
  const stopRef = useRef(false);

  const reset = useCallback(() => {
    stopRef.current = true;
    setRunning(false);
    setCount(0);
    setFinal(null);
  }, []);

  function run() {
    if (running) return;
    stopRef.current = false;
    setCount(0);
    setFinal(null);
    setRunning(true);

    if (mode === "starve") {
      startStarve(
        (n) => setCount(n),
        (n) => {
          setFinal(n);
          setRunning(false);
        },
      );
    } else {
      startYield(
        (n) => setCount(n),
        (n) => {
          setFinal(n);
          setRunning(false);
        },
        () => stopRef.current,
      );
    }
  }

  // Reset on mode change.
  useEffect(() => {
    reset();
  }, [mode, reset]);

  const pct = Math.min(100, (count / MAX_ITER) * 100);
  // Frozen dot only while a starve run is in flight (counter goes 0 → final
  // in one paint). In yield mode the dot keeps pulsing even between batches.
  const frozen = mode === "starve" && running;

  return (
    <WidgetShell
      title="microtask starvation"
      measurements={`${count.toLocaleString()} / ${MAX_ITER.toLocaleString()}`}
      caption={
        running ? (
          <>
            <CaptionCue>Running.</CaptionCue> {mode === "starve"
              ? "The microtask drain holds the loop. The counter doesn't paint and the pulse-dot freezes until the chain finishes."
              : "setTimeout(0) hands the loop back between batches. Rendering interleaves; the counter ticks visibly."}
          </>
        ) : final !== null ? (
          <>
            <CaptionCue>Done.</CaptionCue> {mode === "starve"
              ? "Counter jumped from 0 straight to its final value in a single paint. The microtask checkpoint can't yield mid-drain."
              : "Each batch yielded back to the loop. Rendering happened between every batch."}
          </>
        ) : (
          <>
            <CaptionCue>Pick a scheduler</CaptionCue> — starve or yield — and
            tap <em>run</em>. Starve mode runs a recursive{" "}
            <code className="font-mono">.then</code> chain to completion before
            the browser can repaint. Yield mode breaks the work into batches
            with <code className="font-mono">setTimeout(0)</code>.
          </>
        )
      }
      captionTone="prominent"
      controls={
        <div className="flex flex-wrap items-center justify-center gap-[var(--spacing-sm)] w-full">
          <div
            role="tablist"
            aria-label="scheduler mode"
            className="inline-flex rounded-[var(--radius-md)]"
            style={{
              border: "1px solid var(--color-rule)",
              padding: 2,
            }}
          >
            {(["starve", "yield"] as const).map((m) => {
              const active = m === mode;
              return (
                <motion.button
                  key={m}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(m)}
                  className="font-sans rounded-[var(--radius-sm)] min-h-[44px]"
                  style={{
                    padding: "6px 16px",
                    fontSize: "var(--text-ui)",
                    background: active
                      ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                      : "transparent",
                    color: active
                      ? "var(--color-accent)"
                      : "var(--color-text-muted)",
                    border: "none",
                  }}
                  {...PRESS}
                >
                  {m}
                </motion.button>
              );
            })}
          </div>
          <motion.button
            type="button"
            onClick={running ? reset : run}
            className="font-sans rounded-[var(--radius-md)] min-h-[44px]"
            style={{
              padding: "6px 18px",
              fontSize: "var(--text-ui)",
              background: running ? "transparent" : "var(--color-accent)",
              color: running ? "var(--color-text-muted)" : "var(--color-bg)",
              border: running
                ? "1px solid var(--color-rule)"
                : "none",
            }}
            {...PRESS}
          >
            {running ? "stop" : final !== null ? "run again ▸" : "run ▸"}
          </motion.button>
        </div>
      }
    >
      <div
        className="flex flex-col gap-[var(--spacing-sm)]"
        style={{ minHeight: 180 }}
      >
        <div className="flex flex-col gap-[var(--spacing-2xs)]">
          <div
            className="flex items-baseline justify-between font-mono tabular-nums"
            style={{
              fontSize: 14,
              color: "var(--color-text)",
            }}
          >
            <span>
              counter:{" "}
              <span style={{ color: "var(--color-accent)", minWidth: "8ch" }}>
                {count.toString().padStart(5, "0")}
              </span>
            </span>
            <PulseDot frozen={frozen} />
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              background:
                "color-mix(in oklab, var(--color-surface) 60%, transparent)",
              border: "1px solid var(--color-rule)",
              transformOrigin: "left center",
            }}
            aria-label={`${mode} run progress, ${count} of ${MAX_ITER} iterations`}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              initial={false}
              animate={{ scaleX: pct / 100 }}
              transition={running ? { duration: 0 } : SPRING.snappy}
              style={{
                height: "100%",
                width: "100%",
                background: "var(--color-accent)",
                transformOrigin: "left center",
              }}
            />
          </div>
        </div>

      </div>
    </WidgetShell>
  );
}
