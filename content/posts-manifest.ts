/**
 * The canonical post index. Adding a new post = adding an entry here.
 * The route is app/posts/<slug>/page.tsx — keep slug consistent.
 */
export type PostMeta = {
  slug: string;
  title: string;
  /** ISO date string, YYYY-MM-DD. Used for sitemap, RSS, and year grouping. */
  date: string;
  /** One-line hook shown under the title on the home page. */
  hook: string;
  /** Rough reading time, in minutes. Omit if unknown. */
  readingMinutes?: number;
  /** Topic tag(s) for future filtering. */
  tags?: string[];
  /**
   * Optional hand-crafted cover image. When omitted, the home page falls
   * back to the auto-generated `/cover/<slug>` route, which produces a
   * deterministic typographic tile seeded on the slug.
   */
  coverImage?: string;
};

export const POSTS: PostMeta[] = [
  {
    slug: "why-fetch-fails-only-in-browser",
    title: "Why `fetch` works in curl but the browser blocks it",
    date: "2026-04-20",
    hook: "the server did answer — your browser is just holding the response back from your JavaScript.",
    readingMinutes: 7,
    tags: ["web", "browser", "security"],
  },
  {
    slug: "how-gmail-knows-your-email-is-taken",
    title: "How Gmail knows your email is taken, instantly",
    date: "2026-04-19",
    hook: "the pipeline that tells you 'already taken' before your finger lifts.",
    readingMinutes: 12,
    tags: ["distributed-systems", "architecture"],
  },
];

/** Sorted newest-first. */
export const POSTS_NEWEST_FIRST = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
