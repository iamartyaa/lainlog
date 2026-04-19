"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { SPRING, STAGGER } from "@/lib/motion";

type Props = {
  children: ReactNode;
  /** Stagger child reveals (direct Motion children) by this delay in seconds.
   *  Pass a value from STAGGER. Omit for a single-element reveal. */
  stagger?: number;
  /** Additional delay before the reveal fires. */
  delay?: number;
  className?: string;
};

/**
 * Reveal — the canonical "arrive on scroll-into-view" primitive. Wrap any
 * block of content that should enter with the house spring (opacity + 12 px
 * y offset → 0, SPRING.smooth). Fires once per viewport entry.
 *
 * Reduced-motion users get the final state immediately via
 * MotionConfigProvider's global `reducedMotion="user"` setting — no
 * per-consumer handling needed.
 */
export function Reveal({ children, stagger, delay = 0, className }: Props) {
  if (stagger !== undefined) {
    return (
      <motion.div
        className={className}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: stagger, delayChildren: delay },
          },
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ ...SPRING.smooth, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Variant for children of a `<Reveal stagger={…}>`. */
export const REVEAL_CHILD = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: SPRING.smooth },
} as const;

export { STAGGER };
