"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * HowGmailCover — input field + caret + checkmark, with a slow pulse on the check.
 *
 * Concept (research/animated-covers/concepts.md §1): the article teaches the
 * silence-then-verdict cadence — 300 ms of nothing on the Gmail sign-up page,
 * then a checkmark or a cross. The cover IS that moment: the verdict pulse.
 *
 * Animation primitive: opacity+scale on the checkmark `<g>` only. Anchor
 * `transform-origin: 90 50` so the check scales around its own centroid;
 * frame-stability R6 holds — the wrapper SVG never resizes.
 *
 * Phase offset 0s. Effective period ~11s (active ~7s + idle ~4s).
 *
 * Reduced-motion + off-screen → check at full opacity, scale 1, no animation.
 */
export function HowGmailCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <g>
      {/* Input field outline — static, muted neutral. */}
      <rect
        x={18}
        y={42}
        width={64}
        height={16}
        rx={3}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeOpacity={0.5}
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      {/* Caret — short accent vertical inside the field. Static. */}
      <line
        x1={24}
        y1={46}
        x2={24}
        y2={54}
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Checkmark — pulses opacity + scale around its centroid (~x=90, y=50). */}
      <motion.g
        style={{ transformOrigin: "90px 50px", transformBox: "fill-box" as const }}
        initial={{ opacity: 1, scale: 1 }}
        animate={
          animate
            ? {
                // Effective 11s loop: fade-in 0–0.4, hold 0.4–6, fade-out 6–7, idle 7–11.
                opacity: [0, 0.3, 1, 1, 1, 0.3, 0, 0],
                scale: [0.9, 1, 1, 1, 1, 1, 0.9, 0.9],
              }
            : { opacity: 1, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 11,
                times: [0, 0.04, 0.18, 0.4, 0.55, 0.6, 0.64, 1],
                ease: "easeInOut",
                repeat: Infinity,
                // Phase offset for the home list — cover #1 is the leader.
                delay: 0,
              }
            : undefined
        }
      >
        <path
          d="M 84 50 L 88 54 L 96 46"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>
    </g>
  );
}
