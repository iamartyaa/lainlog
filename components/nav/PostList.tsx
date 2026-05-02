import Link from "next/link";
import type { PostMeta } from "@/content/posts-manifest";
import { PostCover } from "@/components/covers/PostCover";

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
}

/**
 * PostList — nan.fyi-inspired row layout.
 *
 * Each row: cover thumbnail · title+date stacked · description · arrow.
 * Dashed horizontal separators between rows. The whole row is a link.
 *
 * No entrance animation. Hover affordances (cover lift, title color shift,
 * arrow nudge) are interaction, not enter/exit motion — kept intact.
 * `view-transition-name` lives inside <PostCover> so home → post morphs
 * still work on the still snapshot.
 */
export function PostList({ posts }: { posts: PostMeta[] }) {
  return (
    <ul className="list-none p-0 m-0">
      {posts.map((p, i) => (
        <li
          key={p.slug}
          className={`group ${i === 0 ? "" : "border-t border-dashed border-[color:var(--color-rule)]"}`}
        >
          <Link
            href={`/posts/${p.slug}`}
            className="grid grid-cols-[64px_minmax(0,1fr)_24px] lg:grid-cols-[80px_minmax(0,1.1fr)_minmax(0,1.2fr)_32px] items-center gap-[var(--spacing-md)] lg:gap-[var(--spacing-lg)] px-[var(--spacing-sm)] py-[var(--spacing-lg)] no-underline transition-colors hover:bg-[color:color-mix(in_oklab,var(--color-accent)_4%,transparent)]"
            aria-label={`${p.title} — ${p.hook}`}
          >
            {/* Cover thumbnail — bespoke per-post animated SVG.
                `view-transition-name` lives on PostCover's outer wrapper
                (CoverFrame) so home → post morphs work on the still
                snapshot while ambient animation continues underneath.
                The hover-lift wraps the cover so the morph target is
                stable. */}
            <div className="transition-transform duration-[200ms] will-change-transform group-hover:-translate-y-[2px]">
              <PostCover slug={p.slug} size="thumb" />
            </div>

            {/* Title + date stacked */}
            <div className="min-w-0 flex flex-col gap-[var(--spacing-2xs)]">
              <h3
                className="font-serif font-semibold transition-colors group-hover:text-[color:var(--color-accent)]"
                style={{
                  // Size stays as a custom clamp (the row-title is
                  // intentionally larger than --text-h3 for nan.fyi-like
                  // density). Tracking sourced from the type ramp.
                  fontSize: "clamp(1.125rem, 1.05rem + 0.7vw, 1.5rem)",
                  lineHeight: 1.2,
                  letterSpacing: "var(--text-h2-tracking)",
                  color: "var(--color-text)",
                }}
              >
                {p.title}
              </h3>
              <time
                dateTime={p.date}
                className="font-mono tabular-nums"
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                }}
              >
                {formatDate(p.date)}
              </time>
            </div>

            {/* Description — hidden below lg:, shown in its own column above */}
            <p
              className="hidden lg:block font-serif"
              style={{
                fontSize: "var(--text-body)",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
              }}
            >
              {p.hook}
            </p>

            {/* Arrow — far right, follows the hover color of the title */}
            <div
              aria-hidden
              className="justify-self-end transition-transform duration-[200ms] group-hover:translate-x-[3px] group-hover:text-[color:var(--color-accent)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              <ArrowIcon />
            </div>

            {/* Below lg: the hook stacks beneath the title+date as its own grid row.
                Spans the full 3-column template on base → md. Hidden at lg: where
                the hook gets its own inline column. */}
            <p
              className="col-span-full lg:hidden -mt-[var(--spacing-xs)] font-serif"
              style={{
                fontSize: "var(--text-small)",
                color: "var(--color-text-muted)",
                lineHeight: 1.5,
              }}
            >
              {p.hook}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  );
}
