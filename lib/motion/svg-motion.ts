/**
 * SVG motion vocabulary — consistent draw-ons, pulses, and taps.
 * Pair with motion's `animate` prop on <motion.path>, <motion.circle>, etc.
 *
 * All presets respect prefers-reduced-motion via globals.css override.
 */

import { SPRING } from "./springs";

/** Line/path draw-on: pathLength 0 → 1. */
export const SVG_ENTER = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { pathLength: SPRING.smooth, opacity: { duration: 0.2 } },
} as const;

/**
 * Sonar ping: one-shot expanding ring + fade.
 * Use on a <circle> to mark a "just happened" moment — e.g. a bit flipped on.
 */
export const SVG_SONAR = {
  initial: { scale: 1, opacity: 0.6 },
  animate: { scale: 2.2, opacity: 0 },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
} as const;

/**
 * Idle breathe: subtle, repeating scale oscillation.
 * Use sparingly — signals "I'm waiting for you to interact with me."
 */
export const SVG_BREATHE = {
  animate: { scale: [1, 1.04, 1] as number[], opacity: [0.85, 1, 0.85] as number[] },
  transition: {
    duration: 2.4,
    ease: "easeInOut" as const,
    repeat: Infinity,
    repeatType: "loop" as const,
  },
} as const;

/** Tap feedback — momentary shrink. Pair with whileTap on interactive SVG elements. */
export const SVG_TAP = { scale: 0.92 } as const;
