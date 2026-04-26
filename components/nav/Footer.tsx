/**
 * Footer — a single-line muted ornament at the bottom of every page. The
 * footer used to credit the author ("built by An Anonymous Engineer") but
 * the site went anonymous in PR #25; the slot has been recycled into a
 * Spolsky quote that mirrors the site's own thesis.
 *
 * Joel Spolsky's "Law of Leaky Abstractions" (2002) is the canonical
 * statement of what every lainlog post is doing: abstractions hide the
 * mechanism only as long as the mechanism behaves well; lainlog's whole
 * job is to walk readers into the seams. The quote pairs cleanly with
 * SITE_ABOUT ("for people who'd rather pry the abstraction open than
 * read about it") without being on-the-nose.
 */
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
      <div className="mx-auto flex max-w-[65ch] items-center">
        <span>
          &ldquo;All non-trivial abstractions, to some degree, are
          leaky.&rdquo; &mdash; Joel Spolsky
        </span>
      </div>
    </footer>
  );
}
