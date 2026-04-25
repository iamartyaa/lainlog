"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * WhyFetchFailsCover — arrow advances toward a wall, holds at the boundary,
 * fades to nothing.
 *
 * Concept (concepts.md §2): a request that makes it all the way over and gets
 * bounced at the wall on the way back. The wall is the same-origin policy.
 * The arrow's job is to ARRIVE — and then disappear — without the wall ever
 * moving.
 *
 * Animation primitive: a single `pathLength` + `opacity` track on the arrow
 * group. The arrow draws (0 → 1), holds at the wall, then fades. Wall and
 * head are within the same group so they share the one timeline (head opacity
 * is gated by pathLength via a paired keyframe — still one primitive).
 *
 * Effective period 8s. Phase offset 1.4s (cover #2 in the home-list cascade).
 *
 * Reduced-motion + off-screen → arrow fully drawn AT the wall, opacity 1.
 * That is the TEACHING frame: "the response was in its hands and the browser
 * threw it away" — the moment of arrival before rejection.
 */
export function WhyFetchFailsCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <g>
      {/* Wall — same-origin policy. Static muted vertical line at x=78. */}
      <line
        x1={78}
        y1={24}
        x2={78}
        y2={76}
        stroke="var(--color-text-muted)"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />

      {/* Arrow group — line + chevron head animate together as one unit. */}
      <motion.g
        initial={{ opacity: 1 }}
        animate={
          animate
            ? {
                // 8s loop: draw 0–2.5s (pathLength), hold 2.5–4.5s, fade 4.5–5.5s, idle 5.5–8s.
                opacity: [1, 1, 1, 0, 0, 1],
              }
            : { opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 8,
                times: [0, 0.31, 0.56, 0.69, 0.95, 1],
                ease: "easeInOut",
                repeat: Infinity,
                delay: 1.4,
              }
            : undefined
        }
      >
        {/* Shaft — pathLength tween draws it from x=14 toward the wall (head sits 8 short). */}
        <motion.line
          x1={14}
          y1={50}
          x2={70}
          y2={50}
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 1 }}
          animate={
            animate
              ? { pathLength: [0, 1, 1, 1, 1, 0] }
              : { pathLength: 1 }
          }
          transition={
            animate
              ? {
                  duration: 8,
                  times: [0, 0.31, 0.56, 0.69, 0.7, 1],
                  ease: "easeOut",
                  repeat: Infinity,
                  delay: 1.4,
                }
              : undefined
          }
        />
        {/* Chevron head — appears once shaft has drawn (opacity tied to draw progress). */}
        <motion.path
          d="M 64 46 L 70 50 L 64 54"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 1 }}
          animate={
            animate
              ? { opacity: [0, 0, 1, 1, 1, 0] }
              : { opacity: 1 }
          }
          transition={
            animate
              ? {
                  duration: 8,
                  times: [0, 0.28, 0.31, 0.56, 0.7, 1],
                  ease: "easeOut",
                  repeat: Infinity,
                  delay: 1.4,
                }
              : undefined
          }
        />
      </motion.g>
    </g>
  );
}
