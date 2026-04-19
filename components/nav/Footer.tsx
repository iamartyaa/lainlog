"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { SITE_AUTHOR_DISPLAY, SITE_AUTHOR_URL } from "@/lib/site";

const MotionLink = motion.create(Link);

export function Footer() {
  return (
    <footer
      className="mt-[var(--spacing-3xl)] border-t px-[var(--spacing-lg)] py-[var(--spacing-lg)] font-mono"
      style={{
        borderColor: "var(--color-rule)",
        fontSize: "var(--text-small)",
        color: "var(--color-text-muted)",
      }}
    >
      <div className="mx-auto flex max-w-[65ch] flex-col gap-[var(--spacing-xs)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          bytesize · built by{" "}
          <motion.a
            href={SITE_AUTHOR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bs-prose-link hover:text-[color:var(--color-text)] transition-colors"
            {...PRESS}
          >
            {SITE_AUTHOR_DISPLAY}
          </motion.a>
          <span aria-hidden className="ml-[0.25em] opacity-70">
            {"</>"}
          </span>
        </span>
        <MotionLink
          href="/rss.xml"
          aria-label="Subscribe via RSS"
          className="hover:text-[color:var(--color-text)] transition-colors"
          {...PRESS}
        >
          subscribe (rss)
        </MotionLink>
      </div>
    </footer>
  );
}
