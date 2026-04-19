"use client";

import { motion } from "motion/react";
import { SPRING, STAGGER } from "@/lib/motion";
import type { ReactNode } from "react";

/**
 * PostListMotion — client-only wrapper around each <li> in PostList.
 * Parent <ul> uses `variants` + `staggerChildren: STAGGER.tight` to reveal
 * rows one at a time on mount. Each child fades + lifts from y=8 to y=0
 * via SPRING.smooth.
 *
 * Respects prefers-reduced-motion via the global MotionConfigProvider —
 * durations collapse to near-instant, no per-component handling needed.
 */

const makeListVariants = (delayChildren: number) => ({
  hidden: { opacity: 1 }, // keep the list itself visible; stagger drives children
  show: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER.tight,
      delayChildren,
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: SPRING.smooth,
  },
};

export function MotionList({
  children,
  className,
  delayChildren = 0.05,
}: {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before the first child fires. First-visit home
   *  choreography passes ~1.2s so the list arrives after the hero beat. */
  delayChildren?: number;
}) {
  return (
    <motion.ul
      className={className}
      variants={makeListVariants(delayChildren)}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.ul>
  );
}

export function MotionItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.li className={className} variants={itemVariants}>
      {children}
    </motion.li>
  );
}
