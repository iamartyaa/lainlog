"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PRESS, SPRING } from "@/lib/motion";
import { useFirstVisit } from "@/lib/hooks/use-first-visit";
import { useTapPulse } from "@/lib/hooks/use-tap-pulse";
import {
  SITE_ABOUT,
  SITE_AUTHOR_DISPLAY,
  SITE_AUTHOR_URL,
  SITE_NAME,
} from "@/lib/site";

const MotionLink = motion.create(Link);

const COPYRIGHT_START = 2026;
const COPYRIGHT_NOW = new Date().getFullYear();

/**
 * AboutColumn — the left pane of the home page. Big serif wordmark
 * carries the brand; the subscribe pill is the primary CTA; bottom row
 * holds the small meta (author/source links + copyright). Sticky on md+
 * so it stays visible while the post list scrolls.
 *
 * Two entry choreographies keyed on session state:
 *   - First visit: wordmark settles with a transform-only scale+y (LCP-safe,
 *     no opacity animation on the biggest text), paragraph reveals via a
 *     left-to-right mask-position sweep, subscribe pill fades in last.
 *   - Return visit: a short 60 ms stagger across the four children.
 * Reduced-motion users collapse to the final state via MotionConfigProvider.
 */
export function AboutColumn() {
  const { ready, firstVisit } = useFirstVisit();
  const subscribe = useTapPulse<HTMLAnchorElement>();
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

      {/* Subscribe CTA — terracotta pill, primary action */}
      <motion.div
        className="mt-[var(--spacing-lg)]"
        initial={false}
        animate={variant}
        variants={{
          static: { opacity: 1, y: 0 },
          hero: {
            opacity: [0, 1],
            y: [6, 0],
            transition: { duration: 0.24, delay: 1.0, ease: [0.22, 1, 0.36, 1] },
          },
          return: {
            opacity: [0, 1],
            y: [4, 0],
            transition: { ...SPRING.smooth, delay: 0.12 },
          },
        }}
      >
        <MotionLink
          ref={subscribe.ref}
          href="/rss.xml"
          aria-label="Subscribe via RSS"
          onClick={subscribe.pulse}
          className="inline-flex min-h-[44px] items-center gap-[var(--spacing-2xs)] rounded-[var(--radius-md)] px-[var(--spacing-md)] py-[var(--spacing-2xs)] font-sans font-medium transition-colors hover:bg-[color:var(--color-accent-pressed)]"
          style={{
            background: "var(--color-accent)",
            color: "var(--color-bg)",
            fontSize: "var(--text-ui)",
          }}
          {...PRESS}
        >
          subscribe
        </MotionLink>
      </motion.div>

      {/* Bottom-left meta row — icons + copyright */}
      <motion.div
        className="mt-auto pt-[var(--spacing-2xl)] flex items-center gap-[var(--spacing-lg)] font-mono"
        style={{ fontSize: "var(--text-small)", color: "var(--color-text-muted)" }}
        initial={false}
        animate={variant}
        variants={{
          static: { opacity: 1 },
          hero: {
            opacity: [0, 1],
            transition: { duration: 0.3, delay: 1.2 },
          },
          return: {
            opacity: [0, 1],
            transition: { ...SPRING.smooth, delay: 0.18 },
          },
        }}
      >
        <Link
          href={SITE_AUTHOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${SITE_AUTHOR_DISPLAY} on GitHub`}
          className="transition-colors hover:text-[color:var(--color-text)]"
        >
          <GitHubIcon />
        </Link>
        <span className="tabular-nums" aria-label={`copyright ${years}`}>
          © {years}
        </span>
      </motion.div>
    </aside>
  );
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
