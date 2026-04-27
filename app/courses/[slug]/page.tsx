import { notFound } from "next/navigation";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { CourseOutline } from "@/components/course/CourseOutline";
import {
  getCourseBySlug,
  allCourseSlugs,
} from "@/content/courses-manifest";

export { generateMetadata } from "./metadata";

/**
 * Pre-render every known course slug at build time. New course = new
 * manifest entry; the route is generated automatically.
 */
export function generateStaticParams() {
  return allCourseSlugs().map((slug) => ({ slug }));
}

type Args = { params: Promise<{ slug: string }> };

const STATUS_LABEL: Record<string, string> = {
  "coming-soon": "Coming soon",
  "open-enrollment": "Open enrollment",
  live: "Live",
};

/**
 * Course page — static, server-rendered shell with the interactive
 * <CourseOutline> serpentine as the hero. Future PRs will add pricing,
 * FAQ, and enrollment sections; this PR ships the outline only.
 *
 * Layout: 65ch reading column for the header + about copy. The outline
 * itself breaks out of the column to a wider canvas (max ~1100px) so the
 * serpent has room to breathe at desktop widths. Mobile falls back to a
 * vertical timeline owned by <CourseOutline> via container query.
 */
export default async function CoursePage({ params }: Args) {
  const { slug } = await params;
  const course = getCourseBySlug(slug);
  if (!course) notFound();

  return (
    <div className="w-full px-[var(--spacing-md)] sm:px-[var(--spacing-lg)] md:px-[var(--spacing-xl)] lg:px-[var(--spacing-2xl)] pt-[var(--spacing-xl)] pb-[var(--spacing-3xl)]">
      <div className="mx-auto" style={{ maxWidth: "65ch" }}>
        <PostBackLink />

        {/* Kicker — Plex Mono small caps, muted */}
        <p
          className="mt-[var(--spacing-md)] font-mono"
          style={{
            fontSize: "var(--text-small)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-muted)",
            margin: 0,
            marginTop: "var(--spacing-md)",
          }}
        >
          {course.kicker}
        </p>

        {/* Course title */}
        <h1
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(2.5rem, 2rem + 3.5vw, 4rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            marginTop: "var(--spacing-sm)",
            marginBottom: 0,
          }}
        >
          {course.title}
        </h1>

        {/* Status pill — small terracotta-tinted badge */}
        <div className="mt-[var(--spacing-md)]">
          <span
            className="font-mono"
            style={{
              fontSize: "var(--text-small)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background:
                "color-mix(in oklab, var(--color-accent) 14%, transparent)",
              color: "var(--color-accent)",
            }}
          >
            {STATUS_LABEL[course.status] ?? course.status}
          </span>
        </div>

        {/* Description — Plex Serif body */}
        <p
          style={{
            fontSize: "var(--text-body)",
            lineHeight: 1.6,
            color: "var(--color-text-muted)",
            marginTop: "var(--spacing-md)",
            marginBottom: 0,
            maxWidth: "60ch",
          }}
        >
          {course.description}
        </p>

        {/* Section eyebrow — Course outline */}
        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-h2)",
            letterSpacing: "-0.01em",
            marginTop: "var(--spacing-2xl)",
            marginBottom: "var(--spacing-2xs)",
          }}
        >
          The outline
        </h2>
        <p
          className="font-mono"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            margin: 0,
            marginBottom: "var(--spacing-lg)",
          }}
        >
          {course.outline.length} stops · follow the rope.
        </p>
      </div>

      {/* Outline canvas — breaks out of the 65ch reading column. */}
      <div
        className="mx-auto"
        style={{ maxWidth: "1100px", marginBlock: "var(--spacing-xl)" }}
      >
        <CourseOutline outline={course.outline} />
      </div>

      {/* About — back inside the reading column. */}
      <div className="mx-auto" style={{ maxWidth: "65ch" }}>
        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-h2)",
            letterSpacing: "-0.01em",
            marginTop: "var(--spacing-2xl)",
            marginBottom: "var(--spacing-md)",
          }}
        >
          About this course
        </h2>
        <p
          style={{
            fontSize: "var(--text-body)",
            lineHeight: 1.7,
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          Lainlog courses sit one layer below the post archive: longer arcs
          for ideas that don&apos;t fit one essay. Each stop on the serpent
          above is a self-contained module — read it alone, or follow the
          rope all the way around. The same widget vocabulary you&apos;ve
          met across the posts shows up here, applied at depth.
        </p>
        <p
          style={{
            fontSize: "var(--text-body)",
            lineHeight: 1.7,
            color: "var(--color-text-muted)",
            marginTop: "var(--spacing-md)",
            marginBottom: 0,
          }}
        >
          Pricing, enrollment, and the first lesson land in a follow-up
          release. This page is the shape of what&apos;s coming.
        </p>
      </div>
    </div>
  );
}
