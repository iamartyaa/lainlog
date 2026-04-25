"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * BrowserStoppedAskingCover — long-poll / SSE / WebSocket: a connection that stays open.
 *
 * Concept (research/animated-covers-redesign/concepts-v2.md §3):
 * The article teaches that the browser stopped polling and started keeping
 * the connection open. The cover renders two endpoints (server stacks)
 * connected by a static line, with continuous traffic-dot flow and
 * heartbeat rings emanating from each endpoint. The line never breaks.
 *
 * Composition (~58 elements):
 *  - Background (~14): vertical guide ticks + scattered ambient dots.
 *  - Mid-ground (~28): two endpoints (3 stacked circles each = server stack)
 *    + connection line + tick marks across the line.
 *  - Foreground (~16): 3 traffic dots flowing + 2 heartbeat rings + burst.
 *
 * Motion (DESIGN.md §9):
 *  - Primary (2.5s loop, continuous): 3 dots flowing left→right at staggered
 *    phases. As one exits, another enters. Never stops.
 *  - Secondary: heartbeat rings expand on both endpoints; ambient dots breathe.
 *  - Hover: traffic-dot speed increases by 1.3×.
 *
 * Frame-stability R6: cx / r / opacity only. Tokens-only.
 *
 * Path-data shape vocabulary derived from Tabler (MIT) server/cloud icons.
 */
export function BrowserStoppedAskingCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // 3 traffic dots flowing along the line (cx 60→140), staggered.
  const trafficDots = [0, 1, 2];

  // Vertical guide ticks (background).
  const guideTicks = [30, 70, 100, 130, 170];

  // Scattered ambient dots.
  const ambientDots = [
    { cx: 35, cy: 55 }, { cx: 75, cy: 45 }, { cx: 110, cy: 50 }, { cx: 150, cy: 58 },
    { cx: 165, cy: 48 },
    { cx: 40, cy: 150 }, { cx: 80, cy: 158 }, { cx: 120, cy: 152 }, { cx: 160, cy: 155 },
  ];

  // Tick marks across the connection line.
  const lineTicks = [70, 86, 102, 118, 134];

  return (
    <g>
      {/* ─── Background: vertical guide ticks ─────────────── */}
      {guideTicks.map((x, i) => (
        <line
          key={`guide-${i}`}
          x1={x}
          y1={36}
          x2={x}
          y2={42}
          stroke="var(--color-text-muted)"
          strokeWidth={0.8}
          opacity={0.18}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {guideTicks.map((x, i) => (
        <line
          key={`guide-b-${i}`}
          x1={x}
          y1={158}
          x2={x}
          y2={164}
          stroke="var(--color-text-muted)"
          strokeWidth={0.8}
          opacity={0.18}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* Scattered ambient dots */}
      {ambientDots.map((d, i) => (
        <motion.circle
          key={`amb-${i}`}
          cx={d.cx}
          cy={d.cy}
          r={1.2}
          fill="var(--color-text-muted)"
          initial={{ opacity: 0.25 }}
          animate={animate ? { opacity: [0.2, 0.32, 0.2] } : { opacity: 0.25 }}
          transition={
            animate
              ? { duration: 3, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        />
      ))}

      {/* ─── Mid-ground: connection line ───────────────────── */}
      <line
        x1={60}
        y1={100}
        x2={140}
        y2={100}
        stroke="var(--color-text-muted)"
        strokeWidth={2}
        opacity={0.7}
        vectorEffect="non-scaling-stroke"
      />
      {/* Subtle line-breathing — secondary motion */}
      <motion.line
        x1={60}
        y1={100}
        x2={140}
        y2={100}
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.25}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 1 }}
        animate={animate ? { pathLength: [0.95, 1, 0.95] } : { pathLength: 1 }}
        transition={
          animate
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />

      {/* Tick marks across the line */}
      {lineTicks.map((x) => (
        <line
          key={`tick-${x}`}
          x1={x}
          y1={97}
          x2={x}
          y2={103}
          stroke="var(--color-text-muted)"
          strokeWidth={0.9}
          opacity={0.4}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* ─── Mid-ground: Endpoint A (left) — server stack ──── */}
      <g>
        {/* 3 stacked circles representing server stack */}
        <circle cx={40} cy={86} r={9} fill="var(--color-surface)" stroke="var(--color-text-muted)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        <circle cx={40} cy={100} r={11} fill="var(--color-surface)" stroke="var(--color-text-muted)" strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
        <circle cx={40} cy={114} r={9} fill="var(--color-surface)" stroke="var(--color-text-muted)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        {/* Inner detail — small ports on the middle circle */}
        <circle cx={36} cy={100} r={1} fill="var(--color-text-muted)" opacity={0.6} />
        <circle cx={40} cy={100} r={1} fill="var(--color-text-muted)" opacity={0.6} />
        <circle cx={44} cy={100} r={1} fill="var(--color-text-muted)" opacity={0.6} />
        {/* Stack lines on top + bottom */}
        <line x1={32} y1={86} x2={48} y2={86} stroke="var(--color-text-muted)" strokeWidth={0.6} opacity={0.5} vectorEffect="non-scaling-stroke" />
        <line x1={32} y1={114} x2={48} y2={114} stroke="var(--color-text-muted)" strokeWidth={0.6} opacity={0.5} vectorEffect="non-scaling-stroke" />
      </g>

      {/* ─── Mid-ground: Endpoint B (right) — server stack ─── */}
      <g>
        <circle cx={160} cy={86} r={9} fill="var(--color-surface)" stroke="var(--color-text-muted)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        <circle cx={160} cy={100} r={11} fill="var(--color-surface)" stroke="var(--color-text-muted)" strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
        <circle cx={160} cy={114} r={9} fill="var(--color-surface)" stroke="var(--color-text-muted)" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        <circle cx={156} cy={100} r={1} fill="var(--color-text-muted)" opacity={0.6} />
        <circle cx={160} cy={100} r={1} fill="var(--color-text-muted)" opacity={0.6} />
        <circle cx={164} cy={100} r={1} fill="var(--color-text-muted)" opacity={0.6} />
        <line x1={152} y1={86} x2={168} y2={86} stroke="var(--color-text-muted)" strokeWidth={0.6} opacity={0.5} vectorEffect="non-scaling-stroke" />
        <line x1={152} y1={114} x2={168} y2={114} stroke="var(--color-text-muted)" strokeWidth={0.6} opacity={0.5} vectorEffect="non-scaling-stroke" />
      </g>

      {/* ─── Foreground: heartbeat ring on Endpoint A ──────── */}
      <motion.circle
        cx={40}
        cy={100}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
        initial={{ r: 11, opacity: 0 }}
        animate={
          animate
            ? { r: [11, 22], opacity: [0.6, 0] }
            : { r: 16, opacity: 0.4 }
        }
        transition={
          animate
            ? { duration: 2.5, repeat: Infinity, ease: "easeOut" }
            : undefined
        }
      />

      {/* ─── Foreground: heartbeat ring on Endpoint B ──────── */}
      <motion.circle
        cx={160}
        cy={100}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
        initial={{ r: 11, opacity: 0 }}
        animate={
          animate
            ? { r: [11, 22], opacity: [0.6, 0] }
            : { r: 16, opacity: 0.4 }
        }
        transition={
          animate
            ? { duration: 2.5, delay: 1.25, repeat: Infinity, ease: "easeOut" }
            : undefined
        }
      />

      {/* ─── Foreground: 3 traffic dots flowing ─────────────── */}
      {trafficDots.map((i) => (
        <motion.circle
          key={`traffic-${i}`}
          cy={100}
          r={2.6}
          fill="var(--color-accent)"
          initial={{ cx: 60, opacity: 1 }}
          animate={
            animate
              ? { cx: [60, 140], opacity: [0, 1, 1, 0] }
              : { cx: 80 + i * 20, opacity: 1 }
          }
          transition={
            animate
              ? {
                  duration: 2.5,
                  delay: i * (2.5 / 3),
                  repeat: Infinity,
                  ease: "linear",
                  times: undefined,
                }
              : undefined
          }
        />
      ))}

      {/* Burst sparkle at midpoint (low-frequency) */}
      <motion.g
        style={{ transformOrigin: "100px 100px", transformBox: "fill-box" as const }}
        initial={{ opacity: 0, scale: 1 }}
        animate={
          animate
            ? { opacity: [0, 0, 0.7, 0, 0], scale: [1, 1, 1.2, 1, 1] }
            : { opacity: 0.4, scale: 1.1 }
        }
        transition={
          animate
            ? { duration: 5, repeat: Infinity, ease: "easeInOut", times: [0, 0.5, 0.55, 0.65, 1] }
            : undefined
        }
      >
        <line x1={100} y1={92} x2={100} y2={94} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={100} y1={108} x2={100} y2={106} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={92} y1={100} x2={94} y2={100} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={108} y1={100} x2={106} y2={100} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </motion.g>
    </g>
  );
}
