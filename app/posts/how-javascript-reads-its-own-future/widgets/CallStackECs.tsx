"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { SPRING } from "@/lib/motion";

/**
 * CallStackECs — W3, the SPINE of "how JavaScript reads its own future".
 *
 * Single verb: step (via WidgetNav). Both panes (call stack + variable
 * environment of the running EC) are pure functions of the step index — one
 * shared cursor.
 *
 * 6 hand-authored steps walk a tiny program: outer() calls inner(). Each
 * push and pop animates with SPRING.snappy on transform + opacity only.
 *
 * Frame-stability R6: 360 wide, fixed canvas height. Stack column reserves
 * space for max-3-frame depth across all steps; VE column reserves space
 * for max-2-binding rows.
 */

type Frame = {
  /** Display label inside the frame block. */
  name: string;
};

type Binding = {
  name: string;
  /** Shown to the right of the binding name. */
  value: string;
};

type Step = {
  /** Stack from bottom (index 0) to top. The top frame is the running EC. */
  stack: Frame[];
  /** The running EC's name for caption attribution. */
  runningName: string;
  /** Variable environment of the running EC. */
  ve: Binding[];
  /** Caption beat. */
  beat: string;
};

const STEPS: Step[] = [
  {
    stack: [{ name: "global" }],
    runningName: "global",
    ve: [
      { name: "outer", value: "[fn]" },
      { name: "inner", value: "[fn]" },
    ],
    beat:
      "Global EC is the only frame. Both function declarations are bound at creation — the pre-walk has run.",
  },
  {
    stack: [{ name: "global" }],
    runningName: "global",
    ve: [
      { name: "outer", value: "[fn]" },
      { name: "inner", value: "[fn]" },
    ],
    beat:
      "About to call outer(). Step forward to push its execution context onto the stack.",
  },
  {
    stack: [{ name: "global" }, { name: "outer()" }],
    runningName: "outer",
    ve: [{ name: "a", value: "1" }],
    beat:
      "outer() invoked. Its EC pushed; it is now the running context. The variable-environment pane swapped to outer's bindings.",
  },
  {
    stack: [
      { name: "global" },
      { name: "outer()" },
      { name: "inner()" },
    ],
    runningName: "inner",
    ve: [{ name: "b", value: "2" }],
    beat:
      "inner() called from inside outer. A third frame pushed. The running EC is whichever frame is on top — that is the engine's thread of execution.",
  },
  {
    stack: [{ name: "global" }, { name: "outer()" }],
    runningName: "outer",
    ve: [{ name: "a", value: "1" }],
    beat:
      "inner returned. Its frame popped. outer is the running EC again — its variable environment is right there where it was left.",
  },
  {
    stack: [{ name: "global" }],
    runningName: "global",
    ve: [
      { name: "outer", value: "[fn]" },
      { name: "inner", value: "[fn]" },
    ],
    beat:
      "outer returned. The stack is back to a single frame: the global EC, where the script started.",
  },
];

type Props = { initialStep?: number };

const TOTAL = STEPS.length;
const MAX_DEPTH = 3;
const MAX_VE = 2;

export function CallStackECs({ initialStep = 0 }: Props) {
  const [step, setStep] = useState(initialStep);
  const clamped = Math.max(0, Math.min(step, TOTAL - 1));
  const current = STEPS[clamped];

  const caption = useMemo(
    () => (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          {current.runningName}
        </span>{" "}
        is on top. {current.beat}
      </>
    ),
    [current],
  );

  // Geometry — 360 wide, two columns.
  const WIDTH = 360;
  const PAD = 14;
  const STACK_X = PAD;
  const STACK_W = 150;
  const VE_X = STACK_X + STACK_W + 16;
  const VE_W = WIDTH - VE_X - PAD;
  const HEADER_Y = 18;
  const FRAME_H = 32;
  const FRAME_GAP = 6;
  const STACK_BASE_Y =
    HEADER_Y + 18 + (MAX_DEPTH - 1) * (FRAME_H + FRAME_GAP);
  const STACK_BOTTOM_Y = STACK_BASE_Y + FRAME_H;
  const VE_BASE_Y = HEADER_Y + 18;
  const VE_ROW_H = 28;
  const VE_GAP = 6;
  const HEIGHT =
    Math.max(STACK_BOTTOM_Y, VE_BASE_Y + MAX_VE * (VE_ROW_H + VE_GAP)) + 14;

  return (
    <WidgetShell
      title="call stack · execution contexts"
      caption={caption}
      captionTone="prominent"
      controls={
        <WidgetNav
          value={clamped}
          total={TOTAL}
          onChange={setStep}
          counterNoun="step"
        />
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{
          maxWidth: WIDTH,
          height: "auto",
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label={`Call stack and variable environment. Step ${clamped + 1} of ${TOTAL}. Running: ${current.runningName}.`}
      >
        {/* Stack column header */}
        <text
          x={STACK_X}
          y={HEADER_Y}
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill="var(--color-text-muted)"
        >
          CALL STACK
        </text>

        {/* Stack column outline — reserves max-depth height */}
        <rect
          x={STACK_X}
          y={HEADER_Y + 6}
          width={STACK_W}
          height={STACK_BOTTOM_Y - (HEADER_Y + 6)}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 35%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />

        {/* Frames stack from bottom up. Bottom (index 0) = global. Top = running EC. */}
        <AnimatePresence initial={false}>
          {current.stack.map((frame, i) => {
            const yFromBottom = i; // 0 = bottom
            const y = STACK_BASE_Y - yFromBottom * (FRAME_H + FRAME_GAP);
            const isTop = i === current.stack.length - 1;
            return (
              <motion.g
                key={`${frame.name}-${i}`}
                initial={{ opacity: 0, y: y + 8 }}
                animate={{ opacity: 1, y }}
                exit={{ opacity: 0, y: y + 6 }}
                transition={SPRING.snappy}
              >
                <rect
                  x={STACK_X + 6}
                  width={STACK_W - 12}
                  height={FRAME_H}
                  rx={3}
                  fill={
                    isTop
                      ? "color-mix(in oklab, var(--color-accent) 22%, transparent)"
                      : "color-mix(in oklab, var(--color-surface) 60%, transparent)"
                  }
                  stroke={isTop ? "var(--color-accent)" : "var(--color-rule)"}
                  strokeWidth={isTop ? 1.6 : 1}
                />
                <text
                  x={STACK_X + STACK_W / 2}
                  y={FRAME_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontFamily="var(--font-mono)"
                  fontSize={12}
                  fill={isTop ? "var(--color-accent)" : "var(--color-text)"}
                  fontWeight={isTop ? 600 : 400}
                >
                  {frame.name}
                </text>
                {isTop ? (
                  <text
                    x={STACK_X + STACK_W - 10}
                    y={FRAME_H / 2}
                    textAnchor="end"
                    dominantBaseline="central"
                    fontFamily="var(--font-sans)"
                    fontSize={8}
                    letterSpacing="0.08em"
                    fill="var(--color-accent)"
                  >
                    RUNNING
                  </text>
                ) : null}
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* VE column header */}
        <text
          x={VE_X}
          y={HEADER_Y}
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill="var(--color-text-muted)"
        >
          VARIABLE ENVIRONMENT
        </text>

        <rect
          x={VE_X}
          y={HEADER_Y + 6}
          width={VE_W}
          height={MAX_VE * (VE_ROW_H + VE_GAP) + 8}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 35%, transparent)"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
        />
        <text
          x={VE_X + 8}
          y={HEADER_Y + 18}
          fontFamily="var(--font-sans)"
          fontSize={8}
          letterSpacing="0.08em"
          fill="var(--color-accent)"
        >
          OF {current.runningName.toUpperCase()}
        </text>

        {/* VE rows — keyed by running-name + binding so they crossfade on EC switch */}
        <AnimatePresence initial={false} mode="popLayout">
          {current.ve.map((b, i) => {
            const y = VE_BASE_Y + 14 + i * (VE_ROW_H + VE_GAP);
            return (
              <motion.g
                key={`${current.runningName}-${b.name}`}
                initial={{ opacity: 0, y: y + 4 }}
                animate={{ opacity: 1, y }}
                exit={{ opacity: 0, y: y - 4 }}
                transition={{ ...SPRING.smooth, delay: i * 0.06 }}
              >
                <rect
                  x={VE_X + 6}
                  width={VE_W - 12}
                  height={VE_ROW_H}
                  rx={2}
                  fill="transparent"
                  stroke="var(--color-rule)"
                  strokeWidth={1}
                />
                <text
                  x={VE_X + 14}
                  y={VE_ROW_H / 2}
                  dominantBaseline="central"
                  fontFamily="var(--font-mono)"
                  fontSize={12}
                  fill="var(--color-text)"
                >
                  {b.name}
                </text>
                <text
                  x={VE_X + VE_W - 14}
                  y={VE_ROW_H / 2}
                  textAnchor="end"
                  dominantBaseline="central"
                  fontFamily="var(--font-mono)"
                  fontSize={11}
                  fill="var(--color-accent)"
                >
                  {b.value}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>
    </WidgetShell>
  );
}
