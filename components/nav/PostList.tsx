import Link from "next/link";
import Image from "next/image";
import type { PostMeta } from "@/content/posts-manifest";
import { MotionItem, MotionList } from "./PostListMotion";

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

function coverSrc(p: PostMeta): string {
  return p.coverImage ?? `/cover/${p.slug}`;
}

/**
 * PostList — nan.fyi-inspired row layout.
 *
 * Each row: icon · title+date stacked · description · arrow.
 * Dashed horizontal separators between rows. The whole row is a link.
 * Year headings are rendered as small muted caps above their groups.
 */
export function PostList({ posts }: { posts: PostMeta[] }) {
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
            className="px-[var(--spacing-sm)] font-sans font-medium"
            style={{
              fontSize: "var(--text-small)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
            }}
          >
            {year}
          </h2>
          <MotionList className="mt-[var(--spacing-sm)]">
            {entries.map((p, i) => (
              <MotionItem
                key={p.slug}
                className={`group ${i === 0 ? "" : "border-t border-dashed border-[color:var(--color-rule)]"}`}
              >
                <Link
                  href={`/posts/${p.slug}`}
                  className="grid grid-cols-[64px_minmax(0,1fr)_24px] md:grid-cols-[80px_minmax(0,1.1fr)_minmax(0,1.2fr)_32px] items-center gap-[var(--spacing-md)] md:gap-[var(--spacing-lg)] px-[var(--spacing-sm)] py-[var(--spacing-lg)] no-underline transition-colors hover:bg-[color:color-mix(in_oklab,var(--color-accent)_4%,transparent)]"
                  aria-label={`${p.title} — ${p.hook}`}
                >
                  {/* Icon / thumbnail — square crop of auto-generated cover */}
                  <div
                    className="relative aspect-square h-[64px] w-[64px] md:h-[80px] md:w-[80px] overflow-hidden rounded-[var(--radius-sm)] transition-transform duration-[200ms] will-change-transform group-hover:-translate-y-[2px]"
                    style={{
                      background:
                        "color-mix(in oklab, var(--color-surface) 60%, transparent)",
                      border: "1px solid var(--color-rule)",
                    }}
                  >
                    <Image
                      src={coverSrc(p)}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 80px, 64px"
                      className="object-cover"
                    />
                  </div>

                  {/* Title + date stacked */}
                  <div className="min-w-0 flex flex-col gap-[var(--spacing-2xs)]">
                    <h3
                      className="font-serif font-semibold transition-colors group-hover:text-[color:var(--color-accent)]"
                      style={{
                        fontSize: "clamp(1.25rem, 1.05rem + 0.7vw, 1.5rem)",
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
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

                  {/* Description — hidden below md, shown in its own column above */}
                  <p
                    className="hidden md:block font-serif"
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

                  {/* On narrow viewports, the hook renders below title+date via a separate row
                      tucked inside the first-cell column via a hidden-on-md span. Using a
                      second full-width row via display: contents keeps this single grid. */}
                  <p
                    className="md:hidden col-span-3 -mt-[var(--spacing-xs)] font-serif"
                    style={{
                      fontSize: "var(--text-small)",
                      color: "var(--color-text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {p.hook}
                  </p>
                </Link>
              </MotionItem>
            ))}
          </MotionList>
        </section>
      ))}
    </div>
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
