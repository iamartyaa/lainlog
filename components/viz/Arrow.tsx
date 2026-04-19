"use client";

import { motion } from "motion/react";
import { SVG_ENTER } from "@/lib/motion";

type Props = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** Visual tone. */
  tone?: "default" | "active" | "muted";
  /** Draw-on animation if true (pathLength 0 -> 1). */
  animateIn?: boolean;
  /** Curvature — 0 = straight line, >0 curves outward. */
  curvature?: number;
  strokeWidth?: number;
  markerSize?: "default" | "sm";
};

/**
 * Arrow — canonical directed connector. Uses context-stroke marker so the
 * arrowhead inherits the line color automatically.
 */
export function Arrow({
  x1,
  y1,
  x2,
  y2,
  tone = "default",
  animateIn = false,
  curvature = 0,
  strokeWidth = 1.5,
  markerSize = "default",
}: Props) {
  const stroke =
    tone === "active"
      ? "var(--color-accent)"
      : tone === "muted"
        ? "color-mix(in oklab, var(--color-text) 25%, transparent)"
        : "var(--color-text-muted)";

  // Straight line if no curvature; otherwise quadratic bezier with control
  // point perpendicular to midpoint.
  const isCurved = curvature !== 0;
  const d = isCurved
    ? (() => {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        // Perpendicular unit vector
        const px = -dy / len;
        const py = dx / len;
        const cx = mx + px * curvature;
        const cy = my + py * curvature;
        return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      })()
    : `M ${x1} ${y1} L ${x2} ${y2}`;

  const markerId = markerSize === "sm" ? "bs-arrow-sm" : "bs-arrow";

  const Path = animateIn ? motion.path : "path";

  return (
    <Path
      d={d}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      markerEnd={`url(#${markerId})`}
      {...(animateIn
        ? {
            initial: SVG_ENTER.initial,
            animate: SVG_ENTER.animate,
            transition: SVG_ENTER.transition,
          }
        : {})}
    />
  );
}
