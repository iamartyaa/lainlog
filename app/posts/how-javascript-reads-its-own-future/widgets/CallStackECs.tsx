"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { PRESS, SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";
import { CALL_STACK_SNIPPET } from "./CallStackSnippet";

/**
 * CallStackECs v5 — plain vertical EC stack (drops Stack primitive).
 *
 * What changed from v4:
 *   1. The <Stack mode="tidy"> invocation is gone. Both messy and tidy
 *      modes failed to read clearly — the deck-of-cards metaphor obscured
 *      the data structure. v5 renders ECs as a literal vertical pile:
 *      `flex-col-reverse` so the JSX array order (Global → compute →
 *      multiply, bottom → top of stack) maps cleanly to visual order
 *      (multiply on top, Global at the bottom).
 *   2. Each card is a full-width row, ~64 px tall, with a clear border
 *      and a small "depth N" chip in the header. New ECs push from the
 *      top via <AnimatePresence mode="popLayout">; popped ECs lift off
 *      the top. Survivors don't shift.
 *   3. Active indicator: solid 1.5 px terracotta border on the top
 *      card + a small `▶` glyph in the header. No left-strip — the
 *      border colour itself tells you which card is active, no §12
 *      ambiguity. Lower cards keep the v4 saturation gradient.
 *   4. Stack region reserves min-h-[256px] (4 cards × 64 px) so the
 *      outer shell stays invariant across 1-EC and 3-EC states.
 *   5. The Stack primitive (components/fancy/stack-cards.tsx) is left
 *      in place for future widgets; it's just no longer imported here.
 *   6. Console-back bug fix from v4 preserved: derived useMemo over
 *      STEPS[0..currentStep].emit.
 *
 * Layout (unchanged grammar):
 *   - Mobile (< 720 px container): vertical — code pane (240 px) → ↓
 *     glyph → stack viz (256 px) → controls (48 px) → console (88 px).
 *     Total pinned regardless of EC depth.
 *   - lg (≥ 720 px container, via @container query): two columns — code
 *     + console on the left, stack viz + controls on the right.
 *
 * Code rendering: the snippet is pre-rendered by `<CodeBlock>` (server
 * component, async) in `page.tsx` and passed in as a `codeSlot: ReactNode`
 * prop. A terracotta wash overlays the active line — measured against the
 * rendered Shiki `<span class="line">` rows with `useLayoutEffect` +
 * `ResizeObserver`. The Shiki HTML is unchanged.
 */

type ECName = "global" | "compute" | "multiply";

type Binding = { name: string; value: string };

type EC = {
  id: ECName;
  label: string;
  ve: Binding[];
};

/**
 * Console output is a DERIVED selector over `STEPS[0..currentStep].emit`.
 * Each line carries the step that produced it as its stable key — that
 * way `<AnimatePresence mode="popLayout">` can match enter/exit cleanly
 * when the reader steps back/forward.
 */
type ConsoleLine = { stepId: number; text: string };

type Step = {
  stack: EC[];
  /** 1-indexed line number into SNIPPET. */
  activeLine: number | null;
  emit: string | null;
  beat: string;
};

const SNIPPET_LINES = CALL_STACK_SNIPPET.replace(/\n+$/, "").split("\n").length;

const GLOBAL_VE_INITIAL: Binding[] = [
  { name: "multiply", value: "ƒ" },
  { name: "compute", value: "ƒ" },
  { name: "answer", value: "<uninit>" },
];

const GLOBAL_VE_FINAL: Binding[] = [
  { name: "multiply", value: "ƒ" },
  { name: "compute", value: "ƒ" },
  { name: "answer", value: "14" },
];

const STEPS: Step[] = [
  {
    stack: [{ id: "global", label: "Global EC", ve: GLOBAL_VE_INITIAL }],
    activeLine: 12,
    emit: null,
    beat:
      "Pre-walk done. The Global EC holds bindings for multiply, compute, and answer (still uninitialised).",
  },
  {
    stack: [
      { id: "global", label: "Global EC", ve: GLOBAL_VE_INITIAL },
      {
        id: "compute",
        label: "compute(7)",
        ve: [
          { name: "x", value: "7" },
          { name: "doubled", value: "<uninit>" },
        ],
      },
    ],
    activeLine: 7,
    emit: null,
    beat:
      "compute(7) called. A new EC pushes onto the stack — its variable environment holds x = 7.",
  },
  {
    stack: [
      { id: "global", label: "Global EC", ve: GLOBAL_VE_INITIAL },
      {
        id: "compute",
        label: "compute(7)",
        ve: [
          { name: "x", value: "7" },
          { name: "doubled", value: "<uninit>" },
        ],
      },
      {
        id: "multiply",
        label: "multiply(7, 2)",
        ve: [
          { name: "a", value: "7" },
          { name: "b", value: "2" },
          { name: "result", value: "<uninit>" },
        ],
      },
    ],
    activeLine: 2,
    emit: null,
    beat:
      "multiply(7, 2) called from inside compute. A third EC pushes — the thread of execution is now in multiply.",
  },
  {
    stack: [
      { id: "global", label: "Global EC", ve: GLOBAL_VE_INITIAL },
      {
        id: "compute",
        label: "compute(7)",
        ve: [
          { name: "x", value: "7" },
          { name: "doubled", value: "14" },
        ],
      },
    ],
    activeLine: 7,
    emit: null,
    beat:
      "multiply returned 14. Its EC popped. compute resumes — doubled is now 14.",
  },
  {
    stack: [
      { id: "global", label: "Global EC", ve: GLOBAL_VE_INITIAL },
      {
        id: "compute",
        label: "compute(7)",
        ve: [
          { name: "x", value: "7" },
          { name: "doubled", value: "14" },
        ],
      },
    ],
    activeLine: 8,
    emit: "14",
    beat: "console.log(doubled) fires. The runtime writes 14.",
  },
  {
    stack: [{ id: "global", label: "Global EC", ve: GLOBAL_VE_FINAL }],
    activeLine: 13,
    emit: null,
    beat: "compute returned 14. answer is now bound. Stack is back to Global.",
  },
  {
    stack: [{ id: "global", label: "Global EC", ve: GLOBAL_VE_FINAL }],
    activeLine: 13,
    emit: "14",
    beat:
      "console.log(answer) fires — the runtime writes 14 again. Script done.",
  },
];

const TOTAL = STEPS.length;
const RUN_INTERVAL_MS = 900;

type Props = {
  initialStep?: number;
  /**
   * Pre-rendered `<CodeBlock>` from `page.tsx`. Server-side Shiki output
   * with line numbers + chrome. The widget overlays the active-line wash
   * on top of this slot via absolute positioning.
   */
  codeSlot?: ReactNode;
};

export function CallStackECs({ initialStep = 0, codeSlot }: Props) {
  const [step, setStep] = useState(initialStep);
  const [running, setRunning] = useState(false);
  const reducedMotion = useReducedMotion();

  const clamped = Math.max(0, Math.min(step, TOTAL - 1));
  const current = STEPS[clamped];
  const topFrame = current.stack[current.stack.length - 1];

  /**
   * Console output as DERIVED state. Each line is the `emit` field of a
   * step at index ≤ currentStep. Stepping back automatically drops lines
   * whose step hasn't been reached yet; stepping forward replays them.
   * No imperative `setLines` calls, no append-only history. (The PR #59
   * v1 bug — going back left stale lines — was caused by an imperative
   * append + a `lastEmittedStep` ref that prevented re-emission.)
   */
  const consoleLog = useMemo<ConsoleLine[]>(
    () =>
      STEPS
        .slice(0, clamped + 1)
        .map((s, idx) =>
          s.emit !== null ? { stepId: idx, text: s.emit } : null,
        )
        .filter((l): l is ConsoleLine => l !== null),
    [clamped],
  );

  useEffect(() => {
    if (!running) return;
    if (clamped >= TOTAL - 1) {
      setRunning(false);
      return;
    }
    const id = window.setTimeout(() => {
      setStep((s) => Math.min(s + 1, TOTAL - 1));
    }, RUN_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [running, clamped]);

  /**
   * Pop sound on EC push — fires only when the stack grows. Pops (where
   * the stack shrinks) are silent: pop animation is autonomous within
   * a step transition. Per playbook, PUSH is the "stack growing" beat.
   *
   * The ref captures the last seen stack length so we don't double-fire
   * under React strict-mode re-runs of the effect on initial mount.
   */
  const lastStackLenRef = useRef<number>(STEPS[initialStep].stack.length);
  useEffect(() => {
    const len = current.stack.length;
    if (len > lastStackLenRef.current) {
      playSound("Pop");
    }
    lastStackLenRef.current = len;
  }, [current]);

  const onStep = useCallback(() => {
    if (clamped < TOTAL - 1) {
      playSound("Progress-Tick");
      setStep(clamped + 1);
    }
  }, [clamped]);
  const onBack = useCallback(() => {
    if (clamped > 0) {
      playSound("Progress-Tick");
    }
    if (running) setRunning(false);
    if (clamped > 0) setStep(clamped - 1);
  }, [clamped, running]);
  const onReset = useCallback(() => {
    playSound("Progress-Tick");
    setRunning(false);
    setStep(0);
  }, []);
  const onRunToggle = useCallback(() => {
    playSound("Progress-Tick");
    if (running) {
      setRunning(false);
      return;
    }
    if (clamped >= TOTAL - 1) {
      setStep(0);
    }
    setRunning(true);
  }, [running, clamped]);

  const caption = (
    <>
      <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
        {topFrame.label.toLowerCase().split("(")[0]}
      </span>{" "}
      is on top. {current.beat}
    </>
  );

  const runLabel = running
    ? "Pause"
    : clamped >= TOTAL - 1
    ? "Run again"
    : clamped === 0
    ? "Run"
    : "Resume";

  const controls = (
    <div
      className="bs-csec-controls"
      role="group"
      aria-label="Call-stack step controls"
    >
      <CtrlBtn
        onClick={onBack}
        disabled={clamped === 0}
        kind="muted"
        ariaLabel="Step back"
      >
        <span aria-hidden>←</span>
        <span className="bs-csec-btn-label">Back</span>
      </CtrlBtn>
      <CtrlBtn
        onClick={onRunToggle}
        kind="accent"
        ariaLabel={running ? "Pause auto-run" : "Run auto-step"}
      >
        <span aria-hidden>{running ? "⏸" : "▶"}</span>
        <span className="bs-csec-btn-label">{runLabel}</span>
      </CtrlBtn>
      <CtrlBtn
        onClick={onStep}
        disabled={clamped === TOTAL - 1 || running}
        kind="primary"
        ariaLabel="Step forward"
      >
        <span className="bs-csec-btn-label">Step</span>
        <span aria-hidden>→</span>
      </CtrlBtn>
      <CtrlBtn
        onClick={onReset}
        kind="ghost"
        ariaLabel="Reset to first step"
      >
        <span aria-hidden>↺</span>
        <span className="bs-csec-btn-label">Reset</span>
      </CtrlBtn>
    </div>
  );

  return (
    <WidgetShell
      title="call stack · execution contexts"
      measurements={`step ${clamped + 1}/${TOTAL}`}
      state={caption}
      canvas={
        <div className="bs-csec">
          <CallStackBoard
            activeLine={current.activeLine}
            stack={current.stack}
            topId={topFrame.id}
            consoleLog={consoleLog}
            reducedMotion={Boolean(reducedMotion)}
            codeSlot={codeSlot}
          />
          <style>{`
            .bs-csec {
              display: flex;
              flex-direction: column;
              gap: var(--spacing-sm);
              min-width: 0;
            }
            .bs-csec-controls {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              align-items: center;
              justify-content: flex-start;
              min-height: 48px;
            }
            .bs-csec-btn-label {
              font-family: var(--font-sans);
              font-size: var(--text-ui);
            }
          `}</style>
        </div>
      }
      controls={controls}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Board: code pane + ↓ glyph + Stack viz + controls + console.       */
/* ------------------------------------------------------------------ */

function CallStackBoard({
  activeLine,
  stack,
  topId,
  consoleLog,
  reducedMotion,
  codeSlot,
}: {
  activeLine: number | null;
  stack: EC[];
  topId: ECName;
  consoleLog: ConsoleLine[];
  reducedMotion: boolean;
  codeSlot?: ReactNode;
}) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const codePaneRef = useRef<HTMLDivElement | null>(null);
  const codeSlotRef = useRef<HTMLDivElement | null>(null);
  const stackPaneRef = useRef<HTMLDivElement | null>(null);

  /** Active-line wash geometry (relative to the codeSlot wrapper). */
  const [washRect, setWashRect] = useState<{ top: number; height: number } | null>(
    null,
  );

  /** Container-width branch — drives single-column vs two-column. */
  const [isWide, setIsWide] = useState(false);

  // Width branch via ResizeObserver.
  useLayoutEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const update = () => setIsWide(el.clientWidth >= 720);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Measure the active line inside the rendered Shiki HTML and position the
  // terracotta wash over it. Re-measures when activeLine changes, fonts load,
  // or the code pane resizes.
  useLayoutEffect(() => {
    const slot = codeSlotRef.current;
    if (!slot) return;
    const measure = () => {
      if (activeLine == null) {
        setWashRect(null);
        return;
      }
      const lineEls = slot.querySelectorAll<HTMLElement>("span.line");
      const target = lineEls[activeLine - 1];
      if (!target) {
        setWashRect(null);
        return;
      }
      const slotRect = slot.getBoundingClientRect();
      const lineRect = target.getBoundingClientRect();
      setWashRect({
        top: lineRect.top - slotRect.top,
        height: lineRect.height,
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(slot);
    return () => ro.disconnect();
  }, [activeLine, codeSlot]);

  // The pile is rendered with `flex-col-reverse`, so the JSX array order
  // (BOTTOM of stack first, TOP last) maps to visual order (TOP at top of
  // the column, BOTTOM at the bottom). `depth` = how far behind the top
  // card this frame is. The active top frame has depth 0; the one below
  // it depth 1; etc. Border saturation per depth communicates ordering
  // without drop-shadows.

  return (
    <div ref={boardRef} className="bs-csec-board">
      {/* Code pane — reserved height fits SNIPPET. The codeSlot is the
          server-rendered <CodeBlock>; the wash <div> overlays it. */}
      <div ref={codePaneRef} className="bs-csec-region bs-csec-code">
        <div className="bs-csec-region-head">CODE</div>
        <div ref={codeSlotRef} className="bs-csec-codeslot">
          <AnimatePresence>
            {washRect ? (
              <motion.div
                key={`wash-${activeLine}`}
                aria-hidden
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={
                  reducedMotion ? { duration: 0 } : { duration: 0.18 }
                }
                className="bs-csec-wash"
                style={{
                  top: 0,
                  height: washRect.height,
                  transform: `translateY(${washRect.top}px)`,
                }}
              />
            ) : null}
          </AnimatePresence>
          {codeSlot ?? <FallbackCode lines={SNIPPET_LINES} />}
        </div>
      </div>

      {/* Mobile-only down-glyph between code and stack panes. Always
          rendered so the @container fallback's :nth-child indices remain
          stable; CSS hides it on desktop. */}
      <div
        aria-hidden
        className="bs-csec-glyph"
        style={{
          display: isWide ? "none" : "flex",
        }}
      >
        <motion.span
          key={`${activeLine}-${topId}`}
          initial={
            reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }
          }
          animate={{ opacity: 1, scale: 1 }}
          transition={reducedMotion ? { duration: 0 } : SPRING.smooth}
          style={{
            color: "var(--color-accent)",
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ↓
        </motion.span>
      </div>

      {/* Stack viz — plain vertical pile. The min-h-[256px] reservation
          (4 cards × 64 px) keeps the outer shell invariant across 1-EC
          and 3-EC states. `flex-col-reverse` + `justify-end` so the
          first JSX item (Global EC) sits at the bottom of the pile and
          newly-pushed ECs stack visually upward. AnimatePresence with
          mode="popLayout" handles push/pop without shifting survivors. */}
      <div ref={stackPaneRef} className="bs-csec-region bs-csec-stack">
        <div className="bs-csec-region-head">CALL STACK</div>
        <div className="bs-csec-stack-pile">
          <AnimatePresence initial={false} mode="popLayout">
            {stack.map((frame, idx) => {
              const depth = stack.length - 1 - idx;
              const isTop = frame.id === topId;
              return (
                <motion.div
                  key={frame.id}
                  layout
                  initial={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: 12 }
                  }
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { ...SPRING.smooth }
                  }
                  className="bs-csec-stack-row"
                >
                  <ECCardContent
                    frame={frame}
                    isTop={isTop}
                    depth={depth}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        <div className="bs-csec-stack-depth" aria-live="polite">
          depth {stack.length}
        </div>
      </div>

      {/* Console pane. Lines are derived from `STEPS[0..currentStep]
          .emit`, so stepping back removes lines that haven't fired yet
          and stepping forward replays them. AnimatePresence with
          mode="popLayout" ensures exiting lines don't shift surviving
          siblings. */}
      <div className="bs-csec-region bs-csec-console" aria-label="console output">
        <div className="bs-csec-region-head">CONSOLE</div>
        <div className="bs-csec-console-body" aria-live="polite">
          <AnimatePresence initial={false} mode="popLayout">
            {consoleLog.map((l) => (
              <motion.div
                key={`emit-${l.stepId}`}
                layout
                initial={
                  reducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }
                }
                transition={
                  reducedMotion ? { duration: 0 } : { duration: 0.18 }
                }
                className="bs-csec-console-line font-mono"
              >
                <span style={{ color: "var(--color-text-muted)" }}>›</span>{" "}
                {l.text}
              </motion.div>
            ))}
          </AnimatePresence>
          {consoleLog.length === 0 ? (
            <div className="bs-csec-console-empty font-sans">
              (no output yet — press Run)
            </div>
          ) : null}
        </div>
      </div>

      <style>{`
        .bs-csec-board {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: var(--spacing-sm);
          min-width: 0;
        }
        .bs-csec-region {
          background: color-mix(in oklab, var(--color-surface) 35%, transparent);
          border: 1px solid var(--color-rule);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          min-width: 0;
        }
        .bs-csec-region-head {
          font-family: var(--font-sans);
          font-size: 9px;
          letter-spacing: 0.08em;
          color: var(--color-text-muted);
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        /* Reserved heights — R6 frame stability. Outer shell is invariant
           regardless of EC depth. v5: stack region reserves 256 px for
           the pile (4 cards × 64 px) so the snippet's 1-EC, 2-EC, and
           3-EC states all keep the same outer height. The pile uses
           flex-col-reverse so JSX index 0 (Global) lands at the bottom. */
        .bs-csec-code { min-height: 240px; }
        .bs-csec-stack {
          min-height: 320px;
          display: flex;
          flex-direction: column;
        }
        .bs-csec-stack-pile {
          flex: 1;
          width: 100%;
          min-height: 256px;
          display: flex;
          flex-direction: column-reverse;
          justify-content: flex-start;
          gap: 8px;
          margin-top: 4px;
          min-width: 0;
        }
        .bs-csec-stack-row {
          width: 100%;
          min-width: 0;
        }
        .bs-csec-stack-depth {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-text-muted);
          text-align: right;
          padding-top: 4px;
          font-variant-numeric: tabular-nums;
        }
        .bs-csec-console { min-height: 88px; }

        .bs-csec-codeslot {
          position: relative;
          min-width: 0;
        }
        .bs-csec-codeslot > .bs-code {
          margin: 0 !important;
        }
        .bs-csec-wash {
          position: absolute;
          left: 0;
          right: 0;
          background: color-mix(in oklab, var(--color-accent) 16%, transparent);
          border-left: 2px solid var(--color-accent);
          pointer-events: none;
          z-index: 1;
        }
        .bs-csec-glyph {
          justify-content: center;
          align-items: center;
          min-height: 24px;
        }
        .bs-csec-console-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-family: var(--font-mono);
          font-size: 11.5px;
          color: var(--color-text);
          min-height: 44px;
        }
        .bs-csec-console-line {
          line-height: 1.45;
        }
        .bs-csec-console-empty {
          color: var(--color-text-muted);
          font-size: 11px;
          font-style: italic;
        }

        @container widget (min-width: 720px) {
          .bs-csec-board {
            grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
            grid-template-rows: auto auto;
          }
          /* code pane — top-left */
          .bs-csec-board > .bs-csec-code {
            grid-column: 1 / 2;
            grid-row: 1 / 2;
          }
          /* mobile glyph hides */
          .bs-csec-board > .bs-csec-glyph {
            display: none !important;
          }
          /* stack viz — top-right */
          .bs-csec-board > .bs-csec-stack {
            grid-column: 2 / 3;
            grid-row: 1 / 2;
          }
          /* console — full-width, row 2 (under both code and stack) */
          .bs-csec-board > .bs-csec-console {
            grid-column: 1 / 3;
            grid-row: 2 / 3;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fallback code — used if the codeSlot prop wasn't supplied.        */
/* ------------------------------------------------------------------ */

function FallbackCode({ lines }: { lines: number }) {
  const arr = CALL_STACK_SNIPPET.replace(/\n+$/, "").split("\n").slice(0, lines);
  return (
    <pre
      className="font-mono"
      style={{
        margin: 0,
        padding: 0,
        fontSize: 11.5,
        lineHeight: 1.5,
        color: "var(--color-text)",
        whiteSpace: "pre",
        overflowX: "auto",
      }}
    >
      <code>
        {arr.map((line, i) => (
          <span className="line" key={i} style={{ display: "block" }}>
            {line || " "}
          </span>
        ))}
      </code>
    </pre>
  );
}

/* ------------------------------------------------------------------ */
/*  EC card content — one row in the vertical stack pile.              */
/*  Compact (~64 px tall): header (function + depth chip) + 1-2 VE     */
/*  lines. Bindings render as `name = value` pairs joined by 3-space   */
/*  separators on a single line; if the line wraps, it spills to a     */
/*  second line.                                                       */
/* ------------------------------------------------------------------ */

/**
 * Border saturation tier — terracotta opacity steps to communicate
 * depth without a drop-shadow (DESIGN.md §12 compliant). Depth 0 is
 * the active top card; deeper = further back.
 *
 * Single-hue policy (DESIGN.md §3): every tint is the accent mixed with
 * `--color-text-muted`, never a different colour family. Tiers are
 * coarse on purpose — 4 visible bands tell the reader "this is depth N"
 * faster than a continuous gradient would.
 */
function depthBorderColor(depth: number): string {
  if (depth <= 0) return "var(--color-accent)";
  if (depth === 1)
    return "color-mix(in oklab, var(--color-accent) 55%, var(--color-text-muted))";
  if (depth === 2)
    return "color-mix(in oklab, var(--color-accent) 30%, var(--color-text-muted))";
  return "var(--color-text-muted)";
}

function ECCardContent({
  frame,
  isTop,
  depth,
}: {
  frame: EC;
  isTop: boolean;
  depth: number;
}) {
  const borderColor = depthBorderColor(depth);
  // Depth chip — 0, -1, -2, etc. so the reader knows the pile order at
  // a glance even after the animation settles.
  const depthLabel = depth === 0 ? "depth 0" : `depth -${depth}`;
  // Bindings inline — `name = value` joined by 3-space separators.
  // Short snippets fit on one line; longer ones wrap. The fixed
  // min-height on the body keeps the outer card shell at ~64 px.
  const veInline = frame.ve.length === 0 ? "(empty)" : null;
  return (
    <motion.div
      animate={{ borderColor }}
      transition={{ duration: 0.2 }}
      style={{
        width: "100%",
        minHeight: 64,
        padding: "8px 12px",
        background: "var(--color-surface)",
        border: `1.5px solid ${borderColor}`,
        borderRadius: "var(--radius-sm)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        boxSizing: "border-box",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          minWidth: 0,
          minHeight: 20,
        }}
      >
        <span
          aria-hidden
          style={{
            color: isTop ? "var(--color-accent)" : "transparent",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            width: "0.9em",
            display: "inline-block",
            lineHeight: 1,
          }}
        >
          ▶
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            color: isTop ? "var(--color-accent)" : "var(--color-text)",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
          title={frame.label}
        >
          {frame.label}
        </span>
        <span
          aria-hidden
          className="font-mono"
          style={{
            fontSize: 9.5,
            letterSpacing: "0.04em",
            color: "var(--color-text-muted)",
            border: `1px solid ${borderColor}`,
            borderRadius: 4,
            padding: "1px 5px",
            whiteSpace: "nowrap",
            flexShrink: 0,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {depthLabel}
        </span>
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: 10.5,
          lineHeight: 1.45,
          // Non-top cards de-emphasise their VE rows so the reader's eye
          // settles on the active frame. The values are still visible
          // (deliberate: bindings persist across the call), just muted.
          color: isTop ? "var(--color-text)" : "var(--color-text-muted)",
          display: "flex",
          flexWrap: "wrap",
          columnGap: 14,
          rowGap: 2,
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {veInline ? (
          <span style={{ color: "var(--color-text-muted)" }}>{veInline}</span>
        ) : (
          frame.ve.map((b) => (
            <span
              key={b.name}
              style={{
                whiteSpace: "nowrap",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span style={{ color: "var(--color-text-muted)" }}>{b.name}</span>
              <span style={{ color: "var(--color-text-muted)" }}>{" = "}</span>
              <span
                style={{
                  color:
                    b.value === "<uninit>"
                      ? "var(--color-text-muted)"
                      : isTop
                      ? "var(--color-accent)"
                      : "var(--color-text)",
                }}
                title={b.value}
              >
                {b.value}
              </span>
            </span>
          ))
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  CtrlBtn — tap target ≥ 44 × 44 px.                                */
/* ------------------------------------------------------------------ */

function CtrlBtn({
  children,
  onClick,
  disabled,
  kind,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  kind: "primary" | "accent" | "muted" | "ghost";
  ariaLabel?: string;
}) {
  const base: React.CSSProperties = {
    minHeight: 44,
    padding: "0 12px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-rule)",
    background: "transparent",
    color: "var(--color-text)",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
  };
  const variant: Record<typeof kind, React.CSSProperties> = {
    primary: {
      background: "var(--color-accent)",
      color: "var(--color-bg)",
      border: "1px solid var(--color-accent)",
      fontWeight: 600,
    },
    accent: {
      background: "color-mix(in oklab, var(--color-accent) 14%, transparent)",
      color: "var(--color-accent)",
      border: "1px solid var(--color-accent)",
    },
    muted: {},
    ghost: {
      color: "var(--color-text-muted)",
    },
  };
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{ ...base, ...variant[kind] }}
      {...(disabled ? {} : PRESS)}
    >
      {children}
    </motion.button>
  );
}
