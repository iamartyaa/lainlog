"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * FunctionRememberedCover — v7 metaphor revamp.
 *
 * One sentence:
 *   A `for` loop emits three closure tokens in sequence — each closure
 *   carrying its own captured value at a different vertical position —
 *   visualizing the var-vs-let bug as memory of birth context.
 *
 * Why this metaphor (v7):
 *   v5/v6 used "outer fades, inner stays + tether to anchor." That was
 *   generic-closure abstraction and missed the article's actual
 *   subject: the `var` vs `let` loop bug. v7 surfaces the loop and
 *   shows the closures keeping different values — which is the article's
 *   thesis (with `let`, each captured value differs; with `var`, they
 *   would all collapse to one).
 *
 * Composition (10 elements):
 *  1.  Loop region (rounded-rect, top-left) — abstract `for (...)` zone.
 *  2.  Iteration glyph (3 small ticks inside the loop region) — a
 *      gentle position swap on each iteration as the support gesture.
 *  3.  Loop curl (small circular arrow path inside loop region —
 *      indicates "iterates").
 *  4-6. Three closure tokens (rounded-rects emitted in sequence,
 *      stacked vertically on the right). Each carries:
 *  7-9. Three captured-value dots, one inside each closure, at
 *      DIFFERENT vertical offsets (the article's payload — the values
 *      are remembered separately).
 *  10. Connecting flow line from loop region to closures (chrome
 *      dashed) — gives the composition geometric anchor.
 *
 * Motion (playbook §3, §4, §14 — refined contemplative register):
 *  - 6s continuous loop. One hero gesture (closures emerging in
 *    sequence) + one quiet support (loop iteration glyph stepping).
 *  - Phase A (0–0.20): closure 1 emerges (opacity + small slide-in
 *    from loop region); captured-value dot reveals.
 *  - Phase B (0.20–0.40): closure 2 emerges below closure 1.
 *  - Phase C (0.40–0.62): closure 3 emerges below closure 2; its dot
 *    lands with a faint brightness ripple (delight beat).
 *  - Phase D (0.62–0.92): all three hold, the loop iteration glyph
 *    cycles position to "drive" the loop visually.
 *  - Phase E (0.92–1): brief reset.
 *  - Hover amplifies via whileHover on the wrapping motion.g.
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: all 3 closures visible with captured-value
 * dots at different positions, loop iteration glyph at the final
 * iteration. The article's thesis lands from the still: distinct
 * captured values → closures remembered birth context.
 */
export function FunctionRememberedCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Loop region (top-left).
  const loopX = 22;
  const loopY = 38;
  const loopW = 60;
  const loopH = 50;

  // Closure column (right).
  const closureX = 110;
  const closureW = 68;
  const closureH = 30;
  const closureGap = 10;
  const closures = [
    { y: 38 + 0 * (closureH + closureGap), dotOffset: -7 },
    { y: 38 + 1 * (closureH + closureGap), dotOffset: 0 },
    { y: 38 + 2 * (closureH + closureGap), dotOffset: 7 },
  ];

  // Iteration tick positions (inside loop region).
  const tickXs = [loopX + 12, loopX + 22, loopX + 32];
  const tickY = loopY + loopH - 10;

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── Loop region ────────────────────────────────────────── */}
      <rect
        x={loopX}
        y={loopY}
        width={loopW}
        height={loopH}
        rx={6}
        fill="color-mix(in oklab, var(--color-accent) 6%, transparent)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />

      {/* Loop curl arrow — small circular path indicating "iterates" */}
      <path
        d={`M ${loopX + 24} ${loopY + 18} a 8 8 0 1 0 8 -2`}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.65}
        vectorEffect="non-scaling-stroke"
      />
      {/* Arrow tip — small chevron */}
      <path
        d={`M ${loopX + 30} ${loopY + 14} L ${loopX + 32} ${loopY + 16} L ${loopX + 30} ${loopY + 18}`}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
        vectorEffect="non-scaling-stroke"
      />

      {/* Iteration ticks — three positions; the "active" one is opacity-led */}
      {tickXs.map((tx, i) => {
        // Cycles through 0,1,2 based on phase. Active tick has higher opacity.
        const idleOpacities = [
          [1, 1, 0.3, 0.3, 0.3, 1, 1], // tick 0
          [0.3, 0.3, 1, 1, 0.3, 0.3, 0.3], // tick 1
          [0.3, 0.3, 0.3, 0.3, 1, 1, 0.3], // tick 2
        ];
        return (
          <motion.line
            key={`tick-${i}`}
            x1={tx}
            y1={tickY - 3}
            x2={tx}
            y2={tickY + 3}
            stroke="var(--color-accent)"
            strokeWidth={1.4}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0.4 }}
            animate={
              animate
                ? { opacity: idleOpacities[i] }
                : { opacity: i === 2 ? 1 : 0.4 }
            }
            transition={
              animate
                ? {
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, 0.05, 0.2, 0.4, 0.55, 0.92, 1],
                  }
                : undefined
            }
          />
        );
      })}

      {/* ─── Connecting flow line (chrome dashed) ───────────────── */}
      <line
        x1={loopX + loopW}
        y1={loopY + loopH / 2}
        x2={closureX}
        y2={closureH / 2 + 38}
        stroke="var(--color-text-muted)"
        strokeWidth={1.0}
        strokeDasharray="2 3"
        opacity={0.32}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Closure tokens (3, emerging in sequence) ───────────── */}
      {closures.map((c, i) => {
        const emergeStart = i * 0.2;
        const emergeMid = emergeStart + 0.04;
        const emergeEnd = emergeStart + 0.08;
        return (
          <g key={`closure-${i}`}>
            {/* Closure rect */}
            <motion.rect
              x={closureX}
              y={c.y}
              width={closureW}
              height={closureH}
              rx={4}
              fill="color-mix(in oklab, var(--color-accent) 8%, transparent)"
              stroke="var(--color-text-muted)"
              strokeWidth={1.2}
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={
                animate
                  ? { opacity: [0, 0, 0.85, 0.85, 0] }
                  : { opacity: 0.85 }
              }
              transition={
                animate
                  ? {
                      duration: 6,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.2, 1],
                      times: [0, emergeStart, emergeEnd, 0.92, 1],
                    }
                  : undefined
              }
            />
            {/* Closure outline pathLength reveal — the "drawing in" */}
            <motion.rect
              x={closureX}
              y={c.y}
              width={closureW}
              height={closureH}
              rx={4}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={1.4}
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                animate
                  ? {
                      pathLength: [0, 0, 1, 1, 0],
                      opacity: [0, 0, 0.45, 0.45, 0],
                    }
                  : { pathLength: 1, opacity: 0.5 }
              }
              transition={
                animate
                  ? {
                      duration: 6,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.2, 1],
                      times: [0, emergeStart, emergeMid + 0.04, 0.92, 1],
                    }
                  : undefined
              }
            />
            {/* Inner label-stub line */}
            <motion.line
              x1={closureX + 8}
              y1={c.y + 8}
              x2={closureX + 24}
              y2={c.y + 8}
              stroke="var(--color-text-muted)"
              strokeWidth={1.0}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={
                animate
                  ? { opacity: [0, 0, 0.7, 0.7, 0] }
                  : { opacity: 0.7 }
              }
              transition={
                animate
                  ? {
                      duration: 6,
                      repeat: Infinity,
                      ease: "linear",
                      times: [0, emergeStart, emergeEnd, 0.92, 1],
                    }
                  : undefined
              }
            />
            {/* Captured-value dot — different vertical offset per closure */}
            <motion.circle
              cx={closureX + closureW - 12}
              cy={c.y + closureH / 2 + c.dotOffset}
              r={i === 2 ? 3 : 2.6}
              fill="var(--color-accent)"
              initial={{ opacity: 0 }}
              animate={
                animate
                  ? i === 2
                    ? // Closure 3 — delight: faint brightness ripple as it settles.
                      { opacity: [0, 0, 1, 0.7, 1, 0.95, 0] }
                    : { opacity: [0, 0, 1, 0.95, 0] }
                  : { opacity: 0.95 }
              }
              transition={
                animate
                  ? i === 2
                    ? {
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, emergeStart, emergeEnd, emergeEnd + 0.05, emergeEnd + 0.1, 0.92, 1],
                      }
                    : {
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        times: [0, emergeStart, emergeEnd, 0.92, 1],
                      }
                  : undefined
              }
            />
          </g>
        );
      })}
    </motion.g>
  );
}

/**
 * FunctionRememberedCoverStatic — Satori-safe pure-JSX export.
 * Reduced-motion end-state: all 3 closures visible with captured-value
 * dots at different vertical positions, loop iteration glyph at the
 * final iteration. The thesis lands statically: closures remember
 * distinct birth contexts.
 */
export function FunctionRememberedCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  const LOOP_FILL = "#23191b"; // ~4% terracotta
  const CLOSURE_FILL = "#3b2620"; // ~10% terracotta

  const loopX = 22;
  const loopY = 38;
  const loopW = 60;
  const loopH = 50;
  const tickY = loopY + loopH - 10;
  const closureX = 110;
  const closureW = 68;
  const closureH = 30;
  const closureGap = 10;
  const closures = [
    { y: 38 + 0 * (closureH + closureGap), dotOffset: -7 },
    { y: 38 + 1 * (closureH + closureGap), dotOffset: 0 },
    { y: 38 + 2 * (closureH + closureGap), dotOffset: 7 },
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Loop region */}
      <rect x={loopX} y={loopY} width={loopW} height={loopH} rx={6} fill={LOOP_FILL} stroke={MUTED} strokeWidth={1.2} />

      {/* Loop curl arrow */}
      <path
        d={`M ${loopX + 24} ${loopY + 18} a 8 8 0 1 0 8 -2`}
        fill="none"
        stroke={MUTED}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.65}
      />
      <path
        d={`M ${loopX + 30} ${loopY + 14} L ${loopX + 32} ${loopY + 16} L ${loopX + 30} ${loopY + 18}`}
        fill="none"
        stroke={MUTED}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.65}
      />

      {/* Iteration ticks — final iteration: tick 2 active */}
      <line x1={loopX + 12} y1={tickY - 3} x2={loopX + 12} y2={tickY + 3} stroke={ACCENT} strokeWidth={1.4} strokeLinecap="round" opacity={0.3} />
      <line x1={loopX + 22} y1={tickY - 3} x2={loopX + 22} y2={tickY + 3} stroke={ACCENT} strokeWidth={1.4} strokeLinecap="round" opacity={0.3} />
      <line x1={loopX + 32} y1={tickY - 3} x2={loopX + 32} y2={tickY + 3} stroke={ACCENT} strokeWidth={1.4} strokeLinecap="round" opacity={1} />

      {/* Connecting flow line */}
      <line x1={loopX + loopW} y1={loopY + loopH / 2} x2={closureX} y2={closureH / 2 + 38} stroke={MUTED} strokeWidth={1.0} strokeDasharray="2 3" opacity={0.32} />

      {/* Closure tokens */}
      {closures.map((c, i) => (
        <g key={`closure-${i}`}>
          <rect x={closureX} y={c.y} width={closureW} height={closureH} rx={4} fill={CLOSURE_FILL} stroke={MUTED} strokeWidth={1.2} opacity={0.85} />
          <rect x={closureX} y={c.y} width={closureW} height={closureH} rx={4} fill="none" stroke={ACCENT} strokeWidth={1.4} opacity={0.45} />
          <line x1={closureX + 8} y1={c.y + 8} x2={closureX + 24} y2={c.y + 8} stroke={MUTED} strokeWidth={1.0} strokeLinecap="round" opacity={0.7} />
          <circle cx={closureX + closureW - 12} cy={c.y + closureH / 2 + c.dotOffset} r={i === 2 ? 3 : 2.6} fill={ACCENT} opacity={0.95} />
        </g>
      ))}
    </svg>
  );
}
