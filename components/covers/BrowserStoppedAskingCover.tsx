"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * BrowserStoppedAskingCover — long horizontal line + three dots breathing
 * sequentially.
 *
 * Concept (concepts.md §3): long-polling / SSE / WebSockets — connections
 * that *stay open* instead of asking-and-closing. The line is the request
 * that doesn't close; the dots are "the request is still active." Both are
 * accent-coloured because the metaphor is one-party (one held connection).
 *
 * Animation primitive: opacity on the three dots, staggered. The line is
 * static — animating it would violate the one-primitive rule.
 *
 * Effective period 6s. Phase offset 2.8s.
 *
 * Reduced-motion + off-screen → line at opacity 1, all three dots at 0.6
 * (the mid-breath baseline that reads as "active but not blinking").
 */
export function BrowserStoppedAskingCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Dot radius bumped to 2.5 (concept allowed 2 with bump-if-needed) so the
  // dots survive the 64px thumbnail downscale where they'd otherwise approach
  // single-pixel collapse.
  const dotR = 2.5;

  // Staggered delays within the 6s loop. Phase offset is added on top.
  const dotDelays = [0, 0.4, 0.8];

  return (
    <g>
      {/* Long horizontal line — the unclosed request. Static, accent. */}
      <line
        x1={12}
        y1={50}
        x2={88}
        y2={50}
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {/* Three dots breathing in stagger. */}
      {[70, 76, 82].map((cx, i) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={50}
          r={dotR}
          fill="var(--color-accent)"
          initial={{ opacity: 0.6 }}
          animate={
            animate
              ? { opacity: [0.3, 1, 0.3, 0.3] }
              : { opacity: 0.6 }
          }
          transition={
            animate
              ? {
                  duration: 6,
                  // Active 0–1.6s (the breath), idle 1.6–6s. Times below
                  // map [start, peak, end-of-breath, idle-end] to [0, 0.13, 0.27, 1].
                  times: [0, 0.13, 0.27, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                  delay: 2.8 + dotDelays[i],
                }
              : undefined
          }
        />
      ))}
    </g>
  );
}
