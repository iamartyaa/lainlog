/**
 * CourseGlyph — bespoke static SVG mark for the home pinned course card and
 * (optionally) the course-landing hero. Three stacked terracotta dashes of
 * progressive widths plus a 1-px terracotta vertical guide on the left;
 * reads as "course spine" without animating.
 *
 * Two sizes:
 *   thumb (default 64×80) — used by the home pinned <CourseCard>; sized to
 *     match the post-row <PostCover> thumb visual weight.
 *   hero  (96×96)         — kept as a future affordance; <CourseLandingHero>
 *     uses <CourseSpine> instead, so this size is currently unused.
 *
 * Server component — no motion, no client hooks, no view-transition-name.
 */

type Size = "thumb" | "hero";

const DIMS: Record<Size, { w: number; h: number }> = {
  thumb: { w: 64, h: 80 },
  hero: { w: 96, h: 96 },
};

export function CourseGlyph({
  size = "thumb",
  ariaLabel,
}: {
  size?: Size;
  ariaLabel?: string;
}) {
  const { w, h } = DIMS[size];
  const labelled = !!ariaLabel;
  return (
    <svg
      viewBox="0 0 64 80"
      width={w}
      height={h}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? ariaLabel : undefined}
      aria-hidden={labelled ? undefined : true}
      focusable={false}
      style={{ display: "block" }}
    >
      {/* 1-px vertical guide. */}
      <line
        x1="6"
        y1="16"
        x2="6"
        y2="64"
        stroke="var(--color-accent)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Three stacked dashes — progressive widths, evenly spaced. */}
      <line
        x1="14"
        y1="24"
        x2="44"
        y2="24"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="40"
        x2="52"
        y2="40"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="14"
        y1="56"
        x2="36"
        y2="56"
        stroke="var(--color-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
