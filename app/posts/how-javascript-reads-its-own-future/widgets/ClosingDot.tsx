"use client";

import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";

/**
 * ClosingDot — final brand signature for the post closer.
 * Reveals once on viewport entry with SPRING.smooth opacity.
 * Aria-hidden — purely decorative.
 */
export function ClosingDot() {
  return (
    <motion.p
      aria-hidden
      className="font-mono text-center select-none"
      style={{
        marginBlock: "var(--spacing-xl)",
        color: "var(--color-accent)",
        fontSize: "var(--text-body)",
        letterSpacing: "0.2em",
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.8 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={SPRING.smooth}
    >
      ·
    </motion.p>
  );
}
