/**
 * The canonical course index. Adding a new course = adding an entry here +
 * (optionally) a page extension. The route is app/courses/[slug]/page.tsx —
 * keep slug consistent. Pattern parallels content/posts-manifest.ts.
 *
 * Each course carries an `outline` — the ordered list of milestones rendered
 * along the serpentine timeline on the course page. Stops are
 * 1-indexed and map to anchor coordinates in <CourseOutline> via the `stop`
 * field.
 */

export type CourseSectionType =
  | "lesson"
  | "interactive"
  | "quiz"
  | "project"
  | "challenge";

export type CourseSection = {
  /** Stable id, unique within the course. */
  id: string;
  /** Plex Sans, sentence-case. Lainlog voice; no marketing-speak. */
  title: string;
  /** Visual / pedagogical type — drives the type-badge variant. */
  type: CourseSectionType;
  /** One-line gloss, displayed under the title on the milestone card. */
  description?: string;
  /**
   * 1-indexed stop along the serpentine path. The CourseOutline component
   * maps `stop` → anchor coordinates via its internal STOPS table.
   */
  stop: number;
};

export type CourseStatus = "coming-soon" | "open-enrollment" | "live";

export type CourseMeta = {
  slug: string;
  title: string;
  /** Small uppercase eyebrow rendered above the title. */
  kicker: string;
  /** One-paragraph description shown under the title. */
  description: string;
  status: CourseStatus;
  outline: CourseSection[];
};

export const COURSES: CourseMeta[] = [
  {
    slug: "inference-engineering",
    title: "Inference Engineering",
    kicker: "Course · upcoming",
    description:
      "Open the box. From a tokenizer's first regex to a transformer's last softmax, this course builds an LLM's runtime back up from the wires — one widget, one weight matrix, one cache miss at a time.",
    status: "coming-soon",
    outline: [
      {
        id: "tokens",
        title: "tokenization, deeply",
        type: "lesson",
        description:
          "BPE, Unicode edge cases, and why the same string can split two ways on the same model.",
        stop: 1,
      },
      {
        id: "embeddings",
        title: "the embedding table is just a lookup",
        type: "interactive",
        description:
          "Ten thousand vectors in a drawer. The math behind 'meaning lives in geometry'.",
        stop: 2,
      },
      {
        id: "forward-pass",
        title: "the math behind a forward pass",
        type: "lesson",
        description:
          "Q, K, V, and the matmul that turns attention from a metaphor into a number.",
        stop: 3,
      },
      {
        id: "attention-quiz",
        title: "predict the attention pattern",
        type: "quiz",
        description:
          "A 4-token sentence. Most readers pick the wrong head. Then we fix that.",
        stop: 4,
      },
      {
        id: "kv-cache",
        title: "watching a transformer think",
        type: "interactive",
        description:
          "Why the KV-cache exists, what 'prefill' means, and the moment the second token gets cheap.",
        stop: 5,
      },
      {
        id: "sampling",
        title: "temperature, top-p, and the tail",
        type: "lesson",
        description:
          "Sampling decisions, plotted against a real distribution. Where 'creative' actually comes from.",
        stop: 6,
      },
      {
        id: "serve",
        title: "serve a model from a laptop",
        type: "project",
        description:
          "Wire a tokenizer, a 1.5B-parameter checkpoint, and a streaming HTTP endpoint into one terminal window.",
        stop: 7,
      },
    ],
  },
];

/** Lookup by slug. Returns `undefined` for unknown slugs. */
export function getCourseBySlug(slug: string): CourseMeta | undefined {
  return COURSES.find((c) => c.slug === slug);
}

/** All slugs — used by Next's generateStaticParams. */
export function allCourseSlugs(): string[] {
  return COURSES.map((c) => c.slug);
}
