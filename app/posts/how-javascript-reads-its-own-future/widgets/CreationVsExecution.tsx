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
 * Layout is mobile-first: on narrow widths the time-track sits on top with
 * source + memory stacked below as flexible HTML rows (proper text-overflow
 * handling — values like `undefined` can never escape the cell). At
 * container ≥ 480px, source + memory sit side-by-side.
 *
 * Frame-stability R6: the widget shell reserves a fixed minimum height for
 * each pane so the layout doesn't reflow as the scrubber advances. Memory
 * row is one binding deep at every stop — geometry never moves.
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
    beat: "finding var x",
  },
  {
    phase: "creation",
    activeLine: null,
    memory: { name: "x", value: "undefined" },
    beat: "installing the binding",
  },
  {
    phase: "creation",
    activeLine: null,
    memory: { name: "x", value: "undefined" },
    beat: "holding at line 1 — last creation stop",
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
    beat: "execution finishes",
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
    return (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          {phaseLabel}.
        </span>{" "}
        {current.phase === "creation"
          ? "No source line has run. The binding for "
          : "Memory holds "}
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

  // Time-track geometry — SVG only renders the temporal axis.
  const TRACK_W = 360;
  const TRACK_PAD = 14;
  const TRACK_Y = 22;
  const TRACK_H = 28;
  const TRACK_TOTAL_H = TRACK_Y + TRACK_H + 14;
  const BOUNDARY_X =
    TRACK_PAD +
    ((BOUNDARY_INDEX - 0.5) / (TOTAL - 1)) * (TRACK_W - TRACK_PAD * 2);
  const CURSOR_X =
    TRACK_PAD + (clamped / (TOTAL - 1)) * (TRACK_W - TRACK_PAD * 2);

  return (
    <WidgetShell
      title="creation vs execution · var x = 5"
      state={caption}
      canvas={<CveCanvas
        clamped={clamped}
        current={current}
        TRACK_W={TRACK_W}
        TRACK_PAD={TRACK_PAD}
        TRACK_Y={TRACK_Y}
        TRACK_H={TRACK_H}
        TRACK_TOTAL_H={TRACK_TOTAL_H}
        BOUNDARY_X={BOUNDARY_X}
        CURSOR_X={CURSOR_X}
      />}
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
    />
  );
}

function CveCanvas({
  clamped,
  current,
  TRACK_W,
  TRACK_PAD,
  TRACK_Y,
  TRACK_H,
  TRACK_TOTAL_H,
  BOUNDARY_X,
  CURSOR_X,
}: {
  clamped: number;
  current: Stop;
  TRACK_W: number;
  TRACK_PAD: number;
  TRACK_Y: number;
  TRACK_H: number;
  TRACK_TOTAL_H: number;
  BOUNDARY_X: number;
  CURSOR_X: number;
}) {
  return (
    <>
      {/* Time track — mobile-first, scales fluidly */}
      <svg
        viewBox={`0 0 ${TRACK_W} ${TRACK_TOTAL_H}`}
        width="100%"
        style={{
          maxWidth: TRACK_W,
          height: "auto",
          display: "block",
          margin: "0 auto",
        }}
        role="img"
        aria-label={`Time track. Stop ${clamped + 1} of ${TOTAL}, ${current.phase} phase.`}
      >
        <text
          x={TRACK_PAD + (BOUNDARY_X - TRACK_PAD) / 2}
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
          x={BOUNDARY_X + (TRACK_W - TRACK_PAD - BOUNDARY_X) / 2}
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
          x={TRACK_PAD}
          y={TRACK_Y}
          width={TRACK_W - TRACK_PAD * 2}
          height={TRACK_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 35%, transparent)"
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <line
          x1={BOUNDARY_X}
          y1={TRACK_Y - 2}
          x2={BOUNDARY_X}
          y2={TRACK_Y + TRACK_H + 2}
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
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
      </svg>

      {/* Source + memory panes — HTML rows, mobile-first stack, side-by-side at >=480 container */}
      <div
        className="bs-cve-panes"
        style={{
          display: "grid",
          gap: "var(--spacing-sm)",
          marginTop: "var(--spacing-sm)",
          maxWidth: TRACK_W,
          marginInline: "auto",
        }}
      >
        {/* SOURCE pane */}
        <div
          className="bs-cve-pane"
          style={{
            background: "color-mix(in oklab, var(--color-surface) 35%, transparent)",
            border: "1px solid var(--color-rule)",
            borderRadius: 3,
            padding: "10px 12px",
            minHeight: 96,
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
            SOURCE
          </div>
          <ol
            className="font-mono"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 12,
            }}
          >
            {SOURCE_LINES.map((line) => {
              const isActive = current.activeLine === line.n;
              return (
                <motion.li
                  key={line.n}
                  initial={false}
                  animate={{ opacity: isActive ? 1 : 0.55 }}
                  transition={SPRING.smooth}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.5em minmax(0, 1fr)",
                    alignItems: "center",
                    columnGap: 8,
                    padding: "3px 6px",
                    borderRadius: 2,
                    background: isActive
                      ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                      : "transparent",
                    color: isActive
                      ? "var(--color-accent)"
                      : "var(--color-text)",
                  }}
                >
                  <span style={{ color: "var(--color-text-muted)" }}>
                    {line.n}
                  </span>
                  <span
                    style={{
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {line.text}
                  </span>
                </motion.li>
              );
            })}
          </ol>
        </div>

        {/* MEMORY pane */}
        <div
          className="bs-cve-pane"
          style={{
            background: "color-mix(in oklab, var(--color-surface) 35%, transparent)",
            border: `${current.phase === "creation" ? 1.4 : 1}px solid ${
              current.phase === "creation"
                ? "var(--color-accent)"
                : "var(--color-rule)"
            }`,
            borderRadius: 3,
            padding: "10px 12px",
            minHeight: 96,
            minWidth: 0,
            transition: "border-color 200ms ease",
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
            MEMORY
          </div>
          {/* The single binding row — geometry never changes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, auto) minmax(0, 1fr)",
              alignItems: "center",
              columnGap: 8,
              padding: "5px 8px",
              border: "1px solid var(--color-rule)",
              borderRadius: 2,
              minHeight: 28,
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 12,
                color: "var(--color-text)",
                minWidth: 0,
              }}
            >
              x
            </span>
            <motion.span
              key={`mem-${current.memory.value}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING.smooth}
              className="font-mono"
              title={current.memory.value}
              style={{
                fontSize: 11,
                color: "var(--color-accent)",
                textAlign: "right",
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {current.memory.value}
            </motion.span>
          </div>

          <motion.div
            key={`beat-${current.beat}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={SPRING.smooth}
            className="font-sans"
            style={{
              marginTop: 10,
              fontSize: 10,
              color: "var(--color-text-muted)",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={current.beat}
          >
            {current.beat}
          </motion.div>
        </div>

        <style jsx>{`
          @container widget (min-width: 480px) {
            .bs-cve-panes {
              grid-template-columns: 1fr 1fr;
            }
          }
        `}</style>
      </div>
    </>
  );
}
