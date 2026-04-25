"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * FunctionRememberedCover — outer scope rectangle fades while inner captured
 * value persists.
 *
 * Concept (concepts.md §4): closure metaphor — "the outer function has
 * returned but the closure remembers." The teaching frame is the moment the
 * outer scope is dim and the inner value is bright.
 *
 * Animation primitive: opacity on the outer `<rect>` only. Inner rect + dot
 * stay at full opacity. No position, no stroke, no scale — just the outer
 * scope drifting in opacity.
 *
 * Effective period 8s. Phase offset 4.2s.
 *
 * Reduced-motion + off-screen → outer at 0.3, inner at 1. That IS the
 * teaching frame: "what fades vs what stays."
 *
 * Fallback test (concepts.md §4 round-2): if the dim/bright contrast doesn't
 * read at 64px, switch to a tether design. Decision: the contrast holds —
 * outer at 0.3 with 1.5px non-scaling stroke is clearly muted; the inner
 * accent rect at full opacity reads as the persistent value. No switch.
 */
export function FunctionRememberedCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <g>
      {/* Outer scope rectangle — opacity drifts. Muted neutral stroke. */}
      <motion.rect
        x={20}
        y={22}
        width={60}
        height={56}
        rx={3}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0.3 }}
        animate={
          animate
            ? {
                // 8s loop: drift down 0–2s (1 → 0.3), hold 2–5s, drift up 5–7s, idle 7–8s.
                opacity: [1, 0.3, 0.3, 1, 1],
              }
            : { opacity: 0.3 }
        }
        transition={
          animate
            ? {
                duration: 8,
                times: [0, 0.25, 0.625, 0.875, 1],
                ease: "easeInOut",
                repeat: Infinity,
                delay: 4.2,
              }
            : undefined
        }
      />
      {/* Inner captured value — accent rect, full opacity, static. */}
      <rect
        x={42}
        y={44}
        width={16}
        height={16}
        rx={2}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      {/* Value glyph — small accent dot. r=2.5 (bumped from 2 in concept) so
          it survives the 64px thumbnail. */}
      <circle cx={50} cy={52} r={2.5} fill="var(--color-accent)" />
    </g>
  );
}
