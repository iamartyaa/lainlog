"use client";

import { motion } from "motion/react";

const DOT_COUNT = 20;

/**
 * Dots — section ornament between major blocks. Distinctive move #1 from
 * DESIGN.md. Twenty Plex Mono "·" glyphs at 40% opacity, centred, replacing
 * the conventional <hr>.
 *
 * On scroll-into-view the dots sweep in left-to-right over ~400 ms via a
 * 20 ms child stagger (decoupled from the global STAGGER.* tokens so the
 * sweep length reads as a single gesture rather than a stagger). Fires once
 * per viewport entry. Reduced-motion users see every dot at once.
 */
export function Dots() {
  return (
    <motion.div
      role="separator"
      aria-hidden="true"
      className="select-none text-center font-mono"
      style={{
        margin: "var(--spacing-2xl) 0",
        letterSpacing: "0.5em",
        fontSize: "var(--text-mono)",
        color: "color-mix(in oklab, var(--color-text) 40%, transparent)",
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -5% 0px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.018 } },
      }}
    >
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { duration: 0.24 } },
          }}
          style={{ display: "inline-block" }}
        >
          ·{i < DOT_COUNT - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </motion.div>
  );
}
