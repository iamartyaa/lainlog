import type { Metadata } from "next";
import { SITE_URL as SITE, SITE_NAME } from "@/lib/site";
import { getCourseBySlug } from "@/content/courses-manifest";

/**
 * Per-course metadata. The page reads `generateMetadata(...)` so the
 * <head> tags resolve from the manifest at build time. New courses
 * inherit this resolver — no per-route metadata.ts duplication.
 */
type Args = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourseBySlug(slug);

  if (!course) {
    return { title: `course not found — ${SITE_NAME}` };
  }

  const title = `${course.title} — ${SITE_NAME}`;
  const description = course.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE}/courses/${course.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
