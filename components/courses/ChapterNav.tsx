"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PRESS } from "@/lib/motion";
import { ChapterJumper } from "./ChapterJumper";
import type { ChapterMeta } from "@/content/courses-manifest";

const MotionLink = motion.create(Link);

/**
 * ChapterNav — bottom-of-chapter prev/centre/next nav.
 *
 * Slots:
 *   prev   — chapter N-1, or "back to course outline" on chapter 1.
 *   centre — at ≥ 480 px, <ChapterJumper> dot row.
 *            below 480 px, text-only "course outline ↑" link.
 *   next   — chapter N+1, or "Finish course →" on the last chapter.
 *
 * The centre slot renders BOTH the mobile text link and the desktop dot row
 * in the DOM; CSS @media swaps which is visible (banked feedback
 * v2-independent #3 — no useMediaQuery, no SSR flicker). See
 * `course-canvas.css` for the toggle classes.
 */
export function ChapterNav({
  courseSlug,
  courseTitle,
  chapters,
  currentSlug,
}: {
  courseSlug: string;
  courseTitle: string;
  chapters: ChapterMeta[];
  currentSlug: string;
}) {
  const index = chapters.findIndex((c) => c.slug === currentSlug);
  if (index < 0) return null;

  const prev = chapters[index - 1];
  const next = chapters[index + 1];
  const isFirst = index === 0;
  const isLast = index === chapters.length - 1;

  const courseHref = `/courses/${courseSlug}`;

  return (
    <nav
      aria-label="Chapter navigation"
      className="mx-auto mt-[var(--spacing-2xl)] mb-[var(--spacing-xl)] grid items-center gap-[var(--spacing-md)]"
      style={{
        width: "min(calc(100vw - var(--spacing-lg) * 2), 900px)",
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
      }}
    >
      {/* Previous */}
      <div className="min-w-0">
        {isFirst ? (
          <MotionLink
            href={courseHref}
            prefetch={false}
            aria-label={`Back to course outline: ${courseTitle}`}
            className="inline-flex flex-col items-start no-underline transition-colors duration-[200ms] motion-reduce:transition-none"
            style={{
              padding: "var(--spacing-sm)",
              margin: "calc(var(--spacing-sm) * -1)",
              minHeight: 44,
            }}
            {...PRESS}
          >
            <Eyebrow>
              <span aria-hidden>← </span>back
            </Eyebrow>
            <Title>Course outline</Title>
          </MotionLink>
        ) : (
          <MotionLink
            href={`/courses/${courseSlug}/${prev.slug}`}
            prefetch={false}
            aria-label={`Previous chapter: ${prev.title}`}
            className="inline-flex flex-col items-start no-underline transition-colors duration-[200ms] motion-reduce:transition-none"
            style={{
              padding: "var(--spacing-sm)",
              margin: "calc(var(--spacing-sm) * -1)",
              minHeight: 44,
            }}
            {...PRESS}
          >
            <Eyebrow>
              <span aria-hidden>← </span>previous · ch {String(index).padStart(2, "0")}
            </Eyebrow>
            <Title>{prev.title}</Title>
          </MotionLink>
        )}
      </div>

      {/* Centre — both shapes in the DOM, CSS @media toggles visibility */}
      <div className="min-w-0 flex items-center justify-center">
        <Link
          href={courseHref}
          prefetch={false}
          className="bs-chapter-nav-centre-mobile font-mono no-underline transition-colors duration-[200ms] motion-reduce:transition-none"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            padding: "var(--spacing-sm)",
            minHeight: 44,
            alignItems: "center",
          }}
        >
          course outline <span aria-hidden style={{ marginLeft: 4 }}>↑</span>
        </Link>
        <div className="bs-chapter-nav-centre-desktop">
          <ChapterJumper
            courseSlug={courseSlug}
            chapters={chapters}
            currentSlug={currentSlug}
          />
        </div>
      </div>

      {/* Next */}
      <div className="min-w-0 flex justify-end text-right">
        {isLast ? (
          <MotionLink
            href={courseHref}
            prefetch={false}
            aria-label={`Finish course: ${courseTitle}`}
            className="inline-flex flex-col items-end no-underline transition-colors duration-[200ms] motion-reduce:transition-none"
            style={{
              padding: "var(--spacing-sm)",
              margin: "calc(var(--spacing-sm) * -1)",
              minHeight: 44,
            }}
            {...PRESS}
          >
            <Eyebrow>finish</Eyebrow>
            <Title>
              Finish course
              <span aria-hidden style={{ marginLeft: "0.25em", opacity: 0.85 }}>
                →
              </span>
            </Title>
          </MotionLink>
        ) : (
          <MotionLink
            href={`/courses/${courseSlug}/${next.slug}`}
            prefetch={false}
            aria-label={`Next chapter: ${next.title}`}
            className="inline-flex flex-col items-end no-underline transition-colors duration-[200ms] motion-reduce:transition-none"
            style={{
              padding: "var(--spacing-sm)",
              margin: "calc(var(--spacing-sm) * -1)",
              minHeight: 44,
            }}
            {...PRESS}
          >
            <Eyebrow>
              next · ch {String(index + 2).padStart(2, "0")}
              <span aria-hidden> →</span>
            </Eyebrow>
            <Title>{next.title}</Title>
          </MotionLink>
        )}
      </div>
    </nav>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono"
      style={{
        fontSize: "var(--text-small)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-text-muted)",
        fontWeight: 500,
        opacity: 0.85,
      }}
    >
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mt-[var(--spacing-2xs)] font-sans font-semibold transition-colors duration-[200ms] motion-reduce:transition-none group-hover:text-[color:var(--color-accent)]"
      style={{
        fontSize: "var(--text-medium, 1.0625rem)",
        lineHeight: 1.25,
        letterSpacing: "-0.012em",
        color: "var(--color-text)",
      }}
    >
      {children}
    </span>
  );
}
