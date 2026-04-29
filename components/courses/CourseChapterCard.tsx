"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ChapterGlyph } from "./ChapterGlyph";
import type { ChapterMeta } from "@/content/courses-manifest";

const MotionLink = motion.create(Link);

/**
 * CourseChapterCard — a single chapter row in the landing-page outline.
 *
 * Layout: oversized mono number on the left · title + hook stacked centre
 *         · per-chapter glyph + reading minutes + arrow on the right.
 *         A 6-px progress dot sits to the right of the arrow, filled when
 *         the chapter has been visited.
 *
 * Reads as a tactile product-page row, NOT a grid cell (DESIGN.md §12 honoured).
 *
 * Hover: subtle translate-y -1px lift + --color-surface tint + arrow nudge.
 * Reduced-motion: tint only, no transform.
 *
 * Visited dot is binary (Q4=a). Until `isHydrated` is true, the dot renders
 * outlined regardless of stored state to avoid hydration mismatches.
 */
export function CourseChapterCard({
  courseSlug,
  chapter,
  index,
  visited,
  isHydrated,
}: {
  courseSlug: string;
  chapter: ChapterMeta;
  index: number;
  visited: boolean;
  isHydrated: boolean;
}) {
  const reduce = useReducedMotion();
  const numberLabel = String(index + 1).padStart(2, "0");
  const showFilled = isHydrated && visited;

  return (
    <MotionLink
        href={`/courses/${courseSlug}/${chapter.slug}`}
        prefetch={false}
        aria-label={`${chapter.title} — ${chapter.hook}`}
        className="bs-course-chapter-card group relative grid items-center no-underline transition-colors duration-[200ms] motion-reduce:transition-none"
        style={{
          // Title group hugs the number; right-trio (glyph · minutes ·
          // arrow · dot) gets its own breathing band via larger column gap.
          // Grid template overridden by .bs-course-chapter-card in
          // course-canvas.css per breakpoint to avoid phantom columns
          // from display:none children at mobile.
          columnGap: "var(--spacing-md)",
          padding: "var(--spacing-lg) var(--spacing-sm)",
          borderTop: "1px solid var(--color-rule)",
        }}
        whileHover={reduce ? undefined : { y: -1 }}
        whileTap={reduce ? undefined : { scale: 0.995 }}
        transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Background tint on hover. Painted via a child layer so the link's
            transform doesn't fight a background-color transition. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-[200ms] motion-reduce:transition-none opacity-0 group-hover:opacity-100"
          style={{
            background:
              "color-mix(in oklab, var(--clay-100, var(--color-surface)) 100%, transparent)",
          }}
        />

        {/* 1. Oversized mono number — feature-settings tabular + slashed-zero
            for tight numeric column rhythm. The terracotta tint reads as
            "this is a marker" without overwhelming the title. */}
        <span
          aria-hidden
          className="relative font-mono tabular-nums"
          style={{
            fontSize: "clamp(1.625rem, 1.25rem + 1vw, 2.125rem)",
            color: "var(--clay-400, var(--color-text-muted))",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            minWidth: "3ch",
            paddingRight: "var(--spacing-2xs)",
            fontVariantNumeric: "tabular-nums slashed-zero",
            fontWeight: 400,
          }}
        >
          {numberLabel}
        </span>

        {/* 2. Title + hook — Plex Sans semibold for the title (matches H2
            site-wide), Plex Serif italic muted for the hook (telegraphs
            "this is the pitch, not body copy"). */}
        <span className="relative min-w-0 flex flex-col gap-[var(--spacing-3xs)]">
          <span
            className="font-sans font-semibold transition-colors duration-[200ms] motion-reduce:transition-none group-hover:text-[color:var(--color-accent)]"
            style={{
              fontSize: "clamp(1.0625rem, 1rem + 0.4vw, 1.25rem)",
              lineHeight: 1.2,
              letterSpacing: "-0.012em",
              color: "var(--color-text)",
            }}
          >
            {chapter.title}
          </span>
          <span
            className="font-serif italic"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              lineHeight: 1.5,
            }}
          >
            {chapter.hook}
          </span>
        </span>

        {/* 3. Per-chapter glyph (programmatic) */}
        <span
          aria-hidden
          className="relative hidden sm:inline-flex"
          style={{ width: 32, height: 32 }}
        >
          <ChapterGlyph slug={chapter.slug} size={32} />
        </span>

        {/* 4. Reading minutes — mono small caps. Tabular-nums keeps the
            "min" label aligned regardless of digit count. */}
        {chapter.readingMinutes ? (
          <span
            aria-hidden
            className="relative hidden sm:inline-block font-mono"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              minWidth: "5ch",
              textAlign: "right",
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
              opacity: 0.8,
            }}
          >
            {chapter.readingMinutes} min
          </span>
        ) : (
          <span aria-hidden className="hidden sm:inline-block" />
        )}

        {/* 5. Arrow */}
        <span
          aria-hidden
          className="relative inline-flex items-center justify-center transition-transform duration-[200ms] motion-reduce:transition-none group-hover:translate-x-[3px] group-hover:text-[color:var(--color-accent)]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14" />
            <path d="M13 5l7 7-7 7" />
          </svg>
        </span>

        {/* 6. Progress dot — gentle scale-pulse on row hover (transform-only,
            transition disabled under reduced-motion via motion-reduce).
            Visited dots get a faint terracotta halo on hover — a quiet
            "yes, you've been here" acknowledgement. */}
        <span
          className="relative inline-flex items-center justify-center"
          style={{ width: 16, height: 16 }}
        >
          {showFilled ? (
            <span
              aria-hidden
              className="absolute opacity-0 transition-opacity duration-[200ms] motion-reduce:transition-none group-hover:opacity-100"
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border:
                  "1px solid color-mix(in oklab, var(--color-accent) 30%, transparent)",
              }}
            />
          ) : null}
          <span
            aria-label={showFilled ? "Visited" : "Not yet visited"}
            role="img"
            className="relative inline-block transition-transform duration-[180ms] motion-reduce:transition-none group-hover:scale-125"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: showFilled ? "var(--color-accent)" : "transparent",
              border: showFilled
                ? "1px solid var(--color-accent)"
                : "1px solid var(--clay-300, var(--color-rule))",
              transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          />
        </span>
      </MotionLink>
  );
}
