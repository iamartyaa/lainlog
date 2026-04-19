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
 * SignupRace — §8. Two clients, same canonical email, racing to Submit.
 * Reader drags two scrubbers to set each user's Submit time. The UI shows
 * both optimistic pre-checks returning "available"; the database decides who
 * actually commits based on which INSERT transaction wins the UNIQUE index.
 */
export function SignupRace({
  initialAMs = 20,
  initialBMs = 28,
  scaleMs = 60,
  canonical = "alice@gmail.com",
}: Props) {
  const [aMs, setAMs] = useState(initialAMs);
  const [bMs, setBMs] = useState(initialBMs);

  // Winner: whichever Submit landed first. Tie → A wins by stable ordering
  // (matches the "database picks one" behaviour — there IS a winner, even on a tie).
  const aWins = aMs <= bMs;
  const winnerMs = Math.min(aMs, bMs);
  const loserMs = Math.max(aMs, bMs);

  // Geometry
  const WIDTH = 680;
  const HEIGHT = 300;
  const PAD_L = 68;
  const PAD_R = 110;
  const PAD_T = 28;
  const PAD_B = 48;
  const timelineW = WIDTH - PAD_L - PAD_R;
  const scale = timelineW / scaleMs;
  const xAt = (ms: number) => PAD_L + ms * scale;
  const ROW_A_Y = PAD_T + 32;
  const DB_Y = PAD_T + 112;
  const ROW_B_Y = PAD_T + 196;
  const MILE_R = 8;

  const keyRowStart = 2;
  const precheckAt = 8;

  const renderRow = (
    yBase: number,
    userLabel: string,
    submitMs: number,
    isWinner: boolean,
  ) => {
    const commitMs = submitMs + 3; // small constant delay for INSERT landing at DB
    return (
      <g>
        {/* Row axis */}
        <line
          x1={PAD_L}
          x2={WIDTH - PAD_R}
          y1={yBase}
          y2={yBase}
          stroke="var(--color-rule)"
          strokeWidth={1}
        />

        {/* User label */}
        <text
          x={PAD_L - 8}
          y={yBase}
          textAnchor="end"
          dominantBaseline="central"
          fontFamily="var(--font-sans)"
          fontSize={11}
          fill="var(--color-text-muted)"
        >
          {userLabel}
        </text>

        {/* Typing start */}
        <circle cx={xAt(keyRowStart)} cy={yBase} r={MILE_R / 2} fill="var(--color-text-muted)" />
        <text
          x={xAt(keyRowStart)}
          y={yBase - 12}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={9}
          fill="var(--color-text-muted)"
        >
          typing
        </text>

        {/* Pre-check "available" */}
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
            y={yBase - 12}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={9}
            fill="var(--color-text-muted)"
          >
            pre-check: available
          </text>
        </g>

        {/* Submit click */}
        <motion.g
          initial={false}
          animate={{ x: xAt(submitMs) - xAt(0) }}
          transition={SPRING.smooth}
        >
          <circle cx={xAt(0)} cy={yBase} r={MILE_R} fill="var(--color-accent)" stroke="var(--color-bg)" strokeWidth={2} />
          <text
            x={xAt(0)}
            y={yBase - 14}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={10}
            fill="var(--color-accent)"
          >
            submit
          </text>
        </motion.g>

        {/* Commit landing at DB */}
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
              {/* Cross-hatch X inside the reject cell */}
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

        {/* Result label, right of timeline */}
        <text
          x={WIDTH - PAD_R + 12}
          y={yBase}
          dominantBaseline="central"
          fontFamily="var(--font-mono)"
          fontSize={12}
          fill={isWinner ? "var(--color-accent)" : "var(--color-text-muted)"}
        >
          {isWinner ? "commit" : "already taken"}
        </text>
      </g>
    );
  };

  return (
    <WidgetShell
      title="SignupRace"
      measurements={`t(A) = ${aMs} ms · t(B) = ${bMs} ms · winner: ${aWins ? "A" : "B"}`}
      caption={
        aMs === bMs ? (
          <>
            Exact tie. The database still has to pick one — some serial order is always imposed.
            Here, A wins the tie. The loser's INSERT hits the UNIQUE constraint on{" "}
            <span className="font-mono">{canonical}</span> and returns{" "}
            <span className="font-mono">EMAIL_EXISTS</span>. Which user "went first" in the UI
            doesn't matter. The database decides.
          </>
        ) : (
          <>
            {aWins ? "A" : "B"} submitted first and commits. {aWins ? "B" : "A"}'s INSERT for{" "}
            <span className="font-mono">{canonical}</span> hits the UNIQUE constraint and returns{" "}
            <span className="font-mono">EMAIL_EXISTS</span>. Both users saw "available" during
            typing — that check was advisory. The database is the truth.
          </>
        )
      }
      controls={
        <div className="grid grid-cols-1 gap-[var(--spacing-2xs)] md:grid-cols-2 md:gap-[var(--spacing-md)]">
          <Scrubber
            label="A submit"
            value={aMs}
            min={0}
            max={scaleMs}
            step={1}
            onChange={setAMs}
            format={(v) => `t = ${v} ms`}
          />
          <Scrubber
            label="B submit"
            value={bMs}
            min={0}
            max={scaleMs}
            step={1}
            onChange={setBMs}
            format={(v) => `t = ${v} ms`}
          />
        </div>
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        style={{ maxWidth: WIDTH, height: "auto", display: "block" }}
        role="img"
        aria-label={`Signup race: user A submits at ${aMs} ms, user B at ${bMs} ms. ${aWins ? "A" : "B"} commits; the other gets EMAIL_EXISTS.`}
      >
        {/* Time axis label */}
        <text
          x={PAD_L}
          y={PAD_T - 10}
          fontFamily="var(--font-sans)"
          fontSize={10}
          fill="var(--color-text-muted)"
        >
          time →
        </text>

        {renderRow(ROW_A_Y, "USER A", aMs, aWins)}
        {renderRow(ROW_B_Y, "USER B", bMs, !aWins)}

        {/* Database lane in the middle */}
        <g>
          <rect
            x={PAD_L}
            y={DB_Y - 24}
            width={WIDTH - PAD_L - PAD_R}
            height={48}
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
            fontSize={11}
            fill="var(--color-text-muted)"
          >
            DATABASE
          </text>

          {/* Winner's commit marker */}
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
            <text
              x={xAt(0)}
              y={DB_Y - 14}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill="var(--color-accent)"
            >
              {aWins ? "A" : "B"} commits {canonical}
            </text>
          </motion.g>

          {/* Loser's reject marker — only if loser is distinct from winner */}
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
                y={DB_Y + 18}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={10}
                fill="var(--color-text-muted)"
              >
                {aWins ? "B" : "A"} rejected (UNIQUE)
              </text>
            </motion.g>
          ) : null}
        </g>

        {/* Time ticks along bottom */}
        <g>
          {[0, 10, 20, 30, 40, 50, 60]
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
                  fontSize={10}
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
            fontSize={10}
            fill="var(--color-text-muted)"
          >
            ms
          </text>
        </g>

      </svg>
    </WidgetShell>
  );
}
