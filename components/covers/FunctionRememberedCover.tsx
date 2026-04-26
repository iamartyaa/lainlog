"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * FunctionRememberedCover — closure: the inner thing remembers what the outer thing forgot.
 *
 * One sentence:
 *   The outer scope fades to a ghost while the inner scope's captured value
 *   pulses persistently and a memory packet travels up the tether to the
 *   anchor — proof that the inner remembers.
 *
 * Composition (~13 load-bearing elements):
 *  1.  Outer scope rounded-rect (large, fades dramatically)
 *  2.  Outer "{" brace glyph (function-ness, fades with outer)
 *  3.  Outer "}" brace glyph (mirrors)
 *  4.  Inner scope rounded-rect (medium, stays solid)
 *  5.  Inner label stub 1 ("function" hint)
 *  6.  Inner label stub 2 ("name" hint)
 *  7.  Captured value pulse ring (terracotta, pulses throughout)
 *  8.  Captured value dot (the persistent bright element — never dim)
 *  9.  Tether line (dashed accent, drawn upward through outer)
 *  10. Memory packet (small terracotta dot travelling up the tether)
 *  11. Memory anchor dot at top of tether (lights when packet arrives)
 *  12. Anchor halo (small ring that flashes on arrival)
 *  13. Inner-scope decorative tick (small dash on the right edge — closure marker)
 *
 * Motion (playbook §3, §4):
 *  - 5s continuous loop, no idle gap > 600ms.
 *  - Captured-dot pulse runs continuously at 1.6s period — independent of the
 *    outer-scope phase. Bright element is always live.
 *  - Phase A (0–0.30): everything solid.
 *  - Phase B (0.30–0.60): outer fades 1 → 0.25, scales 1 → 0.9 (deeper than v4).
 *    Tether pathLength draws 0 → 1. Memory packet starts travelling up.
 *  - Phase C (0.60–0.78): packet arrives at anchor, anchor halo flashes,
 *    anchor scales 1 → 1.5 → 1.
 *  - Phase D (0.78–1): packet fades, outer fades back in for next cycle.
 *  - Hover amplifies via whileHover on the wrapping motion.g.
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: outer at 0.25 / 0.9 scale, tether fully drawn,
 * captured dot bright, packet at top of tether, anchor visible. The metaphor
 * reads from the still: outer dim, inner alive, tether complete.
 */
export function FunctionRememberedCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Geometry.
  const innerCx = 100;
  const innerCy = 124;
  const tetherTopY = 18;
  const tetherStartY = 96;

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── Outer scope (the dying scope) ──────────────────────── */}
      <motion.g
        initial={{ opacity: 1, scale: 1 }}
        animate={
          animate
            ? { opacity: [1, 1, 0.25, 0.25, 1], scale: [1, 1, 0.9, 0.9, 1] }
            : { opacity: 0.25, scale: 0.9 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.3, 0.55, 0.78, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "100px 100px", transformBox: "fill-box" as const }}
      >
        <rect
          x={20}
          y={32}
          width={160}
          height={140}
          rx={12}
          fill="none"
          stroke="var(--color-text)"
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
        {/* Opening "{" brace — clearly reads as function */}
        <path
          d="M 38 60 Q 30 60, 30 70 L 30 96 Q 30 104, 22 104 Q 30 104, 30 112 L 30 138 Q 30 148, 38 148"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Closing "}" brace */}
        <path
          d="M 162 60 Q 170 60, 170 70 L 170 96 Q 170 104, 178 104 Q 170 104, 170 112 L 170 138 Q 170 148, 162 148"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>

      {/* ─── Tether line (drawn upward from inner to anchor) ────── */}
      <motion.line
        x1={innerCx}
        y1={tetherStartY}
        x2={innerCx}
        y2={tetherTopY + 4}
        stroke="var(--color-accent)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray="3 4"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0.3 }}
        animate={
          animate
            ? {
                pathLength: [0, 0, 1, 1, 0],
                opacity: [0.3, 0.3, 0.95, 0.95, 0.3],
              }
            : { pathLength: 1, opacity: 0.9 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.3, 0.55, 0.78, 1],
              }
            : undefined
        }
      />

      {/* ─── Memory packet (travels up the tether) ─────────────── */}
      <motion.circle
        cx={innerCx}
        r={2.6}
        fill="var(--color-accent)"
        initial={{ cy: tetherStartY, opacity: 0 }}
        animate={
          animate
            ? {
                cy: [tetherStartY, tetherStartY, tetherTopY + 4, tetherTopY + 4, tetherStartY],
                opacity: [0, 0, 1, 1, 0],
              }
            : { cy: tetherTopY + 4, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.36, 0.62, 0.74, 0.92],
              }
            : undefined
        }
      />

      {/* ─── Anchor halo (flashes when packet arrives) ─────────── */}
      <motion.circle
        cx={innerCx}
        cy={tetherTopY}
        r={8}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.8}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={
          animate
            ? { opacity: [0, 0, 0.85, 0, 0], scale: [0.4, 0.4, 1.5, 2.4, 2.4] }
            : { opacity: 0.5, scale: 1.4 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.6, 0.68, 0.84, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${innerCx}px ${tetherTopY}px`, transformBox: "fill-box" as const }}
      />

      {/* ─── Memory anchor dot (top of tether) ─────────────────── */}
      <motion.circle
        cx={innerCx}
        cy={tetherTopY}
        r={4}
        fill="var(--color-accent)"
        initial={{ opacity: 0.4, scale: 1 }}
        animate={
          animate
            ? {
                opacity: [0.35, 0.35, 1, 1, 0.35],
                scale: [1, 1, 1.5, 1, 1],
              }
            : { opacity: 1, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.55, 0.66, 0.78, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${innerCx}px ${tetherTopY}px`, transformBox: "fill-box" as const }}
      />

      {/* ─── Inner scope (the surviving scope — bright, solid) ─── */}
      <rect
        x={62}
        y={84}
        width={76}
        height={72}
        rx={9}
        fill="var(--color-surface)"
        stroke="var(--color-text)"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
      {/* Inner label stubs — small "function name" hint */}
      <rect x={70} y={94} width={12} height={2.4} rx={1.2} fill="var(--color-text-muted)" opacity={0.8} />
      <rect x={86} y={94} width={22} height={2.4} rx={1.2} fill="var(--color-text-muted)" opacity={0.8} />
      {/* Closure marker — small dash right side */}
      <rect x={124} y={94} width={6} height={2.4} rx={1.2} fill="var(--color-accent)" opacity={0.7} />

      {/* ─── Captured value pulse ring (continuous, persistent) ── */}
      <motion.circle
        cx={innerCx}
        cy={innerCy}
        r={11}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0.5, scale: 1 }}
        animate={
          animate
            ? { opacity: [0.4, 0.85, 0.4], scale: [1, 1.3, 1] }
            : { opacity: 0.6, scale: 1.15 }
        }
        transition={
          animate
            ? { duration: 1.6, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }
            : undefined
        }
        style={{ transformOrigin: `${innerCx}px ${innerCy}px`, transformBox: "fill-box" as const }}
      />

      {/* Captured value dot (the persistent bright element) */}
      <motion.circle
        cx={innerCx}
        cy={innerCy}
        r={6.5}
        fill="var(--color-accent)"
        initial={{ scale: 1 }}
        animate={
          animate
            ? { scale: [1, 1.15, 1] }
            : { scale: 1 }
        }
        transition={
          animate
            ? { duration: 1.6, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }
            : undefined
        }
        style={{ transformOrigin: `${innerCx}px ${innerCy}px`, transformBox: "fill-box" as const }}
      />
    </motion.g>
  );
}

/**
 * FunctionRememberedCoverStatic — Satori-safe pure-JSX export.
 * Reduced-motion end-state: outer scope at 0.3 opacity (faded), inner scope
 * solid, tether fully drawn from captured value upward.
 */
export function FunctionRememberedCoverStatic() {
  const ACCENT = "#d97341";
  const TEXT = "#f8f5f0";
  const MUTED = "#7a7570";
  const SURFACE = "#1a1714";

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Outer scope — faded (the dying scope) */}
      <g opacity={0.3} transform="translate(8 8) scale(0.92)">
        <rect x={20} y={28} width={160} height={144} rx={10} fill="none" stroke={TEXT} strokeWidth={3} />
        <path
          d="M 36 56 Q 30 56, 30 64 L 30 96 Q 30 104, 24 104 Q 30 104, 30 112 L 30 144 Q 30 152, 36 152"
          fill="none"
          stroke={MUTED}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 164 56 Q 170 56, 170 64 L 170 96 Q 170 104, 176 104 Q 170 104, 170 112 L 170 144 Q 170 152, 164 152"
          fill="none"
          stroke={MUTED}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Tether line — fully drawn */}
      <line x1={100} y1={92} x2={100} y2={20} stroke={ACCENT} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="3 4" opacity={0.85} />

      {/* Memory anchor */}
      <circle cx={100} cy={20} r={3.5} fill={ACCENT} opacity={0.95} />

      {/* Inner scope — bright, solid */}
      <rect x={62} y={84} width={76} height={68} rx={8} fill={SURFACE} stroke={TEXT} strokeWidth={3} />
      <rect x={70} y={94} width={12} height={2.4} rx={1.2} fill={MUTED} opacity={0.75} />
      <rect x={86} y={94} width={20} height={2.4} rx={1.2} fill={MUTED} opacity={0.75} />

      {/* Captured value pulse ring */}
      <circle cx={100} cy={124} r={12} fill="none" stroke={ACCENT} strokeWidth={2} opacity={0.6} />

      {/* Captured value dot */}
      <circle cx={100} cy={124} r={6} fill={ACCENT} />
    </svg>
  );
}
