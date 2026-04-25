"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DragElements } from "@/components/fancy";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { PRESS, SPRING } from "@/lib/motion";

/**
 * CallStackECs — W3, the SPINE of "how JavaScript reads its own future".
 *
 * The reader presses Run to step through a tiny program. Execution-context
 * cards push and pop on a draggable stage on each step. The live "console"
 * pane below mirrors what the runtime actually emitted — so the abstract
 * idea (thread of execution moves between contexts) becomes literal: the
 * "current" indicator hops from card to card, and the console writes the
 * output of whichever line just ran.
 *
 * The cards themselves are children of `DragElements` (vendored at
 * components/fancy/drag-elements.tsx). The reader can drag them around the
 * stage to spatially organise the stack — which makes the stack-as-stack
 * metaphor concrete instead of just theoretical.
 *
 * Mobile-first: panes stack vertically on narrow widths (code → stage →
 * console). At container ≥ 640px, code+console live on the left and the
 * EC stage takes the right half. Frame-stability R6: every pane has a
 * fixed min-height; the outer shell never reflows during interaction.
 */

type ECName = "global" | "compute" | "multiply";

type Binding = {
  name: string;
  value: string;
};

type EC = {
  /** Stable identifier — survives across steps so DragElements can keep
   *  position state when a card stays mounted. */
  id: ECName;
  /** Header label inside the card. */
  label: string;
  /** The card's variable environment at this step. */
  ve: Binding[];
};

type ConsoleLine = {
  /** Monotonically incremented per step. */
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
    activeLine: 8,
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

/**
 * Static initial positions for cards on the stage. The stage is sized
 * fluidly via CSS, so positions are expressed in percentages — DragElements
 * accepts string values (px / %) for top/left.
 *
 * Order matches `cardOrder` keys below: [global, compute, multiply].
 */
const INITIAL_POSITIONS: Record<
  ECName,
  { top: string; left: string }
> = {
  global: { top: "8%", left: "8%" },
  compute: { top: "30%", left: "26%" },
  multiply: { top: "52%", left: "44%" },
};

const CARD_ORDER: ECName[] = ["global", "compute", "multiply"];

type Props = { initialStep?: number };

export function CallStackECs({ initialStep = 0 }: Props) {
  const [step, setStep] = useState(initialStep);
  const [consoleLog, setConsoleLog] = useState<ConsoleLine[]>([]);
  const lastEmittedStep = useRef<number>(-1);
  const reducedMotion = useReducedMotion();

  const clamped = Math.max(0, Math.min(step, TOTAL - 1));
  const current = STEPS[clamped];
  const topFrame = current.stack[current.stack.length - 1];

  // Record console emissions when a step's emit is fresh (not on rewind).
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

  const onRun = () => {
    if (clamped < TOTAL - 1) setStep(clamped + 1);
  };
  const onBack = () => {
    if (clamped > 0) setStep(clamped - 1);
  };
  const onReset = () => {
    setStep(0);
    setConsoleLog([]);
    lastEmittedStep.current = 0;
  };

  // Which cards are on the stack right now?
  const liveIds = useMemo(
    () => new Set(current.stack.map((f) => f.id)),
    [current.stack],
  );

  // Resolve VE for any card that's currently live (so popped cards keep
  // their last VE while their exit animation plays).
  const veById = useMemo(() => {
    const m = new Map<ECName, Binding[]>();
    for (const f of current.stack) m.set(f.id, f.ve);
    return m;
  }, [current.stack]);

  const caption = (
    <>
      <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
        {topFrame.label.toLowerCase().split("(")[0]}
      </span>{" "}
      is on top. {current.beat}
    </>
  );

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
            ←
          </motion.button>
          <motion.button
            type="button"
            onClick={onRun}
            disabled={clamped === TOTAL - 1}
            aria-label="Step forward"
            style={btnStyle(true, clamped === TOTAL - 1)}
            {...PRESS}
          >
            {clamped === 0 ? "Run" : "Step →"}
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
      <div
        className="bs-csec-grid"
        style={{
          display: "grid",
          gap: "var(--spacing-sm)",
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        {/* Code + console column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm)",
            minWidth: 0,
          }}
        >
          {/* Code pane */}
          <div
            style={{
              background:
                "color-mix(in oklab, var(--color-surface) 35%, transparent)",
              border: "1px solid var(--color-rule)",
              borderRadius: 3,
              padding: "10px 12px",
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
              SNIPPET
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
              {SNIPPET.map((line, i) => {
                const lineNum = i + 1;
                const isActive = current.activeLine === lineNum;
                return (
                  <motion.li
                    key={lineNum}
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0.62 }}
                    transition={SPRING.smooth}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2em minmax(0, 1fr)",
                      alignItems: "center",
                      columnGap: 8,
                      padding: "1px 6px",
                      borderRadius: 2,
                      background: isActive
                        ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                        : "transparent",
                      color: isActive
                        ? "var(--color-accent)"
                        : "var(--color-text)",
                    }}
                  >
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
                      {line || " "}
                    </span>
                  </motion.li>
                );
              })}
            </ol>
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
                  transition={SPRING.smooth}
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
        </div>

        {/* Stage column — DragElements with EC cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-2xs)",
            minWidth: 0,
          }}
        >
          <div
            className="font-sans"
            style={{
              fontSize: 9,
              letterSpacing: "0.08em",
              color: "var(--color-text-muted)",
              marginLeft: 2,
            }}
          >
            CALL STACK · DRAG ME
          </div>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 280,
              border: "1px dashed var(--color-rule)",
              borderRadius: 3,
              background:
                "color-mix(in oklab, var(--color-surface) 25%, transparent)",
              overflow: "hidden",
            }}
          >
            <DragElements
              dragMomentum={false}
              selectedOnTop
              initialPositions={CARD_ORDER.map((id) => INITIAL_POSITIONS[id])}
            >
              {CARD_ORDER.map((id) => {
                const isLive = liveIds.has(id);
                const isTop = topFrame.id === id;
                const ve =
                  veById.get(id) ??
                  (id === "global" ? GLOBAL_VE_INITIAL : []);
                const label = labelFor(id, ve);
                return (
                  <ECCard
                    key={id}
                    label={label}
                    ve={ve}
                    isLive={isLive}
                    isTop={isTop}
                    reducedMotion={Boolean(reducedMotion)}
                  />
                );
              })}
            </DragElements>
          </div>
        </div>

        <style jsx>{`
          @container widget (min-width: 640px) {
            .bs-csec-grid {
              grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
            }
          }
        `}</style>
      </div>
    </WidgetShell>
  );
}

function labelFor(id: ECName, ve: Binding[]): string {
  if (id === "global") return "Global EC";
  if (id === "compute") {
    const x = ve.find((b) => b.name === "x");
    return `compute(${x?.value ?? "_"})`;
  }
  // multiply
  const a = ve.find((b) => b.name === "a");
  const b = ve.find((b) => b.name === "b");
  return `multiply(${a?.value ?? "_"}, ${b?.value ?? "_"})`;
}

function btnStyle(primary: boolean, disabled: boolean): React.CSSProperties {
  return {
    minHeight: 36,
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

function ECCard({
  label,
  ve,
  isLive,
  isTop,
  reducedMotion,
}: {
  label: string;
  ve: Binding[];
  isLive: boolean;
  isTop: boolean;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isLive ? 1 : 0.18,
        scale: isLive ? 1 : 0.96,
      }}
      transition={reducedMotion ? { duration: 0 } : SPRING.smooth}
      style={{
        width: 168,
        minHeight: 96,
        padding: "8px 10px",
        borderRadius: 4,
        background: isTop
          ? "color-mix(in oklab, var(--color-accent) 16%, var(--color-surface))"
          : "var(--color-surface)",
        border: `1.4px solid ${
          isTop ? "var(--color-accent)" : "var(--color-rule)"
        }`,
        userSelect: "none",
        // No drop-shadow — DESIGN.md §12
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          marginBottom: 6,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isTop ? "var(--color-accent)" : "var(--color-text)",
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
        {isTop ? (
          <span
            className="font-sans"
            aria-label="thread of execution"
            style={{
              fontSize: 8,
              letterSpacing: "0.08em",
              color: "var(--color-accent)",
              flexShrink: 0,
            }}
          >
            ▶ RUN
          </span>
        ) : null}
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
