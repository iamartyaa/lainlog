import { PostList } from "@/components/nav/PostList";
import { POSTS_NEWEST_FIRST } from "@/content/posts-manifest";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[65ch] px-[var(--spacing-lg)] pb-[var(--spacing-3xl)]">
      <p
        className="mt-[var(--spacing-2xl)] font-serif"
        style={{
          fontSize: "1.25rem",
          lineHeight: 1.5,
          color: "var(--color-text)",
        }}
      >
        explainers in software and ai engineering,
        <br />
        with widgets that teach.
      </p>

      <PostList posts={POSTS_NEWEST_FIRST} />
    </div>
  );
}
