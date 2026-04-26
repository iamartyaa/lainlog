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
import { Stack } from "@/components/fancy/stack-cards";
import { PRESS, SPRING } from "@/lib/motion";
import { CALL_STACK_SNIPPET } from "./CallStackSnippet";

/**
 * CallStackECs v3 — built on the React Bits <Stack> primitive.
 *
 * What changed from v2 (PR #57):
 *   1. Controls (Back / Run / Step / Reset) moved BELOW the stack viz.
 *      Cause and effect are co-located in the reader's eye-line — pressing
 *      Step now feeds the visualisation immediately above, not below.
 *   2. The EC pile now renders inside <Stack> from `components/fancy/`.
 *      Cards are absolutely-positioned with rotateZ / scale per depth, so
 *      the outer 260 px stack region is the SAME height with 1 EC, 2 ECs,
 *      3 ECs. The OUTER widget shell is therefore truly frame-stable
 *      regardless of how deep the stack pushes.
 *
 * Layout:
 *   - Mobile (< 720 px container): vertical — code pane (240 px) → ↓ glyph
 *     → stack viz (260 px) → controls (48 px) → console (88 px). Total
 *     pinned regardless of EC depth.
 *   - lg (≥ 720 px container, via @container query): two columns — code +
 *     console on the left, stack viz + controls on the right. Controls
 *     remain immediately below the stack on both layouts.
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
      caption={caption}
      captionTone="prominent"
    >
      <div className="bs-csec">
        <CallStackBoard
          activeLine={current.activeLine}
          stack={current.stack}
          topId={topFrame.id}
          consoleLog={consoleLog}
          reducedMotion={Boolean(reducedMotion)}
          codeSlot={codeSlot}
          controls={controls}
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
/*  Board: code pane + ↓ glyph + Stack viz + controls + console.       */
/* ------------------------------------------------------------------ */

function CallStackBoard({
  activeLine,
  stack,
  topId,
  consoleLog,
  reducedMotion,
  codeSlot,
  controls,
}: {
  activeLine: number | null;
  stack: EC[];
  topId: ECName;
  consoleLog: ConsoleLine[];
  reducedMotion: boolean;
  codeSlot?: ReactNode;
  controls: ReactNode;
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

  // Build the Stack's `cards` array — BOTTOM of stack first, TOP last
  // (Stack's z-order convention: last in the array renders visually on top).
  const cards = useMemo<ReactNode[]>(
    () =>
      stack.map((frame) => (
        <ECCardContent
          key={frame.id}
          frame={frame}
          isTop={frame.id === topId}
        />
      )),
    [stack, topId],
  );

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

      {/* Stack viz — outer container is fixed size. The Stack primitive
          absolutely-positions every card inside this 260 px frame, so depth
          changes (1 EC, 2 ECs, 3 ECs) don't reflow the region. */}
      <div ref={stackPaneRef} className="bs-csec-region bs-csec-stack">
        <div className="bs-csec-region-head">CALL STACK</div>
        <div className="bs-csec-stack-window">
          <Stack
            cards={cards}
            disableDrag
            animationConfig={{ stiffness: 260, damping: 28 }}
          />
        </div>
        <div className="bs-csec-stack-depth" aria-live="polite">
          depth {stack.length}
        </div>
      </div>

      {/* Controls — immediately below the stack viz. Cause + effect
          colocated in the reader's eye-line. */}
      <div className="bs-csec-region-controls">{controls}</div>

      {/* Console pane. */}
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
           regardless of EC depth (the win of using the Stack primitive). */
        .bs-csec-code { min-height: 240px; }
        .bs-csec-stack {
          min-height: 260px;
          display: flex;
          flex-direction: column;
        }
        .bs-csec-stack-window {
          position: relative;
          flex: 1;
          width: 100%;
          /* The Stack uses perspective on its inner div; cards are
             absolutely-positioned, so this wrapper must establish a
             concrete height. Cards fill the wrapper via inset:0. */
          min-height: 200px;
          margin-top: 4px;
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
        .bs-csec-region-controls {
          display: flex;
          align-items: center;
          min-height: 48px;
        }

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
            grid-template-rows: auto auto auto;
          }
          /* code pane — top-left */
          .bs-csec-board > .bs-csec-code {
            grid-column: 1 / 2;
            grid-row: 1 / 3;
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
          /* controls — directly under stack viz, right column */
          .bs-csec-board > .bs-csec-region-controls {
            grid-column: 2 / 3;
            grid-row: 2 / 3;
          }
          /* console — left column, row 3 (under code) */
          .bs-csec-board > .bs-csec-console {
            grid-column: 1 / 3;
            grid-row: 3 / 4;
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
/*  EC card content — handed to <Stack> as children for each card.    */
/*  The Stack owns positioning, rotation, scale; we own the body.     */
/* ------------------------------------------------------------------ */

function ECCardContent({ frame, isTop }: { frame: EC; isTop: boolean }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        padding: "10px 12px",
        background: "var(--color-surface)",
        border: `1px solid ${
          isTop ? "var(--color-accent)" : "var(--color-rule)"
        }`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 6,
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
          title={frame.label}
        >
          {frame.label}
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
        {frame.ve.length === 0 ? (
          <li style={{ color: "var(--color-text-muted)" }}>(empty)</li>
        ) : (
          frame.ve.map((b) => (
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
    </div>
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
