"use client";

import Link from "next/link";
import type { ChapterMeta } from "@/content/courses-manifest";

/**
 * ChapterJumper — five dots in a horizontal row, one per chapter, used in
 * the desktop centre slot of <ChapterNav>. The current chapter's dot is
 * filled; others are outlined and link to their respective chapter pages.
 *
 * Hit zone: each dot's <Link> is padded so the touch target is ≥ 44 × 44 px
 * even though the visible dot is 8 × 8.
 *
 * Restrained delight: the current dot wears a faint terracotta halo (a
 * second outlined ring at 1.6× the dot's size, terracotta @ 22% opacity)
 * so the "you are here" signal reads at a glance. Other dots stay
 * untouched — the halo is a singular accent, not a row-wide effect.
 */
export function ChapterJumper({
  courseSlug,
  chapters,
  currentSlug,
}: {
  courseSlug: string;
  chapters: ChapterMeta[];
  currentSlug: string;
}) {
  return (
    <ol
      className="flex items-center justify-center gap-[var(--spacing-2xs)]"
      style={{ listStyle: "none", margin: 0, padding: 0 }}
      aria-label="Course chapters"
    >
      {chapters.map((c, i) => {
        const current = c.slug === currentSlug;
        return (
          <li key={c.slug}>
            <Link
              href={`/courses/${courseSlug}/${c.slug}`}
              aria-label={`Chapter ${i + 1}: ${c.title}${current ? " (current)" : ""}`}
              aria-current={current ? "page" : undefined}
              prefetch={false}
              className="group relative inline-flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
              }}
            >
              {/* "You are here" halo — current dot only. */}
              {current ? (
                <span
                  aria-hidden
                  className="absolute"
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border:
                      "1px solid color-mix(in oklab, var(--color-accent) 22%, transparent)",
                  }}
                />
              ) : null}
              <span
                aria-hidden
                className="relative block transition-transform duration-[180ms] motion-reduce:transition-none group-hover:scale-125 group-focus-visible:scale-125"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: current ? "var(--color-accent)" : "transparent",
                  border: current
                    ? "1px solid var(--color-accent)"
                    : "1px solid var(--clay-300, var(--color-rule))",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
