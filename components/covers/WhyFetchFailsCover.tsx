"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * WhyFetchFailsCover — comet hits the CORS wall, v6 calibration.
 *
 * v6 concept (one sentence):
 *   A single thin comet glides toward a slim CORS wall, fades to dim on
 *   impact and reverses direction; one elegant ring draws as it rebounds.
 *
 * v5 → v6 register shift:
 *  - Browser silhouette → DROPPED. The wall + comet + ring carry the metaphor.
 *  - Comet rounded-square + 4-segment trail → thin curved comet body with
 *    2-segment trail (opacity-only).
 *  - Wall flex (scaleX 1 → 1.7 → 1) → DROPPED. Comet itself fades + reverses.
 *  - 3 echo rings → 1 elegant ring (drawn via pathLength on rebound).
 *  - Impact spark starburst → DROPPED.
 *  - Loop period 5 s, snappy → 6 s, opacity-led.
 *  - Stroke widths 1.4–2.6 → 1.0–1.8.
 *
 * Composition (8 load-bearing elements — at v6 target):
 *  1.  Wall column (thin rounded-rect outline, terracotta border, no fill)
 *  2.  ACAO label (3 small muted tick-marks, top of wall)
 *  3.  ✕ reject mark on wall center
 *  4.  Comet trail segment 1 (small fading dot, opacity-only)
 *  5.  Comet trail segment 2 (smaller fading dot, opacity-only)
 *  6.  Comet head (small terracotta dot — translates across)
 *  7.  Echo ring (single ring, drawn via pathLength on rebound)
 *  8.  Comet head opacity-flicker on rebound (delight beat — same element)
 *
 * Motion (playbook §3, §4):
 *  - 6 s continuous loop.
 *  - Phase A (0–42%): comet glides cometStart → cometImpact (~80 viewBox-units
 *    of translate, 40% of viewBox — well above the §3 threshold).
 *  - Phase B (42–58%): comet at impact, trail compresses (slides forward and
 *    stacks briefly via opacity), then comet fades to opacity 0.4 and reverses
 *    direction.
 *  - Phase C (58–94%): echo ring draws via pathLength as comet rebounds.
 *    Comet head flickers (opacity 1 → 0.4 → 0.7) — delight beat.
 *  - Phase D (94–100%): brief reset.
 *  - Hover amplifies via whileHover (period 6→4 s).
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: comet at impact position (dim) with 2-segment
 * trail at decreasing opacity, wall fully drawn with ACAO label, echo ring
 * fully drawn — the post-impact "settled" frame.
 */
export function WhyFetchFailsCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Geometry — wall at ~62% across.
  const wallX = 134;
  const wallTop = 46;
  const wallH = 108;
  const wallW = 8;
  const impactX = wallX - wallW / 2;
  const beamY = 100;

  const cometStart = 22;
  const cometImpact = impactX - 12;

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── CORS wall — thin outlined rounded-rect, no fill ────── */}
      <rect
        x={wallX - wallW / 2}
        y={wallTop}
        width={wallW}
        height={wallH}
        rx={3}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
      />
      {/* ACAO label — three small muted tick-marks, top of wall */}
      <line x1={wallX - 2.5} y1={56} x2={wallX + 2.5} y2={56} stroke="var(--color-text-muted)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={wallX - 2.5} y1={62} x2={wallX + 2.5} y2={62} stroke="var(--color-text-muted)" strokeWidth={1} strokeLinecap="round" opacity={0.75} vectorEffect="non-scaling-stroke" />
      <line x1={wallX - 2.5} y1={68} x2={wallX + 2.5} y2={68} stroke="var(--color-text-muted)" strokeWidth={1} strokeLinecap="round" opacity={0.5} vectorEffect="non-scaling-stroke" />

      {/* ✕ reject mark — center of wall */}
      <line x1={wallX - 5} y1={beamY - 5} x2={wallX + 5} y2={beamY + 5} stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={wallX - 5} y1={beamY + 5} x2={wallX + 5} y2={beamY - 5} stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />

      {/* ─── Echo ring (single, draws via pathLength on rebound) ── */}
      <motion.circle
        cx={impactX}
        cy={beamY}
        r={14}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          animate
            ? {
                pathLength: [0, 0, 1, 1, 0],
                opacity: [0, 0, 0.7, 0.7, 0],
              }
            : { pathLength: 1, opacity: 0.7 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.58, 0.78, 0.94, 1],
              }
            : undefined
        }
      />

      {/* ─── Comet trail segment 1 (closest to head) ────────────── */}
      <motion.circle
        cy={beamY}
        r={2.2}
        fill="var(--color-accent)"
        initial={{ cx: cometStart - 8, opacity: 0 }}
        animate={
          animate
            ? {
                cx: [
                  cometStart - 8,
                  cometImpact - 8,
                  cometImpact - 4,
                  cometStart - 8,
                  cometStart - 8,
                ],
                opacity: [0, 0.55, 0.7, 0, 0],
              }
            : { cx: cometImpact - 8, opacity: 0.55 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.42, 0.5, 0.7, 1],
              }
            : undefined
        }
      />

      {/* ─── Comet trail segment 2 (further from head) ──────────── */}
      <motion.circle
        cy={beamY}
        r={1.6}
        fill="var(--color-accent)"
        initial={{ cx: cometStart - 16, opacity: 0 }}
        animate={
          animate
            ? {
                cx: [
                  cometStart - 16,
                  cometImpact - 16,
                  cometImpact - 8,
                  cometStart - 16,
                  cometStart - 16,
                ],
                opacity: [0, 0.35, 0.5, 0, 0],
              }
            : { cx: cometImpact - 16, opacity: 0.35 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.42, 0.5, 0.7, 1],
              }
            : undefined
        }
      />

      {/* ─── Comet head (the hero — thin, opacity flickers on rebound) ─ */}
      <motion.circle
        cy={beamY}
        r={3.2}
        fill="var(--color-accent)"
        initial={{ cx: cometStart, opacity: 1 }}
        animate={
          animate
            ? {
                cx: [cometStart, cometImpact, cometImpact, cometStart, cometStart, cometStart],
                opacity: [1, 1, 0.4, 0.7, 0, 1],
              }
            : { cx: cometImpact, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.42, 0.55, 0.85, 0.94, 1],
              }
            : undefined
        }
      />
    </motion.g>
  );
}

/**
 * WhyFetchFailsCoverStatic — Satori-safe pure-JSX export of v6 reduced-motion
 * end-state. Pure JSX, hex palette inline. No motion.*, no hooks, no color-mix.
 *
 * End-state: comet at impact position with 2-segment trail at decreasing
 * opacity, wall fully drawn with ACAO label, echo ring fully drawn — the
 * post-impact "settled" frame.
 */
export function WhyFetchFailsCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";

  const wallX = 134;
  const wallW = 8;
  const impactX = wallX - wallW / 2;
  const beamY = 100;
  const cometImpact = impactX - 12;

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* CORS wall */}
      <rect x={wallX - wallW / 2} y={46} width={wallW} height={108} rx={3} fill="none" stroke={ACCENT} strokeWidth={1.4} />

      {/* ACAO label */}
      <line x1={wallX - 2.5} y1={56} x2={wallX + 2.5} y2={56} stroke={MUTED} strokeWidth={1} strokeLinecap="round" />
      <line x1={wallX - 2.5} y1={62} x2={wallX + 2.5} y2={62} stroke={MUTED} strokeWidth={1} strokeLinecap="round" opacity={0.75} />
      <line x1={wallX - 2.5} y1={68} x2={wallX + 2.5} y2={68} stroke={MUTED} strokeWidth={1} strokeLinecap="round" opacity={0.5} />

      {/* ✕ reject mark */}
      <line x1={wallX - 5} y1={beamY - 5} x2={wallX + 5} y2={beamY + 5} stroke={ACCENT} strokeWidth={1.6} strokeLinecap="round" />
      <line x1={wallX - 5} y1={beamY + 5} x2={wallX + 5} y2={beamY - 5} stroke={ACCENT} strokeWidth={1.6} strokeLinecap="round" />

      {/* Echo ring — fully drawn */}
      <circle cx={impactX} cy={beamY} r={14} fill="none" stroke={ACCENT} strokeWidth={1.2} opacity={0.7} />

      {/* Comet head at impact (dim) */}
      <circle cx={cometImpact} cy={beamY} r={3.2} fill={ACCENT} opacity={0.4} />

      {/* Trail — segment 1 (closer, brighter) */}
      <circle cx={cometImpact - 4} cy={beamY} r={2.2} fill={ACCENT} opacity={0.7} />
      {/* Trail — segment 2 (further, dimmer) */}
      <circle cx={cometImpact - 8} cy={beamY} r={1.6} fill={ACCENT} opacity={0.5} />
    </svg>
  );
}
