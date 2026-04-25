"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Scrubber } from "@/components/viz/Scrubber";
import { SPRING } from "@/lib/motion";
import { WidgetShell } from "./WidgetShell";

type Props = {
  initialAMs?: number;
  initialBMs?: number;
  /** Timeline width in ms. */
  scaleMs?: number;
  canonical?: string;
};

/**
 * SignupRace — two clients race to INSERT the same canonical email. Mobile-first:
 * 360-unit canvas, three stacked lanes (A / DB / B) over one time axis. The
 * pre-check showed "available" for both; the database's serial ordering at
 * commit is the only thing that actually resolves the race.
 */
export function SignupRace({
  initialAMs = 20,
  initialBMs = 28,
  scaleMs = 60,
  canonical = "alice@gmail.com",
}: Props) {
  const [aMs, setAMs] = useState(initialAMs);
  const [bMs, setBMs] = useState(initialBMs);

  const aWins = aMs <= bMs;
  const winnerMs = Math.min(aMs, bMs);
  const loserMs = Math.max(aMs, bMs);
  const tie = aMs === bMs;

  // Mobile-first geometry — 360 wide.
  const WIDTH = 360;
  const HEIGHT = 280;
  const PAD_L = 44;
  const PAD_R = 70;
  const PAD_T = 28;
  const PAD_B = 44;
  const timelineW = WIDTH - PAD_L - PAD_R;
  const scale = timelineW / scaleMs;
  const xAt = (ms: number) => PAD_L + ms * scale;
  const ROW_A_Y = PAD_T + 24;
  const DB_Y = PAD_T + 102;
  const ROW_B_Y = PAD_T + 180;
  const MILE_R = 7;

  const keyRowStart = 2;
  const precheckAt = 8;

  const renderRow = (
    yBase: number,
    userLabel: string,
    submitMs: number,
    isWinner: boolean,
  ) => {
    const commitMs = submitMs + 3;
    return (
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

        <circle
          cx={xAt(keyRowStart)}
          cy={yBase}
          r={MILE_R / 2}
          fill="var(--color-text-muted)"
        />
        <text
          x={xAt(keyRowStart)}
          y={yBase - 10}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={8}
          fill="var(--color-text-muted)"
        >
          typing
        </text>

        <g>
          <circle
            cx={xAt(precheckAt)}
            cy={yBase}
            r={MILE_R / 2}
            fill="var(--color-accent)"
            opacity={0.5}
          />
          <text
            x={xAt(precheckAt)}
            y={yBase - 10}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={8}
            fill="var(--color-text-muted)"
          >
            available
          </text>
        </g>

        <motion.g
          initial={false}
          animate={{ x: xAt(submitMs) - xAt(0) }}
          transition={SPRING.smooth}
        >
          <circle
            cx={xAt(0)}
            cy={yBase}
            r={MILE_R}
            fill="var(--color-accent)"
            stroke="var(--color-bg)"
            strokeWidth={2}
          />
          <text
            x={xAt(0)}
            y={yBase - 12}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={9}
            fill="var(--color-accent)"
          >
            submit
          </text>
        </motion.g>

        <motion.g
          initial={false}
          animate={{ x: xAt(commitMs) - xAt(0) }}
          transition={SPRING.smooth}
        >
          {isWinner ? (
            <rect
              x={xAt(0) - MILE_R}
              y={yBase - MILE_R}
              width={MILE_R * 2}
              height={MILE_R * 2}
              fill="var(--color-accent)"
              stroke="var(--color-bg)"
              strokeWidth={1.5}
            />
          ) : (
            <g>
              <rect
                x={xAt(0) - MILE_R}
                y={yBase - MILE_R}
                width={MILE_R * 2}
                height={MILE_R * 2}
                fill="none"
                stroke="var(--color-text)"
                strokeWidth={1.5}
              />
              <line
                x1={xAt(0) - MILE_R + 2}
                y1={yBase - MILE_R + 2}
                x2={xAt(0) + MILE_R - 2}
                y2={yBase + MILE_R - 2}
                stroke="var(--color-text)"
                strokeWidth={1.2}
              />
              <line
                x1={xAt(0) + MILE_R - 2}
                y1={yBase - MILE_R + 2}
                x2={xAt(0) - MILE_R + 2}
                y2={yBase + MILE_R - 2}
                stroke="var(--color-text)"
                strokeWidth={1.2}
              />
            </g>
          )}
        </motion.g>

        <text
          x={WIDTH - PAD_R + 8}
          y={yBase}
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={10}
          fill={isWinner ? "var(--color-accent)" : "var(--color-text-muted)"}
        >
          {isWinner ? "commit" : "taken"}
        </text>
      </g>
    );
  };

  return (
    <WidgetShell
      title="signup race · a / b"
      measurements={`winner: ${aWins ? "A" : "B"}${tie ? " · tie" : ""}`}
      captionTone="prominent"
      caption={
        <>
          {aWins ? "A" : "B"} commits. {aWins ? "B" : "A"}'s INSERT on{" "}
          <span className="font-mono">{canonical}</span> hits UNIQUE and returns{" "}
          <span className="font-mono">EMAIL_EXISTS</span>. Both saw{" "}
          <span className="font-mono">available</span> while typing. The database
          is the truth.
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
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`Signup race timeline. A submits at ${aMs} ms, B at ${bMs} ms.`}
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

        {/* Database lane between the two users */}
        <g>
          <rect
            x={PAD_L}
            y={DB_Y - 22}
            width={WIDTH - PAD_L - PAD_R}
            height={44}
            rx={3}
            fill="color-mix(in oklab, var(--color-surface) 40%, transparent)"
            stroke="var(--color-rule)"
            strokeWidth={1}
          />
          <text
            x={PAD_L - 8}
            y={DB_Y}
            textAnchor="end"
            dominantBaseline="central"
            fontFamily="var(--font-sans)"
            fontSize={10}
            fill="var(--color-text-muted)"
          >
            DB
          </text>

          <motion.g
            initial={false}
            animate={{ x: xAt(winnerMs + 3) - xAt(0) }}
            transition={SPRING.smooth}
          >
            <circle
              cx={xAt(0)}
              cy={DB_Y}
              r={6}
              fill="var(--color-accent)"
              stroke="var(--color-bg)"
              strokeWidth={2}
            />
            {/* Press-ring halo — re-fires only when the winner flips, so the
                ring reads as "commit landed" not "slider moved". §9 carve-out. */}
            <motion.circle
              key={`ring-${aWins ? "a" : "b"}`}
              cx={xAt(0)}
              cy={DB_Y}
              r={6}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2.4, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            />
            <text
              x={xAt(0)}
              y={DB_Y - 12}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={9}
              fill="var(--color-accent)"
            >
              {aWins ? "A" : "B"} commits
            </text>
          </motion.g>

          {loserMs !== winnerMs ? (
            <motion.g
              initial={false}
              animate={{ x: xAt(loserMs + 3) - xAt(0) }}
              transition={SPRING.smooth}
            >
              <circle
                cx={xAt(0)}
                cy={DB_Y}
                r={6}
                fill="none"
                stroke="var(--color-text)"
                strokeWidth={1.5}
              />
              <line
                x1={xAt(0) - 4}
                y1={DB_Y - 4}
                x2={xAt(0) + 4}
                y2={DB_Y + 4}
                stroke="var(--color-text)"
                strokeWidth={1.2}
              />
              <line
                x1={xAt(0) + 4}
                y1={DB_Y - 4}
                x2={xAt(0) - 4}
                y2={DB_Y + 4}
                stroke="var(--color-text)"
                strokeWidth={1.2}
              />
              <text
                x={xAt(0)}
                y={DB_Y + 16}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={9}
                fill="var(--color-text-muted)"
              >
                {aWins ? "B" : "A"} UNIQUE
              </text>
            </motion.g>
          ) : null}
        </g>

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
        {/* Tie note lives inside the SVG so the widget frame never resizes. */}
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
    </WidgetShell>
  );
}
