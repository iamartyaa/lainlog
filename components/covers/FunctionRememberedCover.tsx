"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * FunctionRememberedCover — closure: the inner thing survives the outer thing dying.
 *
 * v4 concept (one sentence):
 *   Two nested rounded-rect scope frames; the outer frame fades and contracts
 *   while the inner frame stays bright and a tether draws upward from its
 *   captured value, conveying "the inner remembers."
 *
 * Composition (~10 elements):
 *  1. Outer scope rounded-rect (large, fades)
 *  2. Outer brace glyph "{" (suggests function-ness)
 *  3. Outer brace glyph "}" (closing)
 *  4. Inner scope rounded-rect (medium, stays solid)
 *  5. Inner label dash (tiny stub for "function")
 *  6. Captured value dot (terracotta, inside inner)
 *  7. Captured value pulse ring
 *  8. Tether line (dashed, from captured value upward — closure reference)
 *  9. Memory anchor dot at top of tether
 *  10. Tether glow stroke (slightly thicker companion)
 *
 * Motion (DESIGN.md §9):
 *  - 5s loop. Phase 1 (0–0.30): everything solid, captured dot pulses gently.
 *  - Phase 2 (0.30–0.65): outer scope opacity fades to 0.25, scales to 0.92,
 *    while inner scope stays at full opacity. Tether pathLength draws 0→1.
 *  - Phase 3 (0.65–1): outer fades back in; loop resets.
 *
 * Frame-stability R6: opacity / scale / pathLength only. Tokens-only.
 *
 * Reduced-motion end-state: outer at 0.3 opacity, inner solid, tether fully drawn.
 */
export function FunctionRememberedCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <g>
      {/* ─── Outer scope (the dying scope) ──────────────────────── */}
      <motion.g
        initial={{ opacity: 1, scale: 1 }}
        animate={
          animate
            ? { opacity: [1, 1, 0.25, 0.25, 1], scale: [1, 1, 0.92, 0.92, 1] }
            : { opacity: 0.3, scale: 0.95 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.3, 0.55, 0.75, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "100px 100px", transformBox: "fill-box" as const }}
      >
        <rect
          x={20}
          y={28}
          width={160}
          height={144}
          rx={10}
          fill="none"
          stroke="var(--color-text)"
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
        {/* Outer brace glyph — opening "{" hint */}
        <path
          d="M 36 56 Q 30 56, 30 64 L 30 96 Q 30 104, 24 104 Q 30 104, 30 112 L 30 144 Q 30 152, 36 152"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Outer brace glyph — closing "}" hint */}
        <path
          d="M 164 56 Q 170 56, 170 64 L 170 96 Q 170 104, 176 104 Q 170 104, 170 112 L 170 144 Q 170 152, 164 152"
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>

      {/* ─── Tether line (drawn from inner upward through outer) ── */}
      <motion.line
        x1={100}
        y1={92}
        x2={100}
        y2={20}
        stroke="var(--color-accent)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeDasharray="3 4"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={
          animate
            ? {
                pathLength: [0, 0, 1, 1, 0],
                opacity: [0.3, 0.3, 0.95, 0.95, 0.3],
              }
            : { pathLength: 1, opacity: 0.85 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.3, 0.5, 0.75, 1],
              }
            : undefined
        }
      />

      {/* Memory anchor dot at the top of the tether */}
      <motion.circle
        cx={100}
        cy={20}
        r={3.5}
        fill="var(--color-accent)"
        initial={{ opacity: 0.4 }}
        animate={
          animate
            ? { opacity: [0.3, 0.3, 1, 1, 0.3] }
            : { opacity: 0.85 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.3, 0.55, 0.75, 1],
              }
            : undefined
        }
      />

      {/* ─── Inner scope (the surviving scope — bright, solid) ─── */}
      <rect
        x={62}
        y={84}
        width={76}
        height={68}
        rx={8}
        fill="var(--color-surface)"
        stroke="var(--color-text)"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
      {/* Inner label stubs — small "function" hint */}
      <rect x={70} y={94} width={12} height={2.4} rx={1.2} fill="var(--color-text-muted)" opacity={0.75} />
      <rect x={86} y={94} width={20} height={2.4} rx={1.2} fill="var(--color-text-muted)" opacity={0.75} />

      {/* ─── Captured value pulse ring (the "remembered thing") ── */}
      <motion.circle
        cx={100}
        cy={124}
        r={11}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0.5, scale: 1 }}
        animate={
          animate
            ? { opacity: [0.4, 0.8, 0.4], scale: [1, 1.25, 1] }
            : { opacity: 0.6, scale: 1.1 }
        }
        transition={
          animate
            ? { duration: 1.8, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }
            : undefined
        }
        style={{ transformOrigin: "100px 124px", transformBox: "fill-box" as const }}
      />

      {/* Captured value dot (the load-bearing terracotta) */}
      <circle cx={100} cy={124} r={6} fill="var(--color-accent)" />
    </g>
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
