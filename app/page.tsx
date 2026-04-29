import { PostList } from "@/components/nav/PostList";
import { AboutColumn } from "@/components/nav/AboutColumn";
import { CourseCard } from "@/components/nav/CourseCard";
import { TiltedCourseCardWrapper } from "@/components/courses/TiltedCourseCardWrapper";
import { POSTS_NEWEST_FIRST } from "@/content/posts-manifest";
import { PINNED_COURSE } from "@/content/courses-manifest";
import { getUniqueReaderCount } from "@/lib/stats";

/**
 * Home page — single column below lg:, two-column from lg: up.
 * At md: (768) the sidebar would starve the PostList body cell to ~400px,
 * so the grid stays single-column until there's real room at 1024.
 * Left: AboutColumn (~320px, sticky). Right: pinned <CourseCard /> (if a
 * course is pinned) above <PostList />.
 */
export default async function Home() {
  const readerCount = await getUniqueReaderCount();
  return (
    <div className="w-full px-[var(--spacing-md)] sm:px-[var(--spacing-lg)] md:px-[var(--spacing-xl)] lg:px-[var(--spacing-2xl)] pt-[var(--spacing-lg)] sm:pt-[var(--spacing-xl)] md:pt-[var(--spacing-2xl)] lg:pt-[var(--spacing-3xl)] pb-[var(--spacing-3xl)]">
      <div className="grid gap-[var(--spacing-xl)] lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-[var(--spacing-3xl)]">
        <AboutColumn readerCount={readerCount} />
        <div>
          {PINNED_COURSE ? (
            <TiltedCourseCardWrapper>
              <CourseCard course={PINNED_COURSE} />
            </TiltedCourseCardWrapper>
          ) : null}
          <PostList posts={POSTS_NEWEST_FIRST} />
        </div>
      </div>
    </div>
  );
}
