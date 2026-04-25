"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Scrubber } from "@/components/viz/Scrubber";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { SPRING } from "@/lib/motion";

/**
 * CreationVsExecution — W1 of "how JavaScript reads its own future".
 *
 * Single verb: scrub. The reader drags a position across a labelled
 * creation→execution boundary. On the creation side, the memory column is
 * already populated (`x: undefined`). On the execution side, code lines
 * highlight as the cursor advances.
 *
 * Frame-stability R6: 360 wide, fixed canvas height, every stop reserves the
 * same memory-column geometry.
 */

type Stop = {
  /** 0..3 = creation phase progress; 4..7 = execution phase progress. */
  phase: "creation" | "execution";
  /** Active source line (1 or 2) on the right pane, or null on creation. */
  activeLine: 1 | 2 | null;
  /** Memory column at this stop. */
  memory: { name: "x"; value: "undefined" | "5" };
  /** Caption noun (the verb cue lives in the caption template). */
  beat: string;
};

const STOPS: Stop[] = [
  {
    phase: "creation",
    activeLine: null,
    memory: { name: "x", value: "undefined" },
    beat: "scanning the body",
  },
  {
    phase: "creation",
    activeLine: null,
    memory: { name: "x", value: "undefined" },
    beat: "found var x",
  },
  {
    phase: "creation",
    activeLine: null,
    memory: { name: "x", value: "undefined" },
    beat: "binding installed",
  },
  {
    phase: "creation",
    activeLine: null,
    memory: { name: "x", value: "undefined" },
    beat: "ready to run line 1",
  },
  {
    phase: "execution",
    activeLine: 1,
    memory: { name: "x", value: "undefined" },
    beat: "line 1 reads x",
  },
  {
    phase: "execution",
    activeLine: 1,
    memory: { name: "x", value: "undefined" },
    beat: "console prints undefined",
  },
  {
    phase: "execution",
    activeLine: 2,
    memory: { name: "x", value: "5" },
    beat: "line 2 assigns 5",
  },
  {
    phase: "execution",
    activeLine: 2,
    memory: { name: "x", value: "5" },
    beat: "execution complete",
  },
];

const TOTAL = STOPS.length;
const BOUNDARY_INDEX = 4; // first execution stop

const SOURCE_LINES = [
  { n: 1, text: "console.log(x)" },
  { n: 2, text: "var x = 5" },
];

type Props = { initialStop?: number };

export function CreationVsExecution({ initialStop = 0 }: Props) {
  const [stop, setStop] = useState(initialStop);
  const clamped = Math.max(0, Math.min(stop, TOTAL - 1));
  const current = STOPS[clamped];

  const caption = useMemo(() => {
    const phaseLabel =
      current.phase === "creation" ? "creation phase" : "execution phase";
    const detail =
      current.phase === "creation"
        ? `The engine has not run a single line yet — it is ${current.beat}. The binding for `
        : `${current.beat}. Memory holds `;
    return (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          {phaseLabel}.
        </span>{" "}
        {detail}
        <span style={{ fontFamily: "var(--font-mono)" }}>x</span>{" "}
        {current.phase === "creation"
          ? "is already installed with value "
          : "with value "}
        <span
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--color-accent)",
          }}
        >
          {current.memory.value}
        </span>
        .
      </>
    );
  }, [current]);

  // Geometry — 360 wide, mobile-first.
  const WIDTH = 360;
  const PAD = 14;
  const SOURCE_X = PAD;
  const SOURCE_W = 200;
  const MEM_X = SOURCE_X + SOURCE_W + 12;
  const MEM_W = WIDTH - MEM_X - PAD;
  const TRACK_Y = 22;
  const TRACK_H = 28;
  const PANE_Y = TRACK_Y + TRACK_H + 22;
  const PANE_H = 92;
  const HEIGHT = PANE_Y + PANE_H + 14;

  // Boundary x in the time-track band.
  const BOUNDARY_X =
    PAD + ((BOUNDARY_INDEX - 0.5) / (TOTAL - 1)) * (WIDTH - PAD * 2);
  const CURSOR_X =
    PAD + (clamped / (TOTAL - 1)) * (WIDTH - PAD * 2);

  return (
    <WidgetShell
      title="creation vs execution · var x = 5"
      caption={caption}
      captionTone="prominent"
      controls={
        <div className="w-full max-w-[420px]">
          <Scrubber
            label="t"
            value={clamped}
            min={0}
            max={TOTAL - 1}
            onChange={setStop}
            format={(v) => `${v}/${TOTAL - 1}`}
          />
        </div>
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
        aria-label={`Creation vs execution scrubber. Stop ${clamped + 1} of ${TOTAL}, ${current.phase} phase.`}
      >
        {/* Time-track band with creation/execution labels */}
        <text
          x={PAD + (BOUNDARY_X - PAD) / 2}
          y={TRACK_Y - 6}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill={
            current.phase === "creation"
              ? "var(--color-accent)"
              : "var(--color-text-muted)"
          }
        >
          CREATION
        </text>
        <text
          x={BOUNDARY_X + (WIDTH - PAD - BOUNDARY_X) / 2}
          y={TRACK_Y - 6}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill={
            current.phase === "execution"
              ? "var(--color-accent)"
              : "var(--color-text-muted)"
          }
        >
          EXECUTION
        </text>

        <rect
          x={PAD}
          y={TRACK_Y}
          width={WIDTH - PAD * 2}
          height={TRACK_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 35%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />

        {/* Boundary divider */}
        <line
          x1={BOUNDARY_X}
          y1={TRACK_Y - 2}
          x2={BOUNDARY_X}
          y2={TRACK_Y + TRACK_H + 2}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        {/* Cursor on the track */}
        <motion.g
          initial={false}
          animate={{ x: CURSOR_X - 5 }}
          transition={SPRING.snappy}
        >
          <rect
            x={0}
            y={TRACK_Y + 4}
            width={10}
            height={TRACK_H - 8}
            rx={2}
            fill="var(--color-accent)"
          />
        </motion.g>

        {/* Source pane */}
        <rect
          x={SOURCE_X}
          y={PANE_Y}
          width={SOURCE_W}
          height={PANE_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 35%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={SOURCE_X + 8}
          y={PANE_Y + 14}
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill="var(--color-text-muted)"
        >
          SOURCE
        </text>
        {SOURCE_LINES.map((line, i) => {
          const isActive = current.activeLine === line.n;
          const y = PANE_Y + 34 + i * 24;
          return (
            <motion.g
              key={line.n}
              initial={false}
              animate={{ opacity: isActive ? 1 : 0.55 }}
              transition={SPRING.smooth}
            >
              {isActive ? (
                <rect
                  x={SOURCE_X + 4}
                  y={y - 13}
                  width={SOURCE_W - 8}
                  height={20}
                  rx={2}
                  fill="color-mix(in oklab, var(--color-accent) 14%, transparent)"
                />
              ) : null}
              <text
                x={SOURCE_X + 12}
                y={y}
                fontFamily="var(--font-mono)"
                fontSize={11}
                fill="var(--color-text-muted)"
              >
                {line.n}
              </text>
              <text
                x={SOURCE_X + 28}
                y={y}
                fontFamily="var(--font-mono)"
                fontSize={12}
                fill={isActive ? "var(--color-accent)" : "var(--color-text)"}
              >
                {line.text}
              </text>
            </motion.g>
          );
        })}

        {/* Memory pane */}
        <rect
          x={MEM_X}
          y={PANE_Y}
          width={MEM_W}
          height={PANE_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 35%, transparent)"
          stroke={
            current.phase === "creation"
              ? "var(--color-accent)"
              : "var(--color-rule)"
          }
          strokeWidth={current.phase === "creation" ? 1.4 : 1}
        />
        <text
          x={MEM_X + 8}
          y={PANE_Y + 14}
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill="var(--color-text-muted)"
        >
          MEMORY
        </text>
        {/* The single binding row — geometry never changes. */}
        <rect
          x={MEM_X + 6}
          y={PANE_Y + 28}
          width={MEM_W - 12}
          height={28}
          rx={2}
          fill="transparent"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={MEM_X + 14}
          y={PANE_Y + 46}
          fontFamily="var(--font-mono)"
          fontSize={12}
          fill="var(--color-text)"
        >
          x
        </text>
        <text
          x={MEM_X + MEM_W - 14}
          y={PANE_Y + 46}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize={11}
          fill="var(--color-accent)"
        >
          <motion.tspan
            key={`mem-${current.memory.value}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.smooth}
          >
            {current.memory.value}
          </motion.tspan>
        </text>

        {/* Beat tag inside memory pane */}
        <text
          x={MEM_X + 8}
          y={PANE_Y + PANE_H - 10}
          fontFamily="var(--font-sans)"
          fontSize={10}
          fill="var(--color-text-muted)"
        >
          {current.beat}
        </text>
      </svg>
    </WidgetShell>
  );
}
