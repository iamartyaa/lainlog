"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * LineThatWaitsItsTurnCover — two-lane queue race for the event loop article.
 *
 * One sentence:
 *   The microtask queue drains completely before a single macrotask fires.
 *
 * Composition (~12 load-bearing elements):
 *  1.  Top-lane track (microtask lane, terracotta-tinted background)
 *  2.  Bottom-lane track (macrotask lane, muted background)
 *  3-6. 4 microtask chips on the top lane
 *  7-8. 2 macrotask chips on the bottom lane
 *  9.  "Now firing" indicator caret (terracotta triangle + glow)
 *  10. Loop track (curve from right edges back to left, suggests the loop topology)
 *  11. "μ" label dot for the micro lane
 *  12. "M" label dot for the macro lane
 *
 * Motion (DESIGN.md §9 / playbook §3, §4):
 *  - 5s continuous loop, no idle gap > 600ms.
 *  - Phase A (0–60%): indicator translateX sweeps ~110 across the micro lane;
 *    chip opacities ramp 1 → 0 in sequence as the indicator reaches each.
 *  - Phase B (60–78%): indicator translateY drops to the macro lane and the
 *    leftmost macro chip pulses + fades.
 *  - Phase C (78–100%): chips re-enter from offscreen-left; indicator resets.
 *  - Loop track: pathLength shimmer once per cycle (subtle).
 *  - Hover amplifies idle motion via whileHover on the wrapping motion.g.
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: indicator at right edge of micro lane; all 4 micros
 * faded; one macro chip in fade-state. The "drained" look — the article's thesis.
 */
export function LineThatWaitsItsTurnCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Lane geometry. Both lanes are horizontal bands centered around the viewBox.
  const laneX = 24;
  const laneW = 152;
  const microY = 64;
  const macroY = 124;
  const laneH = 36;

  // 4 microtask chips spread across the micro lane.
  const microChips = [
    { x: laneX + 8 },
    { x: laneX + 38 },
    { x: laneX + 68 },
    { x: laneX + 98 },
  ];
  // 2 macrotask chips spread across the macro lane.
  const macroChips = [
    { x: laneX + 18 },
    { x: laneX + 78 },
  ];

  const chipW = 22;
  const chipH = 18;

  // Indicator position keyframes within the 5s loop.
  // It sweeps the 4 micro chips (idx 0..3), drops to macro lane and fires chip 0.
  const microCenters = microChips.map((c) => c.x + chipW / 2);
  const macroCenter0 = macroChips[0].x + chipW / 2;

  // Indicator translateX keyframes (relative to viewBox), then drops Y.
  const indicatorX = [
    microCenters[0],
    microCenters[0],
    microCenters[1],
    microCenters[2],
    microCenters[3],
    macroCenter0,
    macroCenter0,
    microCenters[0],
  ];
  const indicatorY = [
    microY + laneH / 2 - 2,
    microY + laneH / 2 - 2,
    microY + laneH / 2 - 2,
    microY + laneH / 2 - 2,
    microY + laneH / 2 - 2,
    macroY + laneH / 2 - 2,
    macroY + laneH / 2 - 2,
    microY + laneH / 2 - 2,
  ];
  const indicatorTimes = [0, 0.06, 0.22, 0.38, 0.54, 0.66, 0.78, 1];

  // Each micro chip's opacity schedule — full opacity until indicator reaches it,
  // then it fades. Re-enters at end of cycle.
  const microFadeTimes: number[][] = [
    [0, 0.08, 0.18, 0.86, 0.94, 1],
    [0, 0.24, 0.34, 0.86, 0.94, 1],
    [0, 0.4, 0.5, 0.86, 0.94, 1],
    [0, 0.56, 0.66, 0.86, 0.94, 1],
  ];

  return (
    <motion.g initial={false} whileHover="hover">
      {/* ─── Lane backgrounds ─────────────────────────────────── */}
      {/* Micro lane (terracotta-tinted) */}
      <rect
        x={laneX}
        y={microY}
        width={laneW}
        height={laneH}
        rx={8}
        fill="color-mix(in oklab, var(--color-accent) 12%, transparent)"
        stroke="color-mix(in oklab, var(--color-accent) 35%, transparent)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
      />
      {/* Macro lane (muted) */}
      <rect
        x={laneX}
        y={macroY}
        width={laneW}
        height={laneH}
        rx={8}
        fill="var(--color-surface)"
        stroke="var(--color-rule)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
      />

      {/* Lane label dots — left of each lane */}
      <circle
        cx={laneX - 10}
        cy={microY + laneH / 2}
        r={2.4}
        fill="var(--color-accent)"
      />
      <circle
        cx={laneX - 10}
        cy={macroY + laneH / 2}
        r={2.4}
        fill="var(--color-text-muted)"
      />

      {/* ─── Loop track (right edge → arc back to left) ──────── */}
      {/* Subtle curve suggesting the event-loop topology. */}
      <motion.path
        d={`
          M ${laneX + laneW + 4} ${microY + laneH / 2}
          C ${laneX + laneW + 22} ${microY + laneH / 2},
            ${laneX + laneW + 22} ${macroY + laneH / 2},
            ${laneX + laneW + 4} ${macroY + laneH / 2}
        `}
        fill="none"
        stroke="var(--color-rule)"
        strokeWidth={1.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 1, opacity: 0.5 }}
        animate={
          animate
            ? { pathLength: [1, 1, 1], opacity: [0.4, 0.85, 0.4] }
            : { pathLength: 1, opacity: 0.5 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.7, 1],
              }
            : undefined
        }
      />
      {/* Tail back to left edge — arrow stub, draws on every cycle */}
      <motion.path
        d={`
          M ${laneX + laneW + 4} ${macroY + laneH / 2}
          L ${laneX + laneW + 14} ${macroY + laneH / 2}
          L ${laneX + laneW + 14} ${microY - 18}
          L ${laneX - 10} ${microY - 18}
          L ${laneX - 10} ${microY + laneH / 2 - 14}
        `}
        fill="none"
        stroke="var(--color-rule)"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeDasharray="3 3"
        vectorEffect="non-scaling-stroke"
        opacity={0.55}
      />

      {/* ─── Microtask chips ──────────────────────────────────── */}
      {microChips.map((c, i) => (
        <motion.rect
          key={`micro-${i}`}
          x={c.x}
          y={microY + (laneH - chipH) / 2}
          width={chipW}
          height={chipH}
          rx={3}
          fill="var(--color-accent)"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 1, scale: 1 }}
          animate={
            animate
              ? {
                  opacity: [1, 1, 0, 0, 1, 1],
                  scale: [1, 1.18, 0.92, 0.92, 1, 1],
                }
              : i === 3
                ? { opacity: 0, scale: 0.92 } // reduced-motion: rightmost just fading
                : { opacity: 0, scale: 0.92 } // all drained
          }
          transition={
            animate
              ? {
                  duration: 5,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  times: microFadeTimes[i],
                }
              : undefined
          }
          style={{
            transformOrigin: `${c.x + chipW / 2}px ${microY + laneH / 2}px`,
            transformBox: "fill-box" as const,
          }}
        />
      ))}

      {/* ─── Macrotask chips ──────────────────────────────────── */}
      {/* Chip 0 — fires once per cycle */}
      <motion.rect
        x={macroChips[0].x}
        y={macroY + (laneH - chipH) / 2}
        width={chipW}
        height={chipH}
        rx={3}
        fill="var(--color-surface)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 1, scale: 1 }}
        animate={
          animate
            ? {
                opacity: [1, 1, 1, 0.2, 1, 1],
                scale: [1, 1, 1.22, 0.92, 1, 1],
              }
            : { opacity: 0.2, scale: 0.92 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.6, 0.7, 0.78, 0.92, 1],
              }
            : undefined
        }
        style={{
          transformOrigin: `${macroChips[0].x + chipW / 2}px ${macroY + laneH / 2}px`,
          transformBox: "fill-box" as const,
        }}
      />
      {/* Chip 1 — static, sits in queue waiting */}
      <rect
        x={macroChips[1].x}
        y={macroY + (laneH - chipH) / 2}
        width={chipW}
        height={chipH}
        rx={3}
        fill="var(--color-surface)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── "Now firing" indicator (caret + wash) ───────────── */}
      <motion.g
        initial={false}
        animate={
          animate
            ? { x: indicatorX, y: indicatorY }
            : {
                x: indicatorX[indicatorTimes.length - 2], // settled at macro chip
                y: indicatorY[indicatorTimes.length - 2],
              }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: indicatorTimes,
              }
            : undefined
        }
      >
        {/* Soft wash beneath the chip the indicator is on */}
        <motion.circle
          cx={0}
          cy={0}
          r={16}
          fill="color-mix(in oklab, var(--color-accent) 22%, transparent)"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={
            animate
              ? { opacity: [0.5, 0.95, 0.5], scale: [1, 1.15, 1] }
              : { opacity: 0.7, scale: 1 }
          }
          transition={
            animate
              ? {
                  duration: 1.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
          style={{ transformBox: "fill-box" as const, transformOrigin: "center" }}
        />
        {/* Caret triangle pointing at chip from above */}
        <path
          d={`M -5 -16 L 5 -16 L 0 -8 Z`}
          fill="var(--color-accent)"
        />
      </motion.g>
    </motion.g>
  );
}

/**
 * LineThatWaitsItsTurnCoverStatic — Satori-safe pure-JSX export.
 * Reduced-motion end-state: indicator at far right of micro lane, all 4
 * micros faded (drained — the article's thesis), one macro chip in
 * fade-state.
 *
 * Note: color-mix() is replaced with hex equivalents because Satori
 * doesn't resolve color-mix. Tinted lane is approximated as a low-alpha
 * accent layered over the canvas.
 */
export function LineThatWaitsItsTurnCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  const SURFACE = "#1a1714";
  const RULE = "#2a2622";
  // Approximation of color-mix(accent 12% + transparent) over BG #0e1114
  const ACCENT_TINT = "#23191b";
  const ACCENT_TINT_STROKE = "#56342a";
  const ACCENT_WASH = "#3b2620";

  const laneX = 24;
  const laneW = 152;
  const microY = 64;
  const macroY = 124;
  const laneH = 36;

  const microChips = [
    { x: laneX + 8 },
    { x: laneX + 38 },
    { x: laneX + 68 },
    { x: laneX + 98 },
  ];
  const macroChips = [
    { x: laneX + 18 },
    { x: laneX + 78 },
  ];
  const chipW = 22;
  const chipH = 18;

  // Indicator parks at the rightmost micro chip's center (drained position).
  const indicatorX = microChips[3].x + chipW / 2;
  const indicatorY = microY + laneH / 2 - 2;

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Micro lane (terracotta-tinted) */}
      <rect x={laneX} y={microY} width={laneW} height={laneH} rx={8} fill={ACCENT_TINT} stroke={ACCENT_TINT_STROKE} strokeWidth={1.4} />
      {/* Macro lane (muted) */}
      <rect x={laneX} y={macroY} width={laneW} height={laneH} rx={8} fill={SURFACE} stroke={RULE} strokeWidth={1.4} />

      {/* Lane label dots */}
      <circle cx={laneX - 10} cy={microY + laneH / 2} r={2.4} fill={ACCENT} />
      <circle cx={laneX - 10} cy={macroY + laneH / 2} r={2.4} fill={MUTED} />

      {/* Loop track curve */}
      <path
        d={`M ${laneX + laneW + 4} ${microY + laneH / 2} C ${laneX + laneW + 22} ${microY + laneH / 2}, ${laneX + laneW + 22} ${macroY + laneH / 2}, ${laneX + laneW + 4} ${macroY + laneH / 2}`}
        fill="none"
        stroke={RULE}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.6}
      />
      {/* Tail back to left */}
      <path
        d={`M ${laneX + laneW + 4} ${macroY + laneH / 2} L ${laneX + laneW + 14} ${macroY + laneH / 2} L ${laneX + laneW + 14} ${microY - 18} L ${laneX - 10} ${microY - 18} L ${laneX - 10} ${microY + laneH / 2 - 14}`}
        fill="none"
        stroke={RULE}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity={0.55}
      />

      {/* Micro chips — all drained (faded) */}
      {microChips.map((c, i) => (
        <rect
          key={`micro-${i}`}
          x={c.x}
          y={microY + (laneH - chipH) / 2}
          width={chipW}
          height={chipH}
          rx={3}
          fill={ACCENT}
          stroke={ACCENT}
          strokeWidth={1.4}
          opacity={0}
        />
      ))}

      {/* Macro chip 0 — in fade-state (firing) */}
      <rect
        x={macroChips[0].x}
        y={macroY + (laneH - chipH) / 2}
        width={chipW}
        height={chipH}
        rx={3}
        fill={SURFACE}
        stroke={MUTED}
        strokeWidth={1.6}
        opacity={0.2}
      />
      {/* Macro chip 1 — static, waiting */}
      <rect
        x={macroChips[1].x}
        y={macroY + (laneH - chipH) / 2}
        width={chipW}
        height={chipH}
        rx={3}
        fill={SURFACE}
        stroke={MUTED}
        strokeWidth={1.6}
      />

      {/* Indicator at far right of micro lane */}
      <g transform={`translate(${indicatorX} ${indicatorY})`}>
        <circle cx={0} cy={0} r={16} fill={ACCENT_WASH} opacity={0.7} />
        <path d="M -5 -16 L 5 -16 L 0 -8 Z" fill={ACCENT} />
      </g>
    </svg>
  );
}
