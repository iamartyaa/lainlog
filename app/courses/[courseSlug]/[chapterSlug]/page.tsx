import type { Metadata } from "next";
import type { ComponentType } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { COURSES, findChapter } from "@/content/courses-manifest";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { ChapterTopRule } from "@/components/courses/ChapterTopRule";
import { ChapterNav } from "@/components/courses/ChapterNav";
import { Prose } from "@/components/prose";
import { SITE_NAME } from "@/lib/site";
import { MCPS_CONTENT } from "@/app/courses/mcps/_content/registry";
import "@/components/courses/course-canvas.css";

/**
 * Per-course content registry. Looks up an authored Content component for
 * a given (courseSlug, chapterSlug) pair. Returns null if the chapter has
 * no authored body yet — the route falls back to the placeholder paragraph
 * in that case.
 */
function getChapterContent(
  courseSlug: string,
  chapterSlug: string,
): React.ComponentType | null {
  if (courseSlug === "mcps") {
    return MCPS_CONTENT[chapterSlug] ?? null;
  }
  return null;
}

/**
 * Chapter page.
 *
 * Server-component shell. Wraps in `data-course` + `data-course-chapter`
 * so the chapter-prose 1-px terracotta guide rule resolves at desktop
 * widths (course-canvas.css).
 *
 * Body is a placeholder paragraph — real prose lands in a follow-up task.
 *
 * Static at build time via generateStaticParams over the course × chapter
 * cross-product.
 */

export function generateStaticParams() {
  return COURSES.flatMap((c) =>
    c.chapters.map((ch) => ({ courseSlug: c.slug, chapterSlug: ch.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ courseSlug: string; chapterSlug: string }>;
}): Promise<Metadata> {
  const { courseSlug, chapterSlug } = await params;
  const found = findChapter(courseSlug, chapterSlug);
  if (!found) return {};
  return {
    title: `${found.chapter.title} · ${found.course.title}`,
    description: found.chapter.hook,
    openGraph: {
      title: `${found.chapter.title} · ${found.course.title} · ${SITE_NAME}`,
      description: found.chapter.hook,
      type: "article",
    },
  };
}

export default async function CourseChapterPage({
  params,
}: {
  params: Promise<{ courseSlug: string; chapterSlug: string }>;
}) {
  const { courseSlug, chapterSlug } = await params;
  const found = findChapter(courseSlug, chapterSlug);
  if (!found) notFound();
  const { course, chapter, index } = found;

  return (
    <div
      data-course
      data-course-chapter
      className="w-full pt-0 pb-[var(--spacing-3xl)]"
    >
      <ChapterTopRule
        courseSlug={course.slug}
        chapterSlug={chapter.slug}
        totalChapters={course.chapters.length}
      />

      <div className="px-[var(--spacing-md)] sm:px-[var(--spacing-lg)] md:px-[var(--spacing-xl)] lg:px-[var(--spacing-2xl)] pt-[var(--spacing-xl)]">
        <div className="mx-auto" style={{ maxWidth: "65ch" }}>
          <PostBackLink
            href={`/courses/${course.slug}`}
            label="course outline"
          />
        </div>
      </div>

      <Prose>
        <div className="bs-course-prose pt-[var(--spacing-xl)] pb-[var(--spacing-lg)]">
          {/* Eyebrow — tight to the H1 (proximity = "this is the title's
              metadata"). Mono small-caps establish "you are here". */}
          <p
            className="font-mono"
            style={{
              fontSize: "var(--text-small)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              margin: 0,
            }}
          >
            Chapter {index + 1} of {course.chapters.length} ·{" "}
            <Link
              href={`/courses/${course.slug}`}
              className="no-underline hover:text-[color:var(--color-accent)]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {course.title}
              <span aria-hidden> ↑</span>
            </Link>
          </p>

          {/* H1 — generous space below establishes title as the primary
              beat; the hook then sits as a quieter secondary. */}
          <h1
            className="mt-[var(--spacing-sm)] mb-[var(--spacing-md)] font-sans font-semibold"
            style={{
              fontSize: "var(--text-h1)",
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            {chapter.title}
          </h1>

          {/* Hook — italics + muted colour signals "subtitle, not body".
              Generous bottom margin separates from the placeholder body. */}
          <p
            className="mt-0 mb-[var(--spacing-xl)] font-serif italic"
            style={{
              fontSize: "var(--text-medium, 1.0625rem)",
              color: "var(--color-text-muted)",
              lineHeight: 1.55,
              maxWidth: "55ch",
            }}
          >
            {chapter.hook}
          </p>

          {(() => {
            const Content = getChapterContent(course.slug, chapter.slug);
            if (Content) {
              return <Content />;
            }
            return (
              <p
                className="font-serif"
                style={{
                  fontSize: "var(--text-body)",
                  lineHeight: 1.7,
                  color: "var(--color-text)",
                  margin: 0,
                }}
              >
                Chapter content lands in a follow-up task. This page is the
                layout shell — the navigation works end-to-end, your
                progress is tracked locally, and the typography is in
                place. Real prose, with an embedded interactive widget,
                will land here next.
              </p>
            );
          })()}
        </div>
      </Prose>

      <ChapterNav
        courseSlug={course.slug}
        courseTitle={course.title}
        chapters={course.chapters}
        currentSlug={chapter.slug}
      />
    </div>
  );
}

