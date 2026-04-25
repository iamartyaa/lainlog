"use client";

import { motion } from "motion/react";
import { TIMING } from "@/lib/motion";
import type { ReactNode } from "react";

/**
 * PostListMotion — client-only wrapper around each <li> in PostList.
 * Each child fades in (opacity-only, no displacement) on TIMING.fast,
 * with a tiny inter-row stagger. Reveal is intentionally lightning-fast
 * on back-navigation; the only "slow" part is the optional first-visit
 * delayChildren that holds the cascade until the hero choreography
 * settles (set in PostList.tsx, not here).
 *
 * Respects prefers-reduced-motion via the global MotionConfigProvider.
 */

const ITEM_STAGGER = 0.02; // 20ms — perceptible texture, no visible build-up

const makeListVariants = (delayChildren: number) => ({
  hidden: { opacity: 1 }, // keep the list itself visible; stagger drives children
  show: {
    opacity: 1,
    transition: {
      staggerChildren: ITEM_STAGGER,
      delayChildren,
    },
  },
});

const itemVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: TIMING.fast,
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
