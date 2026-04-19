"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { SPRING } from "@/lib/motion";

/**
 * FullBleed — breaks out of the prose column to a widget-wide figure.
 * Centering (`left: 50% + translateX(-50%)`) stays CSS-only so it can't
 * collide with motion's transform property; the scroll-into-view reveal
 * lives on a nested div that only drives opacity + y.
 */
export function FullBleed({ children }: { children: ReactNode }) {
  return (
    <figure
      className="relative left-1/2 -translate-x-1/2 my-[var(--spacing-xl)]"
      style={{ width: "min(calc(100vw - var(--spacing-lg) * 2), 900px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={SPRING.smooth}
      >
        {children}
      </motion.div>
    </figure>
  );
}
