import Link from "next/link";

/**
 * PostBackLink — small "← back" affordance shown above the HeroTile on every
 * post page. Points at `/`. Server component, no client JS, no motion.
 *
 * Why this exists: after scrolling past the wordmark, readers lose the only
 * visible return path. The wordmark is brand chrome, not navigation feedback.
 * A small in-prose link, sized for a thumb (44 × 44 hit zone via padding +
 * negative margin), restores the return path inside the article column
 * without re-introducing breadcrumbs or sticky chrome.
 *
 * Aria: `aria-label="Back to home"` so screen-readers announce the
 * destination. The visible glyph + word stays "← back" — telegraphic
 * for sighted readers.
 *
 * Reduced motion: `motion-reduce:transition-none` collapses the colour
 * transition so users who opt out get no animation at all.
 */
export function PostBackLink() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="inline-block font-mono no-underline transition-colors duration-[200ms] motion-reduce:transition-none hover:text-[color:var(--color-accent)] focus-visible:text-[color:var(--color-accent)]"
      style={{
        fontSize: "var(--text-small)",
        color: "var(--color-text-muted)",
        // Negative margin pulls the link visually back to the prose edge while
        // padding expands the hit target to ≥ 44 × 44 (DESIGN.md §11).
        margin: "calc(var(--spacing-sm) * -1)",
        padding: "var(--spacing-sm)",
      }}
    >
      <span aria-hidden>← </span>back
    </Link>
  );
}
