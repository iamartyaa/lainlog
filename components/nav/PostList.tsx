import Link from "next/link";
import type { PostMeta } from "@/content/posts-manifest";

function formatDate(iso: string): string {
  // "Apr 04, 2026" in Plex Mono; stays dev-editorial, not "yesterday".
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
      {Array.from(groups.entries()).map(([year, entries]) => (
        <section key={year} className="mt-[var(--spacing-2xl)]">
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
          <ul className="mt-[var(--spacing-md)] space-y-[var(--spacing-lg)]">
            {entries.map((p) => (
              <li key={p.slug} className="group">
                <Link
                  href={`/posts/${p.slug}`}
                  className="flex items-baseline justify-between gap-[var(--spacing-md)] no-underline"
                >
                  <span
                    className="font-sans font-semibold transition-colors group-hover:text-[color:var(--color-accent)]"
                    style={{ fontSize: "var(--text-h3)" }}
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
                </Link>
                <p
                  className="mt-[var(--spacing-2xs)] font-serif"
                  style={{
                    fontSize: "var(--text-body)",
                    color: "var(--color-text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  {p.hook}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
