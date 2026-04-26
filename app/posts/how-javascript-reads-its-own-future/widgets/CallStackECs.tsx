"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { PRESS, SPRING } from "@/lib/motion";
import { CALL_STACK_SNIPPET } from "./CallStackSnippet";

/**
 * CallStackECs v2 — mobile-first, frame-stable.
 *
 * Layout:
 *   - Mobile (< 720 px container): vertical stack — controls / code pane /
 *     stack pane / console pane. Each region reserves a fixed `min-h` so the
 *     outer shell never resizes during stepping. Tap targets ≥ 44 px.
 *   - lg (≥ 720 px container, via @container query): two columns — code +
 *     console on the left, stack on the right. The SVG arrow overlay
 *     activates only at this breakpoint to connect active line → top frame.
 *
 * Code rendering: the snippet is pre-rendered by `<CodeBlock>` (server
 * component, async) in `page.tsx` and passed in as a `codeSlot: ReactNode`
 * prop. The widget overlays a terracotta wash on the active line by
 * measuring the rendered Shiki `<span class="line">` rows with
 * `useLayoutEffect` + `ResizeObserver`. The Shiki HTML is unchanged.
 *
 * Frame stability (R6):
 *   - code pane min-height fits the SNIPPET line count.
 *   - stack pane min-height fits the deepest stack (3 frames).
 *   - console pane min-height fits the longest emit list (2 lines).
 *   - mobile down-glyph row reserves its own height (rendered always; toggled
 *     visible/hidden so :nth-child indexes stay stable for the @container
 *     fallback).
 */

type ECName = "global" | "compute" | "multiply";

type Binding = { name: string; value: string };

type EC = {
  id: ECName;
  label: string;
  ve: Binding[];
};

type ConsoleLine = { id: number; text: string };

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
  const [consoleLog, setConsoleLog] = useState<ConsoleLine[]>([]);
  const [running, setRunning] = useState(false);
  const lastEmittedStep = useRef<number>(-1);
  const reducedMotion = useReducedMotion();

  const clamped = Math.max(0, Math.min(step, TOTAL - 1));
  const current = STEPS[clamped];
  const topFrame = current.stack[current.stack.length - 1];

  useEffect(() => {
    if (lastEmittedStep.current === clamped) return;
    lastEmittedStep.current = clamped;
    if (current.emit !== null) {
      setConsoleLog((prev) => [
        ...prev,
        { id: prev.length + 1, text: current.emit as string },
      ]);
    }
  }, [clamped, current.emit]);

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

  const onStep = useCallback(() => {
    if (clamped < TOTAL - 1) setStep(clamped + 1);
  }, [clamped]);
  const onBack = useCallback(() => {
    if (running) setRunning(false);
    if (clamped > 0) setStep(clamped - 1);
  }, [clamped, running]);
  const onReset = useCallback(() => {
    setRunning(false);
    setStep(0);
    setConsoleLog([]);
    lastEmittedStep.current = -1;
  }, []);
  const onRunToggle = useCallback(() => {
    if (running) {
      setRunning(false);
      return;
    }
    if (clamped >= TOTAL - 1) {
      setStep(0);
      setConsoleLog([]);
      lastEmittedStep.current = -1;
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

  return (
    <WidgetShell
      title="call stack · execution contexts"
      measurements={`step ${clamped + 1}/${TOTAL}`}
      caption={caption}
      captionTone="prominent"
    >
      <div className="bs-csec">
        {/* Controls strip — single row at 360 px. Tap targets ≥ 44 px. */}
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

        <CallStackBoard
          activeLine={current.activeLine}
          stack={current.stack}
          topId={topFrame.id}
          consoleLog={consoleLog}
          reducedMotion={Boolean(reducedMotion)}
          codeSlot={codeSlot}
        />
      </div>

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
    </WidgetShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Board: code pane (Shiki + active-line wash) + stack pane +        */
/*  console pane + arrow (desktop) / down-glyph (mobile).             */
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
  const cardRefs = useRef<Map<ECName, HTMLDivElement>>(new Map());

  /** Active-line wash geometry (relative to the codeSlot wrapper). */
  const [washRect, setWashRect] = useState<{ top: number; height: number } | null>(
    null,
  );

  /** Container-width branch — drives single-column vs two-column + arrow. */
  const [isWide, setIsWide] = useState(false);

  /** SVG arrow geometry (board-relative, only used when isWide). */
  const [arrow, setArrow] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
  } | null>(null);

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
      // Shiki output: each source line is `<span class="line">…</span>` inside
      // the highlighted body. We index by 0-based position.
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

  // Arrow from active line (right edge) to top stack card (left edge).
  useLayoutEffect(() => {
    if (!isWide) {
      setArrow(null);
      return;
    }
    const board = boardRef.current;
    const slot = codeSlotRef.current;
    const cardEl = cardRefs.current.get(topId);
    if (!board || !slot || !cardEl || activeLine == null) {
      setArrow(null);
      return;
    }
    const lineEls = slot.querySelectorAll<HTMLElement>("span.line");
    const target = lineEls[activeLine - 1];
    if (!target) {
      setArrow(null);
      return;
    }
    const boardRect = board.getBoundingClientRect();
    const lineRect = target.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    setArrow({
      from: {
        x: lineRect.right - boardRect.left + 4,
        y: lineRect.top - boardRect.top + lineRect.height / 2,
      },
      to: {
        x: cardRect.left - boardRect.left - 8,
        y: cardRect.top - boardRect.top + Math.min(20, cardRect.height / 2),
      },
    });
  }, [activeLine, topId, isWide, stack.length, codeSlot]);

  // Re-measure on window resize too.
  useEffect(() => {
    const onResize = () => setIsWide((w) => w);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div ref={boardRef} className="bs-csec-board">
      {/* Code pane — reserved height fits SNIPPET. The codeSlot is the
          server-rendered <CodeBlock>; the wash <div> overlays it. */}
      <div ref={codePaneRef} className="bs-csec-region bs-csec-code">
        <div className="bs-csec-region-head">CODE</div>
        <div ref={codeSlotRef} className="bs-csec-codeslot">
          {/* Active-line wash — sits behind the Shiki HTML via stacking
              order. Animates `transform: translateY` on the y axis only;
              its own height is unchanged once measured (R6 inside the
              region). */}
          <AnimatePresence>
            {washRect ? (
              <motion.div
                key={`wash-${activeLine}`}
                aria-hidden
                initial={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0 }
                }
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

      {/* Stack pane — reserved height fits 3 frames. */}
      <div ref={stackPaneRef} className="bs-csec-region bs-csec-stack">
        <div className="bs-csec-region-head">CALL STACK</div>
        <div className="bs-csec-cards">
          <AnimatePresence initial={false}>
            {stack.map((frame) => (
              <ECCard
                key={frame.id}
                frameId={frame.id}
                label={frame.label}
                ve={frame.ve}
                isTop={frame.id === topId}
                reducedMotion={reducedMotion}
                cardRefs={cardRefs}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Console pane — reserved height fits ≤ 2 emit lines (the snippet's
          maximum). */}
      <div className="bs-csec-region bs-csec-console" aria-label="console output">
        <div className="bs-csec-region-head">CONSOLE</div>
        <div className="bs-csec-console-body" aria-live="polite">
          <AnimatePresence initial={false}>
            {consoleLog.map((l) => (
              <motion.div
                key={l.id}
                layout
                initial={
                  reducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }
                }
                animate={{ opacity: 1, y: 0 }}
                transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
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

      {/* Desktop SVG arrow overlay — only when isWide and we have geometry. */}
      {isWide && arrow ? (
        <ArrowOverlay arrow={arrow} reducedMotion={reducedMotion} />
      ) : null}

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
        /* Reserved heights — R6 frame stability. */
        .bs-csec-code { min-height: 240px; }
        .bs-csec-stack { min-height: 264px; }
        .bs-csec-console { min-height: 88px; }

        .bs-csec-codeslot {
          position: relative;
          min-width: 0;
          /* The CodeBlock has its own margin (.my-[var(--spacing-lg)]); we
             neutralise it inside the widget so the pane's reserved height
             stays accurate. */
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
        /* Stack cards: top-of-stack visually on top. */
        .bs-csec-cards {
          display: flex;
          flex-direction: column-reverse;
          gap: var(--spacing-2xs);
          justify-content: flex-start;
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
          /* stack pane — right column, full height */
          .bs-csec-board > .bs-csec-stack {
            grid-column: 2 / 3;
            grid-row: 1 / 3;
          }
          /* console pane — left column, row 2 */
          .bs-csec-board > .bs-csec-console {
            grid-column: 1 / 2;
            grid-row: 2 / 3;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Fallback code — used if the codeSlot prop wasn't supplied.        */
/*  The active-line wash measurement targets `span.line`, so the      */
/*  fallback emits the same DOM shape Shiki produces.                 */
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
/*  Arrow overlay — desktop only.                                     */
/* ------------------------------------------------------------------ */

function ArrowOverlay({
  arrow,
  reducedMotion,
}: {
  arrow: { from: { x: number; y: number }; to: { x: number; y: number } };
  reducedMotion: boolean;
}) {
  const { from, to } = arrow;
  const dx = Math.max(40, (to.x - from.x) * 0.5);
  const c1 = { x: from.x + dx, y: from.y };
  const c2 = { x: to.x - dx, y: to.y };
  const path = `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
  const angle = Math.atan2(to.y - c2.y, to.x - c2.x);
  const headLen = 8;
  const headW = 5;
  const hx = to.x;
  const hy = to.y;
  const ax = hx - headLen * Math.cos(angle);
  const ay = hy - headLen * Math.sin(angle);
  const lx = ax - headW * Math.cos(angle - Math.PI / 2);
  const ly = ay - headW * Math.sin(angle - Math.PI / 2);
  const rx = ax - headW * Math.cos(angle + Math.PI / 2);
  const ry = ay - headW * Math.sin(angle + Math.PI / 2);
  const arrowKey = `${from.x.toFixed(0)}-${from.y.toFixed(0)}-${to.x.toFixed(
    0,
  )}-${to.y.toFixed(0)}`;
  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        zIndex: 2,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.g
          key={arrowKey}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.15 }}
        >
          <motion.path
            d={path}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reducedMotion ? { duration: 0 } : SPRING.smooth
            }
          />
          <motion.polygon
            points={`${hx},${hy} ${lx},${ly} ${rx},${ry}`}
            fill="var(--color-accent)"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={
              reducedMotion ? { duration: 0 } : { duration: 0.2, delay: 0.2 }
            }
          />
        </motion.g>
      </AnimatePresence>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  EC card — push from above, pop upward, no drag.                   */
/* ------------------------------------------------------------------ */

function ECCard({
  frameId,
  label,
  ve,
  isTop,
  reducedMotion,
  cardRefs,
}: {
  frameId: ECName;
  label: string;
  ve: Binding[];
  isTop: boolean;
  reducedMotion: boolean;
  cardRefs: React.MutableRefObject<Map<ECName, HTMLDivElement>>;
}) {
  return (
    <motion.div
      ref={(el) => {
        if (el) cardRefs.current.set(frameId, el);
        else cardRefs.current.delete(frameId);
      }}
      layout={!reducedMotion}
      initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducedMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: -16 }}
      transition={reducedMotion ? { duration: 0 } : SPRING.smooth}
      style={{
        padding: "8px 10px",
        borderRadius: 4,
        background: isTop
          ? "color-mix(in oklab, var(--color-accent) 6%, transparent)"
          : "transparent",
        border: `1px solid ${
          isTop ? "var(--color-accent)" : "var(--color-rule)"
        }`,
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 6,
          minWidth: 0,
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
          }}
        >
          ▶
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isTop ? "var(--color-accent)" : "var(--color-text-muted)",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
          title={label}
        >
          {label}
        </span>
      </div>
      <ul
        className="font-mono"
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          fontSize: 10.5,
          color: "var(--color-text)",
        }}
      >
        {ve.length === 0 ? (
          <li style={{ color: "var(--color-text-muted)" }}>(empty)</li>
        ) : (
          ve.map((b) => (
            <li
              key={b.name}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, auto) minmax(0, 1fr)",
                columnGap: 6,
                minWidth: 0,
              }}
            >
              <span style={{ color: "var(--color-text-muted)" }}>{b.name}</span>
              <span
                style={{
                  textAlign: "right",
                  color:
                    b.value === "<uninit>"
                      ? "var(--color-text-muted)"
                      : "var(--color-accent)",
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontVariantNumeric: "tabular-nums",
                }}
                title={b.value}
              >
                {b.value}
              </span>
            </li>
          ))
        )}
      </ul>
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
