import { PostList } from "@/components/nav/PostList";
import { AboutColumn } from "@/components/nav/AboutColumn";
import { POSTS_NEWEST_FIRST } from "@/content/posts-manifest";

/**
 * Home page — two-column on ≥ 768px, single column below.
 * Left: AboutColumn (~320px, sticky). Right: PostList (flex fill).
 */
export default function Home() {
  return (
    <div className="w-full px-[var(--spacing-lg)] md:px-[var(--spacing-2xl)] pt-[var(--spacing-xl)] md:pt-[var(--spacing-3xl)] pb-[var(--spacing-3xl)]">
      <div className="grid grid-cols-1 gap-[var(--spacing-2xl)] md:grid-cols-[320px_minmax(0,1fr)] md:gap-[var(--spacing-2xl)] lg:gap-[var(--spacing-3xl)]">
        <AboutColumn />
        <div>
          <PostList posts={POSTS_NEWEST_FIRST} />
        </div>
      </div>
    </div>
  );
}
