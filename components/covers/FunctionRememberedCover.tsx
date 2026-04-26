"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * FunctionRememberedCover — closure, v6 calibration.
 *
 * v6 concept (one sentence):
 *   The outer scope's brace-flanked outline fades to a ghost while the inner
 *   scope's solid captured-dot stays anchored, and a dashed tether quietly
 *   draws upward to a memory ring at the top — the inner remembers.
 *
 * v5 → v6 register shift:
 *  - Outer scope: solid stroke + dramatic 1→0.25 opacity / 1→0.9 scale →
 *    thinner outline, 0.45→0.18 opacity (more readable, no scale).
 *  - Memory packet (a dot travelling up the tether) → DROPPED. The tether
 *    drawing IS the gesture.
 *  - Captured-dot scale pulse → opacity-only pulse (0.7 → 1).
 *  - Brace strokes 2.4 → 1.0 muted (no shouty braces).
 *  - Anchor halo flash → DROPPED. Anchor draws as a slim ring with an 800 ms
 *    ease-in (the delight beat).
 *  - Loop period 5 s → 6 s, opacity-led, single-narrative.
 *
 * Composition (9 load-bearing elements — at v6 target):
 *  1.  Outer scope rounded-rect outline (thin, fades)
 *  2.  Outer "{" brace (muted, thin)
 *  3.  Outer "}" brace (muted, thin)
 *  4.  Inner scope rounded-rect outline (terracotta, thin)
 *  5.  Inner label stub
 *  6.  Captured-value dot (solid terracotta — the hero)
 *  7.  Tether (dashed, draws upward via strokeDashoffset / pathLength)
 *  8.  Memory anchor ring (open ring, draws via pathLength — delight beat)
 *  9.  Closure tick (small terracotta dash inside inner)
 *
 * Motion (playbook §3, §4):
 *  - 6 s continuous loop.
 *  - Outer fades 0.45 → 0.18 over the loop (gentle ease).
 *  - Tether draws 0 → 1 via pathLength (3 s phase).
 *  - Memory anchor ring draws via pathLength last, 800 ms gentle fade-in.
 *  - Captured-dot pulses opacity 0.7 → 1 → 0.7, period 2 s — independent of
 *    the outer/tether phase. Bright element is always live.
 *  - Hover amplifies via whileHover (period 6→4 s, outer min opacity 0.18→0.3).
 *
 * Frame-stability R6: only opacity / pathLength animate.
 *
 * Reduced-motion end-state: outer at 0.18 opacity (settled-faded), inner solid,
 * tether fully drawn, captured-dot full opacity, memory anchor visible,
 * brace motif visible. The metaphor reads from the still: outer dim, inner alive.
 */
export function FunctionRememberedCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Geometry.
  const innerCx = 100;
  const innerCy = 124;
  const tetherTopY = 24;
  const tetherStartY = 100;

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── Outer scope — outline + braces, fades over the loop ─── */}
      <motion.g
        initial={{ opacity: 0.45 }}
        animate={
          animate
            ? { opacity: [0.45, 0.45, 0.18, 0.18, 0.45] }
            : { opacity: 0.18 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.18, 0.55, 0.85, 1],
              }
            : undefined
        }
      >
        <rect
          x={20}
          y={36}
          width={160}
          height={140}
          rx={10}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
        />
        {/* Opening "{" brace — muted, thin */}
        <path
          d="M 38 64 Q 32 64, 32 72 L 32 100 Q 32 108, 26 108 Q 32 108, 32 116 L 32 140 Q 32 148, 38 148"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
          vectorEffect="non-scaling-stroke"
        />
        {/* Closing "}" brace */}
        <path
          d="M 162 64 Q 168 64, 168 72 L 168 100 Q 168 108, 174 108 Q 168 108, 168 116 L 168 140 Q 168 148, 162 148"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>

      {/* ─── Tether (dashed, draws upward via pathLength) ────────── */}
      <motion.line
        x1={innerCx}
        y1={tetherStartY}
        x2={innerCx}
        y2={tetherTopY + 4}
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeDasharray="3 4"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          animate
            ? {
                pathLength: [0, 0, 1, 1, 0],
                opacity: [0, 0, 0.85, 0.85, 0],
              }
            : { pathLength: 1, opacity: 0.85 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.2, 0.62, 0.94, 1],
              }
            : undefined
        }
      />

      {/* ─── Memory anchor ring (open ring, delight beat — draws last) ─ */}
      <motion.circle
        cx={innerCx}
        cy={tetherTopY}
        r={5.5}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          animate
            ? {
                pathLength: [0, 0, 1, 1, 0],
                opacity: [0, 0, 0.95, 0.95, 0],
              }
            : { pathLength: 1, opacity: 0.95 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.62, 0.78, 0.94, 1],
              }
            : undefined
        }
      />

      {/* ─── Inner scope — outline only, terracotta, thin ────────── */}
      <rect
        x={62}
        y={88}
        width={76}
        height={68}
        rx={8}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
      />
      {/* Inner label stub — single quiet line */}
      <rect x={70} y={98} width={28} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
      {/* Closure tick — small terracotta dash on right edge */}
      <rect x={120} y={98} width={6} height={2} rx={1} fill="var(--color-accent)" opacity={0.6} />

      {/* ─── Captured-value dot (the hero — solid terracotta) ───── */}
      <motion.circle
        cx={innerCx}
        cy={innerCy}
        r={6}
        fill="var(--color-accent)"
        initial={{ opacity: 1 }}
        animate={
          animate
            ? { opacity: [1, 0.7, 1] }
            : { opacity: 1 }
        }
        transition={
          animate
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />
    </motion.g>
  );
}

/**
 * FunctionRememberedCoverStatic — Satori-safe pure-JSX export of v6
 * reduced-motion end-state. Pure JSX, hex palette inline. No motion.*,
 * no hooks, no color-mix.
 *
 * End-state: outer at 0.18 opacity (settled-faded), inner solid terracotta
 * outline, tether fully drawn, captured-dot full opacity, memory anchor
 * ring fully drawn, brace motif visible.
 */
export function FunctionRememberedCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Outer scope — settled at 0.18 opacity */}
      <g opacity={0.18}>
        <rect x={20} y={36} width={160} height={140} rx={10} fill="none" stroke={MUTED} strokeWidth={1.2} />
        <path
          d="M 38 64 Q 32 64, 32 72 L 32 100 Q 32 108, 26 108 Q 32 108, 32 116 L 32 140 Q 32 148, 38 148"
          fill="none"
          stroke={ACCENT}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
        <path
          d="M 162 64 Q 168 64, 168 72 L 168 100 Q 168 108, 174 108 Q 168 108, 168 116 L 168 140 Q 168 148, 162 148"
          fill="none"
          stroke={ACCENT}
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
      </g>

      {/* Tether — fully drawn */}
      <line x1={100} y1={100} x2={100} y2={28} stroke={ACCENT} strokeWidth={1.4} strokeLinecap="round" strokeDasharray="3 4" opacity={0.85} />

      {/* Memory anchor ring */}
      <circle cx={100} cy={24} r={5.5} fill="none" stroke={ACCENT} strokeWidth={1.4} opacity={0.95} />

      {/* Inner scope */}
      <rect x={62} y={88} width={76} height={68} rx={8} fill="none" stroke={ACCENT} strokeWidth={1.4} />
      <rect x={70} y={98} width={28} height={2} rx={1} fill={MUTED} opacity={0.7} />
      <rect x={120} y={98} width={6} height={2} rx={1} fill={ACCENT} opacity={0.6} />

      {/* Captured-value dot */}
      <circle cx={100} cy={124} r={6} fill={ACCENT} />
    </svg>
  );
}
