import { PostList } from "@/components/nav/PostList";
import { AboutColumn } from "@/components/nav/AboutColumn";
import { CourseCard } from "@/components/nav/CourseCard";
import { TiltedCourseCardWrapper } from "@/components/courses/TiltedCourseCardWrapper";
import { POSTS_NEWEST_FIRST } from "@/content/posts-manifest";
import { PINNED_COURSE } from "@/content/courses-manifest";
import { getUniqueReaderCount } from "@/lib/stats";

/**
 * Home page — single column below lg:, two-column from lg: up.
 *
 * polish-r3 ITEM 1 — column reproportioning + vertical Swiss-grid divider.
 *   Previous template was `lg:grid-cols-[320px_minmax(0,1fr)]` — a fixed
 *   320px sidebar and a fluid right column. At 1440px that placed the
 *   AboutColumn in a generous left third with the PostList visually adrift
 *   on the right. The user's intent is for the right column (articles +
 *   pinned course card) to dominate as the page's center of gravity.
 *
 *   New template: `260px · 1px · minmax(0,1fr)` at lg+ — left column
 *   shrinks from 320 to 260 px (~19% narrower wordmark column); the 1px
 *   middle column hosts a full-height vertical Swiss-grid divider; the
 *   right column absorbs the freed space and becomes the visually wider
 *   plane. The wordmark `clamp(3rem, 2.2rem + 3vw, 4.5rem)` is unaffected
 *   (260 px easily fits the 6-letter wordmark at clamp-max), and the
 *   AboutColumn copy already constrains itself to 26 ch.
 *
 *   Vertical divider: 1-px solid `--color-rule`, full-height of the grid
 *   row (handled via `align-self: stretch` on the divider cell). It is
 *   the ONLY solid rule on the home page — the post-list rows use dashed
 *   rules; this solid rule denotes a STRUCTURAL section break, not a row
 *   separator (Swiss-grid discipline).
 *
 *   Mobile: divider hidden (`hidden lg:block`) since columns stack.
 *   The CozyFrame's bs-cozy-frame border at the page perimeter stays
 *   1-px solid `--color-rule`; the interior divider sits at the same
 *   weight, so the page reads as three vertical bands separated by
 *   matched 1-px rules — coherent, not collisional.
 */
export default async function Home() {
  const readerCount = await getUniqueReaderCount();
  return (
    <div className="w-full px-[var(--spacing-md)] sm:px-[var(--spacing-lg)] md:px-[var(--spacing-xl)] lg:px-[var(--spacing-2xl)] pt-[var(--spacing-lg)] sm:pt-[var(--spacing-xl)] md:pt-[var(--spacing-2xl)] lg:pt-[var(--spacing-3xl)] pb-[var(--spacing-3xl)]">
      <div className="grid gap-[var(--spacing-xl)] lg:grid-cols-[260px_1px_minmax(0,1fr)] lg:gap-[var(--spacing-2xl)]">
        <AboutColumn readerCount={readerCount} />
        {/* Vertical Swiss-grid divider — desktop only. Stretches to the
            full height of the grid row via `self-stretch`. 1-px solid
            --color-rule matches the bs-cozy-frame perimeter weight so
            the home reads as a coherent three-band composition. */}
        <div
          aria-hidden
          className="hidden lg:block self-stretch"
          style={{
            width: "1px",
            background: "var(--color-rule)",
          }}
        />
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
