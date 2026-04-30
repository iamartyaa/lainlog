import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COURSES, findCourse } from "@/content/courses-manifest";
import { PostBackLink } from "@/components/nav/PostBackLink";
import { CourseLandingHero } from "@/components/courses/CourseLandingHero";
import { SITE_NAME } from "@/lib/site";
import "@/components/courses/course-canvas.css";

/**
 * Course landing page.
 *
 * Server-component shell. Sets `data-course` on the wrapper so the
 * course-canvas tonal-terracotta tokens (--clay-*) resolve. The animated
 * hero, action pair, intro, and chapter outline all live inside the
 * client <CourseLandingHero>.
 *
 * Static at build time via generateStaticParams.
 */

export function generateStaticParams() {
  return COURSES.map((c) => ({ courseSlug: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ courseSlug: string }> },
): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = findCourse(courseSlug);
  if (!course) return {};
  return {
    title: course.title,
    description: course.hook,
    openGraph: {
      title: `${course.title} · ${SITE_NAME}`,
      description: course.hook,
      type: "article",
    },
  };
}

export default async function CourseLandingPage({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const course = findCourse(courseSlug);
  if (!course) notFound();

  return (
    <div data-course className="w-full px-[var(--spacing-md)] sm:px-[var(--spacing-lg)] md:px-[var(--spacing-xl)] lg:px-[var(--spacing-2xl)] pt-[var(--spacing-xl)] pb-[var(--spacing-3xl)]">
      <div className="mx-auto" style={{ maxWidth: "min(100%, 720px)" }}>
        <PostBackLink />
      </div>
      <div className="mt-[var(--spacing-lg)]">
        <CourseLandingHero course={course} />
      </div>
    </div>
  );
}
