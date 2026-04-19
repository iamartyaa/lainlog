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
};

export const POSTS: PostMeta[] = [
  {
    slug: "how-bloom-filters-work",
    title: "How Bloom Filters Work",
    date: "2026-04-19",
    hook: "a probabilistic set, in three hash lanes.",
    readingMinutes: 14,
    tags: ["data-structures", "algorithms"],
  },
];

/** Sorted newest-first. */
export const POSTS_NEWEST_FIRST = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
