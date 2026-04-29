/**
 * Mini-course manifest. Parallel to posts-manifest.ts. Adding a new course
 * = adding an entry to COURSES; the route picks it up via generateStaticParams.
 *
 * Schema
 * ------
 *   CourseMeta  — landing-page metadata.
 *   ChapterMeta — per-chapter shell metadata.
 *   COURSES     — the canonical list (presently one course: `mcps`).
 *   PINNED_COURSE — the course that surfaces above the home post stream
 *                   (or null if no course has `pinned: true`).
 *
 * Body content lives in the chapter routes themselves; this manifest is the
 * shape, not the prose.
 */

export type ChapterMeta = {
  slug: string;
  title: string;
  hook: string;
  /** Rough reading time, in minutes. Omit if unknown. */
  readingMinutes?: number;
};

export type CourseMeta = {
  slug: string;
  title: string;
  /** One-line tagline shown on the home pinned card and landing-page hero. */
  hook: string;
  /** Surface above the home post stream when true. */
  pinned?: boolean;
  chapters: ChapterMeta[];
  /** Difficulty signal shown in the course-meta strip. */
  level?: "intro" | "intermediate" | "advanced";
  /** ISO date — last updated; shown in the meta strip and used by sitemap. */
  updatedAt?: string;
};

export const COURSES: CourseMeta[] = [
  {
    slug: "mcps",
    title: "Model Context Protocols",
    hook:
      "what MCPs are, why they're built like this, and why they matter right now.",
    pinned: true,
    level: "intro",
    updatedAt: "2026-04-30",
    chapters: [
      {
        slug: "what-is-an-mcp",
        title: "What is an MCP?",
        hook: "the shape of the protocol, in one paragraph.",
        readingMinutes: 6,
      },
      {
        slug: "why-build-mcps",
        title: "Why build MCPs?",
        hook: "the problem they exist to solve.",
        readingMinutes: 6,
      },
      {
        slug: "the-design-reasoning",
        title: "The design reasoning",
        hook: "why client/server, why JSON-RPC, why now.",
        readingMinutes: 7,
      },
      {
        slug: "what-purpose-they-serve",
        title: "What purpose they serve",
        hook: "the day-to-day jobs MCPs are good at.",
        readingMinutes: 6,
      },
      {
        slug: "why-needed-today",
        title: "Why they're needed today",
        hook: "the tipping point that made MCPs inevitable.",
        readingMinutes: 5,
      },
    ],
  },
];

/** The course (if any) that surfaces above the home post stream. */
export const PINNED_COURSE: CourseMeta | null =
  COURSES.find((c) => c.pinned) ?? null;

/** Total reading minutes across a course's chapters. */
export function totalReadingMinutes(course: CourseMeta): number {
  return course.chapters.reduce(
    (acc, c) => acc + (c.readingMinutes ?? 0),
    0,
  );
}

/** Find a course by slug, or null. */
export function findCourse(slug: string): CourseMeta | null {
  return COURSES.find((c) => c.slug === slug) ?? null;
}

/** Find a chapter and its course, or null. */
export function findChapter(
  courseSlug: string,
  chapterSlug: string,
): { course: CourseMeta; chapter: ChapterMeta; index: number } | null {
  const course = findCourse(courseSlug);
  if (!course) return null;
  const index = course.chapters.findIndex((c) => c.slug === chapterSlug);
  if (index < 0) return null;
  return { course, chapter: course.chapters[index], index };
}
