"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Top-right terracotta corner swatch inside the CozyFrame. Pulses once on
 * first paint — a small arrival signal, not a loop. Under
 * prefers-reduced-motion the pulse is skipped entirely (useReducedMotion
 * short-circuits to a static swatch). Purely decorative; the element is
 * `aria-hidden` and sits outside any semantic flow.
 */
export function CozyFrameAccent() {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-[var(--spacing-md)] top-[var(--spacing-md)]"
    >
      {/* The always-visible swatch (terracotta square) */}
      <div
        className="h-[10px] w-[10px]"
        style={{ background: "var(--color-accent)" }}
      />
      {/* One-shot pulse ring — only renders if reduced-motion is off */}
      {!reduced && (
        <motion.div
          className="absolute left-0 top-0 h-[10px] w-[10px]"
          style={{
            border: "1px solid var(--color-accent)",
            transformOrigin: "center",
          }}
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 3.6, opacity: 0 }}
          transition={{
            duration: 0.9,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      )}
    </div>
  );
}
