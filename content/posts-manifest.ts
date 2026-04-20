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
    slug: "the-function-that-remembered",
    title: "The function that remembered",
    date: "2026-04-24",
    hook: "how a function outlives the scope it was born in — and why half of your JS bugs start there.",
    readingMinutes: 10,
    tags: ["javascript", "language-internals"],
  },
  {
    slug: "the-browser-stopped-asking",
    title: "The browser stopped asking",
    date: "2026-04-22",
    hook: "real-time apps didn't teach the server to speak first — they taught the browser to stop hanging up.",
    readingMinutes: 9,
    tags: ["web", "protocols", "real-time"],
  },
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
