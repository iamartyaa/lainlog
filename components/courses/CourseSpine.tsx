"use client";

import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";

/**
 * CourseSpine — quiet generative SVG sitting behind/below the course title
 * on the landing-page hero. Three terracotta dashes of progressive widths
 * grow from `scaleX: 0` to their final size on first paint, then sit still.
 *
 * Decorative — `aria-hidden`. Stroke uses `--clay-200` (a quieter terracotta
 * variant scoped under [data-course]) so the spine reads as background motif,
 * not a heading-weight element.
 *
 * Reduced-motion: rendered at end-state (scaleX = 1) without animation.
 */
export function CourseSpine() {
  const reduce = useReducedMotion();

  // Three dashes, progressive widths inside a 320×60 viewbox. transform-origin
  // is left so scaleX reads as "drawing left-to-right".
  const dashes = [
    { y: 12, w: 240 },
    { y: 30, w: 300 },
    { y: 48, w: 180 },
  ];

  // ITEM-1 polish-r2: dropped `preserveAspectRatio="none"` + `overflow: visible`.
  // The previous version stretched the 320-wide viewBox to 100% of the title
  // column without preserving aspect — at 1440 px the dashes elongated to read
  // as full-page stray horizontal lines beneath the title. Now: width capped
  // at min(420px, 60%) so the spine sits as a discrete motif behind the H1's
  // last line, not as a page-wide rule.
  return (
    <svg
      viewBox="0 0 320 60"
      width="100%"
      height="60"
      aria-hidden
      focusable={false}
      style={{
        display: "block",
        maxWidth: "min(420px, 60%)",
      }}
    >
      {dashes.map((d, i) => (
        <motion.line
          key={i}
          x1="0"
          y1={d.y}
          x2={d.w}
          y2={d.y}
          stroke="var(--clay-200, var(--color-accent))"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            transformBox: "fill-box",
            transformOrigin: "left center",
          }}
          initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { ...SPRING.smooth, delay: 0.04 + i * 0.04 }
          }
        />
      ))}
    </svg>
  );
}
