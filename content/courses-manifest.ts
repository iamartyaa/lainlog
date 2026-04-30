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
    title: "Model Context Protocol",
    hook:
      "what MCP is, why it's built like this, and why it matters right now.",
    pinned: true,
    level: "intermediate",
    updatedAt: "2026-04-30",
    chapters: [
      {
        slug: "the-room-before-the-protocol",
        title: "The room before the protocol",
        hook:
          "before MCP, every AI integration was a one-off — and your terminal already hides the receipt.",
        readingMinutes: 8,
      },
      {
        slug: "host-client-server",
        title: "Three roles, one connection",
        hook:
          "MCP isn't peer-to-peer. it's a host that spawns one client per server.",
        readingMinutes: 10,
      },
      {
        slug: "json-rpc-the-wire",
        title: "JSON-RPC, the wire that carries it",
        hook:
          "every MCP message is JSON-RPC 2.0. four fields are the whole story.",
        readingMinutes: 12,
      },
      {
        slug: "the-handshake",
        title: "The handshake",
        hook:
          "every session begins with a negotiation. get it wrong and nothing works.",
        readingMinutes: 11,
      },
      {
        slug: "the-server-primitives",
        title: "Tools, resources, prompts",
        hook: "three primitives, three controllers — model, application, user.",
        readingMinutes: 14,
      },
      {
        slug: "build-a-server",
        title: "Build a server, in the page",
        hook:
          "by the end of this chapter you've authored a working MCP server.",
        readingMinutes: 14,
      },
      {
        slug: "build-a-client-pick-a-transport",
        title: "Build a client, pick a transport",
        hook:
          "stdio for trust, HTTP for distance. and the smallest host that works.",
        readingMinutes: 13,
      },
      {
        slug: "when-the-server-asks-back",
        title: "When the server asks back",
        hook:
          "sampling, elicitation, roots — and the human in the loop in each.",
        readingMinutes: 11,
      },
      {
        slug: "how-mcp-gets-attacked",
        title: "How MCP gets attacked",
        hook:
          "MCP is a protocol, not a perimeter. the spec says SHOULD; you ship the MUST.",
        readingMinutes: 12,
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
