"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Scrubber } from "@/components/viz/Scrubber";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "@/components/viz/WidgetShell";

type Props = {
  initialAMs?: number;
  initialBMs?: number;
  scaleMs?: number;
  canonical?: string;
};

/**
 * RaceMargin — two scrubbers, one decision: how close are the two submits?
 * The §4 date-range-picker carve-out (interactive-components.md) — both
 * handles participate in a single composite decision (relative timing of A
 * and B), and the caption + measurements strip make that explicit.
 *
 * Frame-stable: dimensions pinned, all dynamic glyphs render inside the SVG.
 * The verdict (A or B wins) updates in the measurements strip.
 */
export function RaceMargin({
  initialAMs = 20,
  initialBMs = 28,
  scaleMs = 60,
  canonical = "alice@gmail.com",
}: Props) {
  const [aMs, setAMs] = useState(initialAMs);
  const [bMs, setBMs] = useState(initialBMs);

  const aWins = aMs <= bMs;
  const tie = aMs === bMs;
  const gap = Math.abs(aMs - bMs);

  // Mobile-first geometry — 360 wide. Two stacked rows; the DB lane lives in
  // the verdict widget, not here. Margin's job is just "where are A and B?".
  const WIDTH = 360;
  const HEIGHT = 180;
  const PAD_L = 44;
  const PAD_R = 70;
  const PAD_T = 26;
  const PAD_B = 36;
  const timelineW = WIDTH - PAD_L - PAD_R;
  const scale = timelineW / scaleMs;
  const xAt = (ms: number) => PAD_L + ms * scale;
  const ROW_A_Y = PAD_T + 22;
  const ROW_B_Y = PAD_T + 96;
  const MILE_R = 7;

  const renderRow = (
    yBase: number,
    userLabel: string,
    submitMs: number,
    isWinner: boolean,
  ) => (
    <g>
      <line
        x1={PAD_L}
        x2={WIDTH - PAD_R}
        y1={yBase}
        y2={yBase}
        stroke="var(--color-rule)"
        strokeWidth={1}
      />

      <text
        x={PAD_L - 8}
        y={yBase}
        textAnchor="end"
        dominantBaseline="central"
        fontFamily="var(--font-sans)"
        fontSize={10}
        fill="var(--color-text-muted)"
      >
        {userLabel}
      </text>

      {/* Pre-check beat — both clients see "available" before submit. */}
      <g>
        <circle
          cx={xAt(8)}
          cy={yBase}
          r={MILE_R / 2}
          fill="var(--color-accent)"
          opacity={0.5}
        />
        <text
          x={xAt(8)}
          y={yBase - 10}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={8}
          fill="var(--color-text-muted)"
        >
          available
        </text>
      </g>

      {/* Submit milestone — moves with the scrubber. */}
      <motion.g
        initial={false}
        animate={{ x: xAt(submitMs) - xAt(0) }}
        transition={SPRING.smooth}
      >
        <circle
          cx={xAt(0)}
          cy={yBase}
          r={MILE_R}
          fill={isWinner ? "var(--color-accent)" : "transparent"}
          stroke={isWinner ? "var(--color-accent)" : "var(--color-text)"}
          strokeWidth={isWinner ? 0 : 1.5}
        />
        <text
          x={xAt(0)}
          y={yBase - 12}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={9}
          fill={isWinner ? "var(--color-accent)" : "var(--color-text-muted)"}
        >
          submit
        </text>
      </motion.g>

      <text
        x={WIDTH - PAD_R + 8}
        y={yBase}
        dominantBaseline="central"
        fontFamily="var(--font-mono)"
        fontSize={10}
        fill={isWinner ? "var(--color-accent)" : "var(--color-text-muted)"}
      >
        {isWinner ? "first" : "second"}
      </text>
    </g>
  );

  const measurements = `gap ${gap} ms · ${tie ? "A by stable order" : aWins ? "A first" : "B first"}`;

  return (
    <WidgetShell
      title="race · margin"
      measurements={measurements}
      state={
        <>
          Drag either handle. Both clients always see{" "}
          <span className="font-mono">available</span> while typing — only{" "}
          <em>the gap to commit</em>{" "}decides who lands the address{" "}
          <span className="font-mono">{canonical}</span>.
        </>
      }
      controls={
        <div className="bs-race-controls grid grid-cols-1 gap-[var(--spacing-2xs)]">
          <Scrubber
            label="A · t"
            value={aMs}
            min={0}
            max={scaleMs}
            step={1}
            onChange={setAMs}
            format={(v) => `${v} ms`}
          />
          <Scrubber
            label="B · t"
            value={bMs}
            min={0}
            max={scaleMs}
            step={1}
            onChange={setBMs}
            format={(v) => `${v} ms`}
          />
        </div>
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
        aria-label={`Race margin. A submits at ${aMs} ms, B at ${bMs} ms — gap ${gap} ms.`}
      >
        <text
          x={PAD_L}
          y={PAD_T - 10}
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
        >
          time →
        </text>

        {renderRow(ROW_A_Y, "USER A", aMs, aWins)}
        {renderRow(ROW_B_Y, "USER B", bMs, !aWins)}

        {/* Time ticks along bottom */}
        <g>
          {[0, 15, 30, 45, 60]
            .filter((t) => t <= scaleMs)
            .map((t) => (
              <g key={t}>
                <line
                  x1={xAt(t)}
                  x2={xAt(t)}
                  y1={HEIGHT - PAD_B + 4}
                  y2={HEIGHT - PAD_B + 10}
                  stroke="var(--color-text-muted)"
                  strokeWidth={1}
                />
                <text
                  x={xAt(t)}
                  y={HEIGHT - PAD_B + 22}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)"
                  fontSize={9}
                  fill="var(--color-text-muted)"
                >
                  {t}
                </text>
              </g>
            ))}
          <text
            x={WIDTH - PAD_R}
            y={HEIGHT - PAD_B + 22}
            textAnchor="end"
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
          >
            ms
          </text>
        </g>

        {/* Tie note inside the SVG so the frame can't reflow. */}
        <motion.text
          x={WIDTH / 2}
          y={HEIGHT - 4}
          textAnchor="middle"
          fontFamily="var(--font-mono)"
          fontSize={9}
          fill="var(--color-text-muted)"
          initial={false}
          animate={{ opacity: tie ? 1 : 0 }}
          transition={SPRING.smooth}
        >
          exact tie — A wins by stable order
        </motion.text>
      </svg>
      }
    />
  );
}
