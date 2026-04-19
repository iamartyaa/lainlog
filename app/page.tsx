import { PostList } from "@/components/nav/PostList";
import { AboutColumn } from "@/components/nav/AboutColumn";
import { POSTS_NEWEST_FIRST } from "@/content/posts-manifest";

/**
 * Home page — two-column on ≥ 768px, single column below.
 * Left: AboutColumn (tagline + brief + cadence note). Right: PostList.
 */
export default function Home() {
  return (
    <div className="mx-auto w-full px-[var(--spacing-md)] md:px-[var(--spacing-lg)] pt-[var(--spacing-xl)] md:pt-[var(--spacing-2xl)] pb-[var(--spacing-3xl)]">
      <div className="grid grid-cols-1 gap-[var(--spacing-2xl)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-[var(--spacing-3xl)]">
        <AboutColumn />
        <div>
          <PostList posts={POSTS_NEWEST_FIRST} />
        </div>
      </div>
    </div>
  );
}
