"use client";

import { motion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { useFirstVisit } from "@/lib/hooks/use-first-visit";
import { ReaderCount } from "@/components/nav/ReaderCount";
import { SITE_ABOUT, SITE_NAME } from "@/lib/site";

const COPYRIGHT_START = 2026;
const COPYRIGHT_NOW = new Date().getFullYear();

/**
 * AboutColumn — the left pane of the home page. Big serif wordmark carries
 * the brand; an about paragraph sets the tone; the bottom row holds the
 * small meta (reader count + copyright). Sticky on md+ so it stays visible
 * while the post list scrolls.
 *
 * Two entry choreographies keyed on session state:
 *   - First visit: wordmark settles with a transform-only scale+y (LCP-safe,
 *     no opacity animation on the biggest text), paragraph reveals via a
 *     left-to-right mask-position sweep, meta row fades in last.
 *   - Return visit: a short stagger across the children.
 * Reduced-motion users collapse to the final state via MotionConfigProvider.
 */
type AboutColumnProps = {
  readerCount: number | null;
};

export function AboutColumn({ readerCount }: AboutColumnProps) {
  const { ready, firstVisit } = useFirstVisit();
  const years =
    COPYRIGHT_NOW === COPYRIGHT_START
      ? `${COPYRIGHT_START}`
      : `${COPYRIGHT_START} – ${COPYRIGHT_NOW}`;

  // Before the hook resolves we render the static tree (no animation).
  // Once ready, variants choose which choreography plays.
  const variant = !ready ? "static" : firstVisit ? "hero" : "return";

  return (
    <aside className="md:sticky md:top-[var(--spacing-lg)] self-start flex flex-col min-h-0 md:min-h-[480px]">
      {/* Giant serif wordmark — brand moment. Transform-only animation on
          first visit so the LCP candidate paints immediately. */}
      <motion.h1
        className="font-serif font-semibold"
        style={{
          fontSize: "clamp(3rem, 2.2rem + 3vw, 4.5rem)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          color: "var(--color-text)",
          transformOrigin: "left bottom",
        }}
        initial={false}
        animate={variant}
        variants={{
          static: { y: 0, scale: 1, opacity: 1 },
          hero: {
            y: [8, 0],
            scale: [0.94, 1],
            opacity: 1,
            transition: { ...SPRING.dramatic, duration: 0.6 },
          },
          return: {
            y: [6, 0],
            scale: 1,
            opacity: [0, 1],
            transition: { ...SPRING.smooth, delay: 0 },
          },
        }}
      >
        {SITE_NAME}
      </motion.h1>

      {/* Tagline + about — left-to-right mask-reveal on first visit. */}
      <motion.p
        className="mt-[var(--spacing-lg)] font-serif"
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.6,
          color: "var(--color-text-muted)",
          maxWidth: "26ch",
        }}
        initial={false}
        animate={variant}
        variants={{
          static: { opacity: 1, clipPath: "inset(0 0% 0 0)" },
          hero: {
            opacity: 1,
            clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"],
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.4 },
          },
          return: {
            opacity: [0, 1],
            clipPath: "inset(0 0% 0 0)",
            transition: { ...SPRING.smooth, delay: 0.06 },
          },
        }}
      >
        {SITE_ABOUT}
      </motion.p>

      {/* Bottom-left meta row — reader count + copyright */}
      <motion.div
        className="mt-auto pt-[var(--spacing-2xl)] flex items-center gap-[var(--spacing-lg)] font-mono"
        style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}
        initial={false}
        animate={variant}
        variants={{
          static: { opacity: 1 },
          hero: {
            opacity: [0, 1],
            transition: { duration: 0.3, delay: 1.0 },
          },
          return: {
            opacity: [0, 1],
            transition: { ...SPRING.smooth, delay: 0.12 },
          },
        }}
      >
        <ReaderCount count={readerCount} />
        <span className="tabular-nums" aria-label={`copyright ${years}`}>
          © {years}
        </span>
      </motion.div>
    </aside>
  );
}
