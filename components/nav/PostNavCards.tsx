"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { POSTS, type PostMeta } from "@/content/posts-manifest";
import { PRESS } from "@/lib/motion";

const MotionLink = motion.create(Link);

/**
 * Local stable sort over POSTS — date desc, slug desc tiebreaker.
 * Two posts currently share `2026-04-19`; the manifest's exported
 * `POSTS_NEWEST_FIRST` uses an unstable comparator that flips on ties. We
 * never mutate the manifest; this local copy guarantees deterministic
 * neighbour resolution across rebuilds.
 */
const STABLE_NEWEST_FIRST: PostMeta[] = [...POSTS].sort((a, b) => {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.slug < b.slug ? 1 : -1;
});

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

type PostNavCardsProps = { slug: string };

/**
 * PostNavCards — chronological "previous · next" navigation, rendered
 * once per post page after the closer ornament. Two cards: PREVIOUS POST
 * (older neighbour), NEXT POST (newer neighbour). Bounds collapse: the
 * oldest post has no previous slot, the newest has no next slot.
 *
 * Width matches the widget tier (`min(100% - 2*spacing-lg, 900px)`) so the
 * row visually rhymes with FullBleed widgets. Uses `<nav aria-label="Post
 * navigation">` rather than `<figure>` because this is an actual landmark.
 *
 * Frame stability (DESIGN.md §9 + §10): card height never animates. PRESS
 * is a transient transform-only pulse (`scale: 0.96` for ~100 ms); the
 * surrounding flow is unchanged because `transform` doesn't trigger layout.
 *
 * Reduced motion: `motion-reduce:transition-none` collapses the CSS hover
 * transitions; `MotionConfigProvider` collapses the motion/react springs.
 *
 * Prefetch is explicitly off — the article-end is a low-velocity moment;
 * just-in-time fetch on click is fine and avoids burning bandwidth on a
 * neighbour the reader may never visit.
 */
export function PostNavCards({ slug }: PostNavCardsProps) {
  const index = STABLE_NEWEST_FIRST.findIndex((p) => p.slug === slug);
  if (index === -1) return null;

  // STABLE_NEWEST_FIRST is newest-first, so:
  //   previous (older) = index + 1
  //   next     (newer) = index - 1
  const previous = STABLE_NEWEST_FIRST[index + 1];
  const next = STABLE_NEWEST_FIRST[index - 1];

  if (!previous && !next) return null;

  return (
    <nav
      aria-label="Post navigation"
      className="relative left-1/2 -translate-x-1/2 mt-[var(--spacing-2xl)] mb-[var(--spacing-xl)] grid grid-cols-1 md:grid-cols-2 gap-[var(--spacing-md)] md:gap-[var(--spacing-lg)]"
      style={{ width: "min(calc(100vw - var(--spacing-lg) * 2), 900px)" }}
    >
      {previous ? (
        <NavCard direction="previous" post={previous} />
      ) : (
        // Empty grid cell so a lone NEXT card still aligns to the right
        // half on md:+. On mobile (single column) the empty cell collapses.
        <div aria-hidden className="hidden md:block" />
      )}
      {next ? (
        <NavCard direction="next" post={next} />
      ) : (
        <div aria-hidden className="hidden md:block" />
      )}
    </nav>
  );
}

function NavCard({
  direction,
  post,
}: {
  direction: "previous" | "next";
  post: PostMeta;
}) {
  const label = direction === "previous" ? "Previous post" : "Next post";
  const alignClass = direction === "next" ? "md:text-right" : "";

  return (
    <MotionLink
      href={`/posts/${post.slug}`}
      prefetch={false}
      aria-label={`${label}: ${post.title}`}
      className={`group block no-underline transition-colors duration-[200ms] motion-reduce:transition-none ${alignClass}`}
      style={{
        // Hit target ≥ 44 × 44 — the whole card is the link.
        minHeight: "44px",
        padding: "var(--spacing-md)",
        border: "1px solid var(--color-rule)",
        borderRadius: "var(--radius-sm)",
      }}
      {...PRESS}
    >
      <span
        className="block font-sans font-medium"
        style={{
          fontSize: "var(--text-small)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-muted)",
        }}
      >
        {direction === "previous" ? (
          <>
            <span aria-hidden>← </span>
            {label}
          </>
        ) : (
          <>
            {label}
            <span aria-hidden> →</span>
          </>
        )}
      </span>
      <span
        className="mt-[var(--spacing-xs)] block font-serif font-semibold transition-colors duration-[200ms] motion-reduce:transition-none group-hover:text-[color:var(--color-accent)] group-focus-visible:text-[color:var(--color-accent)]"
        style={{
          fontSize: "var(--text-medium)",
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          color: "var(--color-text)",
        }}
      >
        {post.title}
      </span>
      <time
        dateTime={post.date}
        className="mt-[var(--spacing-2xs)] block font-mono tabular-nums"
        style={{
          fontSize: "var(--text-small)",
          color: "var(--color-text-muted)",
        }}
      >
        {formatDate(post.date)}
      </time>
    </MotionLink>
  );
}
