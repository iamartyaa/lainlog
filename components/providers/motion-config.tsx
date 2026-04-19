"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Forwards `prefers-reduced-motion: reduce` to motion/react's JS-driven springs.
 * Without this, CSS media queries only silence CSS transitions — JS springs
 * keep animating. `reducedMotion="user"` reads the OS/browser preference and
 * disables non-essential transforms across every <motion.*> component.
 */
export function MotionConfigProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
