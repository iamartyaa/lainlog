"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { WidgetNav } from "@/components/viz/WidgetNav";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";

type Tick = {
  caption: React.ReactNode;
  /** Per-row state at this tick. */
  a: RowState;
  b: RowState;
  db: DbState;
};

type RowState =
  | { kind: "idle" }
  | { kind: "available" }
  | { kind: "committed" }
  | { kind: "denied" }; // UNIQUE violation

type DbState =
  | { kind: "idle" }
  | { kind: "commit"; who: "A" | "B" }
  | { kind: "unique"; who: "A" | "B" };

const CANONICAL = "alice@gmail.com";

const TICKS: Tick[] = [
  {
    caption: (
      <>
        Pre-check. Both clients ask the cache about{" "}
        <span className="font-mono">{CANONICAL}</span> and both hear{" "}
        <span className="font-mono">available</span>. Both UIs go quiet.
      </>
    ),
    a: { kind: "available" },
    b: { kind: "available" },
    db: { kind: "idle" },
  },
  {
    caption: (
      <>
        A submits first. Spanner takes A&apos;s INSERT, finds the row free, and{" "}
        <em>commits</em>. The canonical email now has a row.
      </>
    ),
    a: { kind: "committed" },
    b: { kind: "available" },
    db: { kind: "commit", who: "A" },
  },
  {
    caption: (
      <>
        B submits a moment later. The same INSERT now collides with the UNIQUE
        constraint A just created. Spanner returns{" "}
        <span className="font-mono">EMAIL_EXISTS</span> — the only honest{" "}
        <em>already taken</em>{" "}signal in the whole pipeline.
      </>
    ),
    a: { kind: "committed" },
    b: { kind: "denied" },
    db: { kind: "unique", who: "B" },
  },
];

const TOTAL = TICKS.length;

type Props = { initialStep?: number };

/**
 * RaceVerdict — single verb (replay). Scripted 3-tick walk through the
 * canonical race resolution. WidgetNav drives prev / play / next at a 1400ms
 * cadence (the dramatic beat needs breath). On mount, sits at tick 0
 * (paused) per interactive-components.md §3 state-0 rule.
 *
 * Pairs with RaceMargin (one decision: timing) so each widget teaches one
 * variable. The bridge prose between them is in page.tsx.
 */
export function RaceVerdict({ initialStep = 0 }: Props) {
  const [step, setStep] = useState(initialStep);
  const clamped = Math.max(0, Math.min(step, TOTAL - 1));
  const tick = TICKS[clamped];

  const handleStep = useCallback((next: number) => setStep(next), []);

  // Geometry — 360 wide. Three stacked rows (A / DB / B) — same vocabulary as
  // RaceMargin so the reader recognises the layout, no time axis (this widget
  // is about ordering, not duration).
  const WIDTH = 360;
  const HEIGHT = 220;
  const ROW_A_Y = 40;
  const DB_Y = 110;
  const ROW_B_Y = 180;
  const LANE_X1 = 56;
  const LANE_X2 = WIDTH - 56;
  const MILE_R = 8;
  // Submit / commit milestone X positions per tick (advances along lane).
  const xForA =
    clamped === 0 ? LANE_X1 + 60 : LANE_X1 + 130; // submit → commit
  const xForB =
    clamped < 2 ? LANE_X1 + 60 : LANE_X1 + 130; // submit → denied

  const rowGlyph = (state: RowState, x: number, y: number, who: "A" | "B") => {
    if (state.kind === "idle") return null;
    if (state.kind === "available") {
      return (
        <g>
          <circle
            cx={x}
            cy={y}
            r={MILE_R / 2}
            fill="var(--color-accent)"
            opacity={0.5}
          />
          <text
            x={x}
            y={y - 12}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
          >
            available
          </text>
        </g>
      );
    }
    if (state.kind === "committed") {
      return (
        <g>
          <rect
            x={x - MILE_R}
            y={y - MILE_R}
            width={MILE_R * 2}
            height={MILE_R * 2}
            fill="var(--color-accent)"
            stroke="var(--color-bg)"
            strokeWidth={1.5}
          />
          <text
            x={x}
            y={y - 14}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={9}
            fill="var(--color-accent)"
          >
            {who} commits
          </text>
        </g>
      );
    }
    // denied — UNIQUE violation
    return (
      <g>
        <rect
          x={x - MILE_R}
          y={y - MILE_R}
          width={MILE_R * 2}
          height={MILE_R * 2}
          fill="none"
          stroke="var(--color-text)"
          strokeWidth={1.5}
        />
        <line
          x1={x - MILE_R + 2}
          y1={y - MILE_R + 2}
          x2={x + MILE_R - 2}
          y2={y + MILE_R - 2}
          stroke="var(--color-text)"
          strokeWidth={1.2}
        />
        <line
          x1={x + MILE_R - 2}
          y1={y - MILE_R + 2}
          x2={x - MILE_R + 2}
          y2={y + MILE_R - 2}
          stroke="var(--color-text)"
          strokeWidth={1.2}
        />
        <text
          x={x}
          y={y - 14}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={9}
          fill="var(--color-text)"
        >
          UNIQUE
        </text>
        <text
          x={x}
          y={y + MILE_R + 14}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={9}
          fill="var(--color-text-muted)"
        >
          EMAIL_EXISTS
        </text>
      </g>
    );
  };

  return (
    <WidgetShell
      title="race · verdict"
      state={tick.caption}
      controls={
        <WidgetNav
          value={clamped}
          total={TOTAL}
          onChange={handleStep}
          playable
          playInterval={1400}
          counterNoun="tick"
        />
      }
      canvas={
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
        aria-label={`Race verdict, tick ${clamped + 1} of ${TOTAL}.`}
      >
        {/* User A lane */}
        <g>
          <line
            x1={LANE_X1}
            x2={LANE_X2}
            y1={ROW_A_Y}
            y2={ROW_A_Y}
            stroke="var(--color-rule)"
            strokeWidth={1}
          />
          <text
            x={LANE_X1 - 10}
            y={ROW_A_Y}
            textAnchor="end"
            dominantBaseline="central"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-text-muted)"
          >
            USER A
          </text>
          <motion.g
            key={`a-${clamped}-${tick.a.kind}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.smooth}
          >
            {rowGlyph(tick.a, xForA, ROW_A_Y, "A")}
          </motion.g>
        </g>

        {/* DB lane */}
        <g>
          <rect
            x={LANE_X1}
            y={DB_Y - 24}
            width={LANE_X2 - LANE_X1}
            height={48}
            rx={3}
            fill="color-mix(in oklab, var(--color-surface) 40%, transparent)"
            stroke="var(--color-rule)"
            strokeWidth={1}
          />
          <text
            x={LANE_X1 - 10}
            y={DB_Y}
            textAnchor="end"
            dominantBaseline="central"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-text-muted)"
          >
            DB
          </text>

          {tick.db.kind === "idle" ? (
            <text
              x={(LANE_X1 + LANE_X2) / 2}
              y={DB_Y}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="var(--font-mono)"
              fontSize={11}
              fill="var(--color-text-muted)"
            >
              waiting…
            </text>
          ) : tick.db.kind === "commit" ? (
            <motion.g
              key={`db-commit-${clamped}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRING.snappy}
            >
              <circle
                cx={(LANE_X1 + LANE_X2) / 2}
                cy={DB_Y}
                r={6}
                fill="var(--color-accent)"
                stroke="var(--color-bg)"
                strokeWidth={2}
              />
              {/* Press-pulse on commit landing — §9 carve-out for transient
                  press-rings. */}
              <motion.circle
                cx={(LANE_X1 + LANE_X2) / 2}
                cy={DB_Y}
                r={6}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={1.5}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
              />
              <text
                x={(LANE_X1 + LANE_X2) / 2}
                y={DB_Y - 14}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fill="var(--color-accent)"
              >
                {tick.db.who} commits — row created
              </text>
            </motion.g>
          ) : (
            <motion.g
              key={`db-unique-${clamped}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={SPRING.smooth}
            >
              <circle
                cx={(LANE_X1 + LANE_X2) / 2}
                cy={DB_Y}
                r={6}
                fill="none"
                stroke="var(--color-text)"
                strokeWidth={1.5}
              />
              <line
                x1={(LANE_X1 + LANE_X2) / 2 - 4}
                y1={DB_Y - 4}
                x2={(LANE_X1 + LANE_X2) / 2 + 4}
                y2={DB_Y + 4}
                stroke="var(--color-text)"
                strokeWidth={1.2}
              />
              <line
                x1={(LANE_X1 + LANE_X2) / 2 + 4}
                y1={DB_Y - 4}
                x2={(LANE_X1 + LANE_X2) / 2 - 4}
                y2={DB_Y + 4}
                stroke="var(--color-text)"
                strokeWidth={1.2}
              />
              <text
                x={(LANE_X1 + LANE_X2) / 2}
                y={DB_Y - 14}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fill="var(--color-text)"
              >
                {tick.db.who}&apos;s INSERT → UNIQUE violation
              </text>
            </motion.g>
          )}
        </g>

        {/* User B lane */}
        <g>
          <line
            x1={LANE_X1}
            x2={LANE_X2}
            y1={ROW_B_Y}
            y2={ROW_B_Y}
            stroke="var(--color-rule)"
            strokeWidth={1}
          />
          <text
            x={LANE_X1 - 10}
            y={ROW_B_Y}
            textAnchor="end"
            dominantBaseline="central"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-text-muted)"
          >
            USER B
          </text>
          <motion.g
            key={`b-${clamped}-${tick.b.kind}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING.smooth}
          >
            {rowGlyph(tick.b, xForB, ROW_B_Y, "B")}
          </motion.g>
        </g>
      </svg>
      }
    />
  );
}
