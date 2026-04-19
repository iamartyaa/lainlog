import { SITE_ABOUT, SITE_TAGLINE } from "@/lib/site";

/**
 * AboutColumn — the left column of the home page. Holds the tagline
 * (one short sentence), the about paragraph (3-4 sentences), and a
 * tiny meta line for cadence. Sticky on large viewports so the reader
 * can scroll through the post list without losing the framing.
 */
export function AboutColumn() {
  return (
    <aside className="md:sticky md:top-[var(--spacing-lg)] self-start">
      <p
        className="font-serif"
        style={{
          fontSize: "1.375rem",
          lineHeight: 1.35,
          color: "var(--color-text)",
          letterSpacing: "-0.005em",
        }}
      >
        {SITE_TAGLINE}
      </p>

      <p
        className="mt-[var(--spacing-md)] font-serif"
        style={{
          fontSize: "var(--text-body)",
          lineHeight: 1.7,
          color: "var(--color-text-muted)",
        }}
      >
        {SITE_ABOUT}
      </p>

      <div
        className="mt-[var(--spacing-lg)] flex items-center gap-[var(--spacing-sm)] font-mono"
        style={{
          fontSize: "var(--text-small)",
          color: "var(--color-text-muted)",
          letterSpacing: "0.04em",
        }}
      >
        <span
          aria-hidden
          className="inline-block h-2 w-2 rounded-[1px]"
          style={{ background: "var(--color-accent)" }}
        />
        <span>new posts, occasionally.</span>
      </div>
    </aside>
  );
}
