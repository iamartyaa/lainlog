import Link from "next/link";
import Image from "next/image";
import type { PostMeta } from "@/content/posts-manifest";
import { MotionItem, MotionList } from "./PostListMotion";

function formatDate(iso: string): string {
  // "apr 19, 2026" in Plex Mono; stays dev-editorial, not "yesterday".
  const d = new Date(iso + "T00:00:00Z");
  return d
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    })
    .toLowerCase();
}

/**
 * Inline cover src — a per-post hand-crafted image if one was set,
 * otherwise the auto-generated `/cover/<slug>` edge-rendered tile.
 */
function coverSrc(p: PostMeta): string {
  return p.coverImage ?? `/cover/${p.slug}`;
}

export function PostList({ posts }: { posts: PostMeta[] }) {
  // Group by year, preserving newest-first order.
  const groups = new Map<string, PostMeta[]>();
  for (const p of posts) {
    const year = p.date.slice(0, 4);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year)!.push(p);
  }

  return (
    <div>
      {Array.from(groups.entries()).map(([year, entries], groupIdx) => (
        <section
          key={year}
          className={groupIdx === 0 ? "" : "mt-[var(--spacing-2xl)]"}
        >
          <h2
            className="font-sans font-medium"
            style={{
              fontSize: "var(--text-small)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}
          >
            {year}
          </h2>
          <MotionList className="mt-[var(--spacing-md)] flex flex-col gap-[var(--spacing-lg)]">
            {entries.map((p) => (
              <MotionItem key={p.slug} className="group">
                <Link
                  href={`/posts/${p.slug}`}
                  className="grid grid-cols-[96px_minmax(0,1fr)] md:grid-cols-[160px_minmax(0,1fr)] gap-[var(--spacing-md)] md:gap-[var(--spacing-lg)] items-start no-underline"
                  aria-label={`${p.title} — ${p.hook}`}
                >
                  {/* Inline cover image — not a card; sits beside the text */}
                  <div
                    className="relative aspect-[3/2] w-full overflow-hidden rounded-[var(--radius-sm)] transition-transform duration-[200ms] will-change-transform group-hover:-translate-y-[2px]"
                    style={{
                      background: "color-mix(in oklab, var(--color-surface) 60%, transparent)",
                      border: "1px solid var(--color-rule)",
                    }}
                  >
                    <Image
                      src={coverSrc(p)}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 160px, 96px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex flex-col gap-[var(--spacing-2xs)]">
                    <div className="flex items-baseline justify-between gap-[var(--spacing-sm)]">
                      <span
                        className="font-sans font-semibold transition-colors group-hover:text-[color:var(--color-accent)]"
                        style={{ fontSize: "var(--text-h3)", lineHeight: 1.25 }}
                      >
                        {p.title}
                      </span>
                      <time
                        dateTime={p.date}
                        className="shrink-0 font-mono tabular-nums"
                        style={{
                          fontSize: "var(--text-small)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {formatDate(p.date)}
                      </time>
                    </div>
                    <p
                      className="font-serif"
                      style={{
                        fontSize: "var(--text-body)",
                        color: "var(--color-text-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {p.hook}
                    </p>
                  </div>
                </Link>
              </MotionItem>
            ))}
          </MotionList>
        </section>
      ))}
    </div>
  );
}
