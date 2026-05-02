"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";

/**
 * Glitter — a small cluster of shimmer dots that fade in and out around
 * the bounds of a parent element. Lifted from the original `<Note>` glitter
 * (PR #36) and extracted so any "look-at-me" affordance can reuse the
 * exact same shimmer vocabulary.
 *
 * Visual contract:
 *   - 3-5 terracotta dots (`--color-accent`) positioned around the
 *     parent's bounds via percentage / pixel offsets.
 *   - Each dot fades opacity 0 → 0.85 → 0 over `duration` (default 3.6s),
 *     with staggered `delay` so the eye catches on the cluster without it
 *     feeling spinny.
 *   - Tiny y-drift (3px) gives life without committing to motion.
 *
 * Reduced-motion contract:
 *   - When `prefers-reduced-motion: reduce`, the dots disappear entirely
 *     (`return null`). This matches the original Note behavior and keeps
 *     the "no decoration motion under reduced-motion" rule absolute.
 *
 * Composition:
 *   - The parent must establish positioning context (`position: relative`).
 *     Glitter renders an absolutely positioned <span aria-hidden> and
 *     paints dots inside it.
 *   - The component is `pointer-events: none`; it never intercepts hover
 *     or click on the parent.
 *
 * Tuning notes (from the Note → Chip extraction review):
 *   - Default 4 dots is the sweet spot for a Note-trigger-sized parent
 *     (~360 × 44 px). For smaller surfaces (e.g. chips ~80 × 28 px), pass
 *     a 3-dot `dots` array so the cluster doesn't crowd the perimeter.
 *   - Dot size: 5 px default; for chips, 3-4 px reads better.
 */

export type GlitterDot = {
  /** Horizontal position. CSS length or percentage. */
  x: string;
  /** Vertical position. CSS length or percentage. */
  y: string;
  /** Animation delay in seconds. Stagger across dots so the cluster
   *  twinkles asynchronously. */
  delay: number;
};

export type GlitterProps = {
  /** Dot positions + delays. Default: 4 dots arranged at the corners of
   *  the parent's bounds. */
  dots?: GlitterDot[];
  /** Dot diameter in px. Default 5. Use 3-4 for chips. */
  size?: number;
  /** Color. Default `var(--color-accent)`. */
  color?: string;
  /** Per-dot animation duration. Default 3.6s. */
  duration?: number;
};

const DEFAULT_DOTS: GlitterDot[] = [
  { x: "6%", y: "-8px", delay: 0 },
  { x: "92%", y: "-6px", delay: 0.7 },
  { x: "20%", y: "calc(100% - 2px)", delay: 1.4 },
  { x: "78%", y: "calc(100% - 2px)", delay: 2.1 },
];

export function Glitter({
  dots = DEFAULT_DOTS,
  size = 5,
  color = "var(--color-accent)",
  duration = 3.6,
}: GlitterProps) {
  const prefersReducedMotion = useReducedMotion();

  // Reduced-motion: render nothing. Decoration motion is opt-out by
  // default (a stricter contract than the global animation-killer, which
  // would just freeze the dots in place).
  if (prefersReducedMotion) return null;

  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {dots.map((dot, i) => (
        <Spark
          key={i}
          x={dot.x}
          y={dot.y}
          delay={dot.delay}
          size={size}
          color={color}
          duration={duration}
        />
      ))}
    </span>
  );
}

function Spark({
  x,
  y,
  delay,
  size,
  color,
  duration,
}: {
  x: string;
  y: string;
  delay: number;
  size: number;
  color: string;
  duration: number;
}) {
  const style: CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: "50%",
    background: color,
    filter: "blur(0.3px)",
    willChange: "transform, opacity",
  };

  return (
    <motion.span
      style={style}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0, 0.85, 0],
        scale: [0.6, 1, 0.6],
        y: [0, -3, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export default Glitter;
