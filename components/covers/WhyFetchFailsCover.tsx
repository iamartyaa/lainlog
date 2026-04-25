"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * WhyFetchFailsCover — fetch() request meets the CORS wall.
 *
 * v4 concept (one sentence):
 *   A terracotta comet flies right toward a thick wall, slams into it, and
 *   bounces back with echo-rings — the browser is the gatekeeper.
 *
 * Composition (~10 elements):
 *  1. Comet head (large rounded square, terracotta)
 *  2-4. 3-segment fading comet trail (3 dots)
 *  5. Thick wall (rounded-rect column, mid-cover)
 *  6. ✕ mark on the wall (CORS reject)
 *  7. Browser silhouette right of wall (frame only)
 *  8-10. 2 echo-rings emanating from impact point + impact spark
 *
 * Motion (DESIGN.md §9):
 *  - 4s loop with ~1s idle gap.
 *  - Phase 1 (0–0.40): comet glides left→wall (~52% viewBox translate).
 *  - Phase 2 (0.40–0.55): wall flexes scaleX, comet flips/fades, echo rings expand.
 *  - Phase 3 (0.55–1): comet faded; brief idle; cycle resets.
 *
 * Frame-stability R6: x / scale / opacity / r only. Tokens-only.
 *
 * Reduced-motion end-state: comet bounced back at far-left, wall solid, ✕ visible.
 */
export function WhyFetchFailsCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Wall position — load-bearing.
  const wallX = 122;
  const impactX = 116;
  const beamY = 100;

  return (
    <g>
      {/* ─── Browser silhouette (right of wall) ────────────────── */}
      <rect
        x={140}
        y={56}
        width={48}
        height={88}
        rx={5}
        fill="var(--color-surface)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        opacity={0.55}
      />
      <line
        x1={140}
        y1={68}
        x2={188}
        y2={68}
        stroke="var(--color-text-muted)"
        strokeWidth={1.2}
        opacity={0.5}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={146} cy={62} r={1.6} fill="var(--color-text-muted)" opacity={0.55} />
      <circle cx={152} cy={62} r={1.6} fill="var(--color-text-muted)" opacity={0.45} />
      <circle cx={158} cy={62} r={1.6} fill="var(--color-text-muted)" opacity={0.4} />

      {/* ─── The wall (hero gesture — thick, unmistakable) ─────── */}
      <motion.rect
        x={wallX - 4}
        y={36}
        width={8}
        height={128}
        rx={3}
        fill="var(--color-text)"
        initial={{ scaleX: 1 }}
        animate={animate ? { scaleX: [1, 1, 1.6, 1, 1] } : { scaleX: 1 }}
        transition={
          animate
            ? {
                duration: 4,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.38, 0.46, 0.6, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${wallX}px ${beamY}px`, transformBox: "fill-box" as const }}
      />

      {/* ✕ mark on the wall — accent so it reads as "rejected" */}
      <line
        x1={wallX - 6}
        y1={beamY - 6}
        x2={wallX + 6}
        y2={beamY + 6}
        stroke="var(--color-accent)"
        strokeWidth={2.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={wallX - 6}
        y1={beamY + 6}
        x2={wallX + 6}
        y2={beamY - 6}
        stroke="var(--color-accent)"
        strokeWidth={2.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Echo ring 1 (small, fast) ─────────────────────────── */}
      <motion.circle
        cx={impactX}
        cy={beamY}
        r={6}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={
          animate
            ? { opacity: [0, 0, 0.85, 0, 0], scale: [0.4, 0.4, 1, 2.4, 2.4] }
            : { opacity: 0, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 4,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.38, 0.46, 0.7, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${impactX}px ${beamY}px`, transformBox: "fill-box" as const }}
      />
      {/* ─── Echo ring 2 (larger, slower trail) ────────────────── */}
      <motion.circle
        cx={impactX}
        cy={beamY}
        r={6}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={
          animate
            ? { opacity: [0, 0, 0.6, 0, 0], scale: [0.4, 0.4, 1.4, 3.2, 3.2] }
            : { opacity: 0, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 4,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.4, 0.5, 0.78, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${impactX}px ${beamY}px`, transformBox: "fill-box" as const }}
      />

      {/* ─── Comet trail dots (3, fading behind comet) ─────────── */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={`trail-${i}`}
          cy={beamY}
          r={3 - i * 0.5}
          fill="var(--color-accent)"
          initial={{ cx: 24 - (i + 1) * 8, opacity: 0 }}
          animate={
            animate
              ? {
                  cx: [
                    24 - (i + 1) * 8,
                    impactX - 12 - (i + 1) * 8,
                    impactX - 12 - (i + 1) * 8,
                    24 - (i + 1) * 8,
                    24 - (i + 1) * 8,
                  ],
                  opacity: [
                    0,
                    0.5 - i * 0.12,
                    0,
                    0,
                    0,
                  ],
                }
              : { cx: 60, opacity: 0 }
          }
          transition={
            animate
              ? {
                  duration: 4,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.38, 0.46, 0.55, 1],
                }
              : undefined
          }
        />
      ))}

      {/* ─── Comet (the hero element — large rounded square) ───── */}
      <motion.rect
        width={16}
        height={16}
        rx={4}
        y={beamY - 8}
        fill="var(--color-accent)"
        initial={{ x: 24, opacity: 1, scale: 1 }}
        animate={
          animate
            ? {
                x: [24, impactX - 16, 60, 24, 24],
                opacity: [1, 1, 0.4, 0, 1],
                scale: [1, 1, 0.7, 0.7, 1],
              }
            : { x: 16, opacity: 1, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 4,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.4, 0.55, 0.7, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "center", transformBox: "fill-box" as const }}
      />
    </g>
  );
}
