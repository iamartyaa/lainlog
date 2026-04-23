"use client";

import { motion } from "motion/react";

const DOT_COUNT = 20;

type Variant = "default" | "centre-accent";

type Props = {
  /**
   * - `default` — all dots muted at 40%.
   * - `centre-accent` — the middle dot renders in `var(--color-accent)`. Use
   *   sparingly, at most once per post, to punctuate the single heaviest beat.
   */
  variant?: Variant;
};

/**
 * Dots — section ornament between major blocks. Distinctive move #1 from
 * DESIGN.md §10. Twenty Plex Mono "·" glyphs at 40% opacity, centred,
 * replacing the conventional <hr>.
 *
 * On scroll-into-view the dots sweep in left-to-right over ~400 ms via a
 * 20 ms child stagger. Fires once per viewport entry. Reduced-motion users
 * see every dot at once.
 */
export function Dots({ variant = "default" }: Props = {}) {
  const accentIndex = variant === "centre-accent" ? Math.floor(DOT_COUNT / 2) : -1;
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
          style={{
            display: "inline-block",
            color:
              i === accentIndex
                ? "var(--color-accent)"
                : undefined,
            opacity: i === accentIndex ? 1 : undefined,
          }}
        >
          ·{i < DOT_COUNT - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.div>
  );
}
