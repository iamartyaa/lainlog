"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * WhyFetchFailsCover — fetch() comet meets the CORS wall.
 *
 * One sentence:
 *   A terracotta comet streaks across the page, slams into a thick CORS wall
 *   labelled `ACAO`, the wall flexes outward, and three echo-rings emanate
 *   from the impact point as the comet rebounds dim.
 *
 * Composition (~13 load-bearing elements):
 *  1.  Browser silhouette (rounded-rect with chrome bar + 3 dots, right of wall)
 *  2.  Wall column (thicker rounded-rect, the load-bearing barrier)
 *  3.  ACAO label glyph (3 small terracotta tick-marks, on the wall)
 *  4.  ✕ reject mark on the wall
 *  5-8. 4-segment comet trail (head + 3 fading dots)
 *  9.  Comet head (rounded square, terracotta hero)
 *  10. Impact spark (small terracotta starburst at the moment of contact)
 *  11. Echo ring 1 (small, fastest)
 *  12. Echo ring 2 (mid)
 *  13. Echo ring 3 (large, slowest)
 *
 * Motion (playbook §3, §4):
 *  - 5s continuous loop, no idle gap > 600ms.
 *  - Phase A (0–0.42): comet glides left→wall, ~95 viewBox-units of translateX
 *    (47% of viewBox — well above the §3 threshold). Trail dots follow with
 *    offsets so velocity is felt.
 *  - Phase B (0.42–0.55): wall flexes scaleX 1 → 1.7 → 1 — committed flex.
 *    Impact spark scales 0 → 1.4 → 0. Echo rings emanate (scale 0.4 → 3.6,
 *    pathLength full, opacity gates).
 *  - Phase C (0.55–0.78): comet retreats dim (opacity 0.35), trail follows.
 *  - Phase D (0.78–1): brief reset, no idle > 0.4s.
 *  - Hover amplifies idle motion via whileHover on the wrapping motion.g.
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: comet at impact, 3 rings frozen mid-expansion,
 * wall flexed (scaleX 1.4), spark visible. The static frame conveys "rejected."
 */
export function WhyFetchFailsCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Geometry — wall sits ~62% across the viewBox.
  const wallX = 124;
  const wallTop = 36;
  const wallH = 128;
  const wallW = 12;
  const impactX = wallX - wallW / 2;
  const beamY = 100;

  // Comet travel path — from far-left (x=18) to just before wall (impactX - 16).
  const cometStart = 18;
  const cometImpact = impactX - 16;
  const cometRetreat = 36;

  // Hover variants: amplify the wall flex and ring scale.
  const groupVariants = {
    idle: {},
    hover: {},
  };

  return (
    <motion.g
      initial="idle"
      whileHover="hover"
      variants={groupVariants}
    >
      {/* ─── Browser silhouette (right of wall, static muted) ────── */}
      <g opacity={0.55}>
        <rect
          x={140}
          y={48}
          width={50}
          height={104}
          rx={6}
          fill="var(--color-surface)"
          stroke="var(--color-text-muted)"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        {/* Chrome bar */}
        <line
          x1={140}
          y1={62}
          x2={190}
          y2={62}
          stroke="var(--color-text-muted)"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
        {/* 3 chrome dots */}
        <circle cx={146} cy={55} r={1.6} fill="var(--color-text-muted)" />
        <circle cx={152} cy={55} r={1.6} fill="var(--color-text-muted)" opacity={0.8} />
        <circle cx={158} cy={55} r={1.6} fill="var(--color-text-muted)" opacity={0.65} />
        {/* Address-bar stub */}
        <rect
          x={146}
          y={72}
          width={38}
          height={3.2}
          rx={1.6}
          fill="var(--color-text-muted)"
          opacity={0.5}
        />
        {/* Page-content stubs */}
        <rect x={146} y={86} width={32} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.45} />
        <rect x={146} y={94} width={26} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.4} />
        <rect x={146} y={102} width={34} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.4} />
      </g>

      {/* ─── The wall (hero gesture — thick, flexes hard on impact) ─ */}
      <motion.g
        variants={{
          idle: { scaleX: [1, 1, 1.7, 1, 1] },
          hover: { scaleX: [1, 1, 2, 1, 1] },
        }}
        animate={animate ? "idle" : undefined}
        initial={false}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.4, 0.48, 0.62, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${wallX}px ${beamY}px`, transformBox: "fill-box" as const }}
      >
        {/* Wall body — terracotta-edged */}
        <rect
          x={wallX - wallW / 2}
          y={wallTop}
          width={wallW}
          height={wallH}
          rx={4}
          fill="var(--color-text)"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
        {/* ACAO label — three small terracotta marks, top of wall */}
        <line x1={wallX - 3} y1={48} x2={wallX + 3} y2={48} stroke="var(--color-accent)" strokeWidth={1.4} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={wallX - 3} y1={54} x2={wallX + 3} y2={54} stroke="var(--color-accent)" strokeWidth={1.4} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.75} />
        <line x1={wallX - 3} y1={60} x2={wallX + 3} y2={60} stroke="var(--color-accent)" strokeWidth={1.4} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.5} />

        {/* ✕ reject mark — center of wall */}
        <line x1={wallX - 6} y1={beamY - 6} x2={wallX + 6} y2={beamY + 6} stroke="var(--color-accent)" strokeWidth={2.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={wallX - 6} y1={beamY + 6} x2={wallX + 6} y2={beamY - 6} stroke="var(--color-accent)" strokeWidth={2.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Bottom dashes — bricks */}
        <line x1={wallX - 3} y1={140} x2={wallX + 3} y2={140} stroke="var(--color-accent)" strokeWidth={1.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.5} />
        <line x1={wallX - 3} y1={148} x2={wallX + 3} y2={148} stroke="var(--color-accent)" strokeWidth={1.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.4} />
      </motion.g>

      {/* ─── Echo ring 1 (small, fastest) ──────────────────────── */}
      <motion.circle
        cx={impactX}
        cy={beamY}
        r={6}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2.2}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={
          animate
            ? { opacity: [0, 0, 1, 0, 0], scale: [0.4, 0.4, 1.1, 2.4, 2.4] }
            : { opacity: 0.7, scale: 1.6 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.42, 0.5, 0.72, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${impactX}px ${beamY}px`, transformBox: "fill-box" as const }}
      />
      {/* ─── Echo ring 2 (mid) ─────────────────────────────────── */}
      <motion.circle
        cx={impactX}
        cy={beamY}
        r={6}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.8}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={
          animate
            ? { opacity: [0, 0, 0.85, 0, 0], scale: [0.4, 0.4, 1.6, 3, 3] }
            : { opacity: 0.5, scale: 2.2 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.44, 0.54, 0.78, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${impactX}px ${beamY}px`, transformBox: "fill-box" as const }}
      />
      {/* ─── Echo ring 3 (large, slowest) ──────────────────────── */}
      <motion.circle
        cx={impactX}
        cy={beamY}
        r={6}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={
          animate
            ? { opacity: [0, 0, 0.6, 0, 0], scale: [0.4, 0.4, 2.2, 3.6, 3.6] }
            : { opacity: 0.35, scale: 2.8 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.46, 0.6, 0.84, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${impactX}px ${beamY}px`, transformBox: "fill-box" as const }}
      />

      {/* ─── Impact spark (small starburst at moment of contact) ─── */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={
          animate
            ? { opacity: [0, 0, 1, 0, 0], scale: [0, 0, 1.4, 0, 0] }
            : { opacity: 1, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.4, 0.46, 0.56, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${impactX}px ${beamY}px`, transformBox: "fill-box" as const }}
      >
        <line x1={impactX - 8} y1={beamY} x2={impactX - 4} y2={beamY} stroke="var(--color-accent)" strokeWidth={2.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={impactX} y1={beamY - 8} x2={impactX} y2={beamY - 4} stroke="var(--color-accent)" strokeWidth={2.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={impactX} y1={beamY + 4} x2={impactX} y2={beamY + 8} stroke="var(--color-accent)" strokeWidth={2.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={impactX - 6} y1={beamY - 6} x2={impactX - 3} y2={beamY - 3} stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={impactX - 6} y1={beamY + 6} x2={impactX - 3} y2={beamY + 3} stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </motion.g>

      {/* ─── Comet trail (3 fading dots behind the head) ────────── */}
      {[0, 1, 2].map((i) => {
        const offset = (i + 1) * 8;
        return (
          <motion.circle
            key={`trail-${i}`}
            cy={beamY}
            r={3.2 - i * 0.6}
            fill="var(--color-accent)"
            initial={{ cx: cometStart - offset, opacity: 0 }}
            animate={
              animate
                ? {
                    cx: [
                      cometStart - offset,
                      cometImpact - offset,
                      cometImpact - offset,
                      cometRetreat - offset,
                      cometRetreat - offset,
                    ],
                    opacity: [
                      0,
                      0.65 - i * 0.15,
                      0.65 - i * 0.15,
                      0.2 - i * 0.05,
                      0,
                    ],
                  }
                : { cx: cometImpact - offset, opacity: 0.65 - i * 0.15 }
            }
            transition={
              animate
                ? {
                    duration: 5,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.2, 1],
                    times: [0, 0.4, 0.5, 0.7, 1],
                  }
                : undefined
            }
          />
        );
      })}

      {/* ─── Comet head (the hero element) ─────────────────────── */}
      <motion.rect
        width={18}
        height={18}
        rx={4.5}
        y={beamY - 9}
        fill="var(--color-accent)"
        initial={{ x: cometStart, opacity: 1, scale: 1 }}
        animate={
          animate
            ? {
                x: [cometStart, cometImpact, cometImpact, cometRetreat, cometStart, cometStart],
                opacity: [1, 1, 1, 0.4, 0, 1],
                scale: [1, 1, 1.1, 0.7, 0.7, 1],
              }
            : { x: cometImpact, opacity: 1, scale: 1.1 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.42, 0.5, 0.7, 0.85, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "center", transformBox: "fill-box" as const }}
      />
    </motion.g>
  );
}
