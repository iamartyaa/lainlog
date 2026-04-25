"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { PRESS, SPRING } from "@/lib/motion";

/**
 * CallStackECs — W3, the SPINE of "how JavaScript reads its own future".
 *
 * A static, annotated call-stack visualization. The reader presses Step
 * (or Run) to walk through a tiny program. On each step:
 *   - the active source line lights up in the code pane,
 *   - execution-context cards push/pop on the stack pane via spring,
 *   - on desktop, an SVG arrow connects the active line to the active EC
 *     ("the thread of execution is here"),
 *   - on mobile (≤ 640px container) the arrow collapses to a small
 *     down-glyph between the two stacked panes,
 *   - the console pane mirrors `console.log` output as it fires.
 *
 * Replaces the round-2 DragElements implementation. The cards are not
 * draggable; the thread of execution is *annotated*, not manipulated.
 *
 * Frame stability (R6): every pane reserves a fixed min-height that fits
 * the deepest stack the snippet produces (3 frames) and the longest
 * console output, so step changes never reflow the outer shell.
 */

type ECName = "global" | "compute" | "multiply";

type Binding = {
  name: string;
  value: string;
};

type EC = {
  /** Stable identifier — keeps cards mounted across steps where possible. */
  id: ECName;
  /** Header label inside the card. */
  label: string;
  /** The card's variable environment at this step. */
  ve: Binding[];
};

type ConsoleLine = {
  /** Monotonically incremented per emit. */
  id: number;
  text: string;
};

type Step = {
  /** Stack from bottom to top. The top frame is the running EC. */
  stack: EC[];
  /** Active line in the source panel (1-indexed). */
  activeLine: number | null;
  /** New console.log output appended at this step (if any). */
  emit: string | null;
  /** Caption beat. */
  beat: string;
};

const SNIPPET = [
  "function multiply(a, b) {",
  "  const result = a * b;",
  "  return result;",
  "}",
  "",
  "function compute(x) {",
  "  const doubled = multiply(x, 2);",
  "  console.log(doubled);",
  "  return doubled;",
  "}",
  "",
  "const answer = compute(7);",
  "console.log(answer);",
];

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

type Props = { initialStep?: number };

export function CallStackECs({ initialStep = 0 }: Props) {
  const [step, setStep] = useState(initialStep);
  const [consoleLog, setConsoleLog] = useState<ConsoleLine[]>([]);
  const [running, setRunning] = useState(false);
  const lastEmittedStep = useRef<number>(-1);
  const reducedMotion = useReducedMotion();

  const clamped = Math.max(0, Math.min(step, TOTAL - 1));
  const current = STEPS[clamped];
  const topFrame = current.stack[current.stack.length - 1];

  // Console-log emissions: append once per fresh step.
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

  // Auto-run loop.
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
      // restart from beginning
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
      caption={caption}
      captionTone="prominent"
      controls={
        <div
          role="group"
          aria-label="Step controls"
          className="flex flex-wrap items-center justify-center gap-[var(--spacing-2xs)] font-sans"
          style={{ fontSize: "var(--text-ui)" }}
        >
          <motion.button
            type="button"
            onClick={onBack}
            disabled={clamped === 0}
            aria-label="Step back"
            style={btnStyle(false, clamped === 0)}
            {...PRESS}
          >
            ← Back
          </motion.button>
          <motion.button
            type="button"
            onClick={onRunToggle}
            aria-label={running ? "Pause auto-run" : "Run auto-step"}
            style={btnStyle(true, false)}
            {...PRESS}
          >
            {runLabel}
          </motion.button>
          <motion.button
            type="button"
            onClick={onStep}
            disabled={clamped === TOTAL - 1 || running}
            aria-label="Step forward"
            style={btnStyle(false, clamped === TOTAL - 1 || running)}
            {...PRESS}
          >
            Step →
          </motion.button>
          <motion.button
            type="button"
            onClick={onReset}
            aria-label="Reset"
            style={btnStyle(false, false)}
            {...PRESS}
          >
            Reset
          </motion.button>
          <span
            className="font-mono tabular-nums"
            style={{
              fontSize: 11,
              color: "var(--color-text-muted)",
              marginLeft: 6,
            }}
          >
            {clamped + 1}/{TOTAL}
          </span>
        </div>
      }
    >
      <CallStackBoard
        snippet={SNIPPET}
        activeLine={current.activeLine}
        stack={current.stack}
        topId={topFrame.id}
        consoleLog={consoleLog}
        reducedMotion={Boolean(reducedMotion)}
      />
    </WidgetShell>
  );
}

/* ------------------------------------------------------------------ */
/*  Board: code pane + stack pane + arrow overlay + console pane.     */
/* ------------------------------------------------------------------ */

function CallStackBoard({
  snippet,
  activeLine,
  stack,
  topId,
  consoleLog,
  reducedMotion,
}: {
  snippet: string[];
  activeLine: number | null;
  stack: EC[];
  topId: ECName;
  consoleLog: ConsoleLine[];
  reducedMotion: boolean;
}) {
  // Geometry refs for the SVG arrow (desktop only).
  const boardRef = useRef<HTMLDivElement | null>(null);
  const codePaneRef = useRef<HTMLDivElement | null>(null);
  const stackPaneRef = useRef<HTMLDivElement | null>(null);
  const lineRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const cardRefs = useRef<Map<ECName, HTMLDivElement>>(new Map());

  const [arrow, setArrow] = useState<{
    from: { x: number; y: number };
    to: { x: number; y: number };
    visible: boolean;
  } | null>(null);

  const [isWide, setIsWide] = useState(false);

  // Track container width via ResizeObserver — drives the desktop/mobile split.
  useLayoutEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const update = () => setIsWide(el.clientWidth >= 640);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Recompute arrow geometry whenever the active line / top card / width changes.
  useLayoutEffect(() => {
    if (!isWide) {
      setArrow(null);
      return;
    }
    const board = boardRef.current;
    const lineEl = activeLine != null ? lineRefs.current.get(activeLine) : null;
    const cardEl = cardRefs.current.get(topId);
    if (!board || !lineEl || !cardEl) {
      setArrow(null);
      return;
    }
    const boardRect = board.getBoundingClientRect();
    const lineRect = lineEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const from = {
      x: lineRect.right - boardRect.left + 4,
      y: lineRect.top - boardRect.top + lineRect.height / 2,
    };
    const to = {
      x: cardRect.left - boardRect.left - 8,
      y: cardRect.top - boardRect.top + Math.min(20, cardRect.height / 2),
    };
    setArrow({ from, to, visible: true });
  }, [activeLine, topId, isWide, stack.length]);

  // Re-measure on window resize too (covers font swaps, etc.).
  useEffect(() => {
    const onResize = () => {
      // Trigger a re-render via state nudge.
      setIsWide((w) => w);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div
      ref={boardRef}
      className="bs-csec-board"
      style={{
        position: "relative",
        display: "grid",
        gap: "var(--spacing-sm)",
        gridTemplateColumns: "minmax(0, 1fr)",
      }}
    >
      {/* Code pane */}
      <div
        ref={codePaneRef}
        style={{
          background:
            "color-mix(in oklab, var(--color-surface) 35%, transparent)",
          border: "1px solid var(--color-rule)",
          borderRadius: 3,
          padding: "10px 12px",
          minWidth: 0,
          minHeight: 220,
        }}
      >
        <div
          className="font-sans"
          style={{
            fontSize: 9,
            letterSpacing: "0.08em",
            color: "var(--color-text-muted)",
            marginBottom: 8,
          }}
        >
          CODE
        </div>
        <ol
          className="font-mono"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            fontSize: 11.5,
            lineHeight: 1.5,
          }}
        >
          {snippet.map((line, i) => {
            const lineNum = i + 1;
            const isActive = activeLine === lineNum;
            return (
              <motion.li
                key={lineNum}
                ref={(el) => {
                  if (el) lineRefs.current.set(lineNum, el);
                  else lineRefs.current.delete(lineNum);
                }}
                initial={false}
                animate={{ opacity: isActive ? 1 : 0.6 }}
                transition={
                  reducedMotion ? { duration: 0 } : { duration: 0.2 }
                }
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2em 2em minmax(0, 1fr)",
                  alignItems: "center",
                  columnGap: 6,
                  padding: "1px 6px",
                  borderRadius: 2,
                  background: isActive
                    ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                    : "transparent",
                  color: isActive
                    ? "var(--color-accent)"
                    : "var(--color-text)",
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                <span
                  aria-hidden
                  style={{
                    color: "var(--color-accent)",
                    fontSize: 10,
                    visibility: isActive ? "visible" : "hidden",
                  }}
                >
                  ▶
                </span>
                <span
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: 10,
                    textAlign: "right",
                  }}
                >
                  {lineNum}
                </span>
                <span
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {line || " "}
                </span>
              </motion.li>
            );
          })}
        </ol>
      </div>

      {/* Mobile-only down-glyph hint between code and stack.
          Always rendered so :nth-child indexes stay stable; CSS hides on
          desktop. */}
      <div
        aria-hidden
        className="bs-csec-glyph"
        style={{
          display: isWide ? "none" : "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "-4px 0 -4px 0",
        }}
      >
        <motion.span
          key={`${activeLine}-${topId}`}
          initial={
            reducedMotion
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: -4 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : SPRING.smooth}
          style={{
            color: "var(--color-accent)",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ↓
        </motion.span>
      </div>

      {/* Stack pane */}
      <div
        ref={stackPaneRef}
        style={{
          position: "relative",
          background:
            "color-mix(in oklab, var(--color-surface) 25%, transparent)",
          border: "1px solid var(--color-rule)",
          borderRadius: 3,
          padding: "10px 12px",
          minHeight: 240,
          minWidth: 0,
        }}
      >
        <div
          className="font-sans"
          style={{
            fontSize: 9,
            letterSpacing: "0.08em",
            color: "var(--color-text-muted)",
            marginBottom: 8,
          }}
        >
          CALL STACK
        </div>
        {/* Cards laid out top-of-stack at the top, bottom-of-stack below. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column-reverse",
            gap: "var(--spacing-2xs)",
            justifyContent: "flex-start",
          }}
        >
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

      {/* Console pane */}
      <div
        aria-label="console output"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-rule)",
          borderRadius: 3,
          padding: "10px 12px",
          minHeight: 92,
          minWidth: 0,
          fontFamily: "var(--font-mono)",
          fontSize: 11.5,
          color: "var(--color-text)",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          className="font-sans"
          style={{
            fontSize: 9,
            letterSpacing: "0.08em",
            color: "var(--color-text-muted)",
            marginBottom: 6,
          }}
        >
          CONSOLE
        </div>
        <AnimatePresence initial={false}>
          {consoleLog.map((l) => (
            <motion.div
              key={l.id}
              initial={
                reducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={
                reducedMotion ? { duration: 0 } : { duration: 0.2 }
              }
              style={{
                display: "grid",
                gridTemplateColumns: "1.2em minmax(0, 1fr)",
                columnGap: 6,
                minWidth: 0,
              }}
            >
              <span style={{ color: "var(--color-text-muted)" }}>›</span>
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {l.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {consoleLog.length === 0 ? (
          <div
            style={{
              color: "var(--color-text-muted)",
              fontSize: 11,
              fontStyle: "italic",
            }}
          >
            (no output yet — press Run)
          </div>
        ) : null}
      </div>

      {/* Desktop SVG arrow overlay. */}
      {isWide && arrow ? (
        <ArrowOverlay arrow={arrow} reducedMotion={reducedMotion} />
      ) : null}

      <style jsx>{`
        @container widget (min-width: 640px) {
          .bs-csec-board {
            grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
            grid-template-rows: auto auto;
          }
          /* code pane: top-left */
          .bs-csec-board > :global(:nth-child(1)) {
            grid-column: 1 / 2;
            grid-row: 1 / 2;
          }
          /* mobile glyph: hidden on desktop */
          .bs-csec-board > :global(.bs-csec-glyph) {
            display: none !important;
          }
          /* stack pane: top-right */
          .bs-csec-board > :global(:nth-child(3)) {
            grid-column: 2 / 3;
            grid-row: 1 / 2;
          }
          /* console pane: spans both columns, row 2 */
          .bs-csec-board > :global(:nth-child(4)) {
            grid-column: 1 / 3;
            grid-row: 2 / 3;
          }
        }
      `}</style>
    </div>
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
  // Cubic curve with horizontal handles for a gentle s-shape.
  const dx = Math.max(40, (to.x - from.x) * 0.5);
  const c1 = { x: from.x + dx, y: from.y };
  const c2 = { x: to.x - dx, y: to.y };
  const path = `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;
  // Arrowhead at the end of the curve.
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
      }}
    >
      <AnimatePresence mode="wait">
        <motion.g
          key={arrowKey}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={
            reducedMotion ? { duration: 0 } : { duration: 0.15 }
          }
        >
          <motion.path
            d={path}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2}
            strokeLinecap="round"
            initial={
              reducedMotion ? { pathLength: 1 } : { pathLength: 0 }
            }
            animate={{ pathLength: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 240, damping: 28 }
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
      initial={
        reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }
      }
      animate={{ opacity: 1, y: 0 }}
      exit={
        reducedMotion ? { opacity: 0, y: 0 } : { opacity: 0, y: -16 }
      }
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
            color: isTop
              ? "var(--color-accent)"
              : "var(--color-text-muted)",
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
              <span style={{ color: "var(--color-text-muted)" }}>
                {b.name}
              </span>
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

function btnStyle(primary: boolean, disabled: boolean): React.CSSProperties {
  return {
    minHeight: 44,
    padding: "0 12px",
    borderRadius: "var(--radius-sm)",
    border: `1px solid ${primary ? "var(--color-accent)" : "var(--color-rule)"}`,
    background: primary
      ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
      : "transparent",
    color: primary ? "var(--color-accent)" : "var(--color-text)",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };
}
