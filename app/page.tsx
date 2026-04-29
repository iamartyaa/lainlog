import { PostList } from "@/components/nav/PostList";
import { AboutColumn } from "@/components/nav/AboutColumn";
import { CourseCard } from "@/components/nav/CourseCard";
import { BorderGlow } from "@/components/courses/BorderGlow";
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
            // polish-r4 ITEM 1 — replaces TiltedCard with React Bits
            // BorderGlow, retoned to bytesize terracotta/clay tokens.
            //   • colors  — three terracotta/clay stops (NO purple/pink/blue)
            //   • glowColor — HSL approximation of --color-accent (terra-40
            //     light / terra-60 dark) read via --bg-glow-hsl, set per
            //     theme inline (light) + via [data-theme="dark"] override
            //     in app/globals.css.
            //   • backgroundColor — clay-50 (light) / clay-100 (dark) so the
            //     card surface stays consistent with the rest of the page;
            //     react.gg gridline canvas reads through the rest of the bg.
            //   • Editorial-calm tuning: edgeSensitivity=20, glowRadius=28,
            //     glowIntensity=0.6, coneSpread=20, borderRadius=12 (matches
            //     --radius-md), animated=false (no intro sweep).
            //   • The wrapper carries data-course (so --clay-* + --bg-glow-hsl
            //     resolve) and data-on-tilted-card (legacy attr CourseCard
            //     reads to suppress its own dashed top + bottom rules — kept
            //     because BorderGlow paints its own perimeter).
            <BorderGlow
              data-course="true"
              data-on-tilted-card="true"
              colors={[
                "var(--color-accent)",
                "var(--clay-200, var(--color-rule))",
                "var(--clay-100, var(--color-surface))",
              ]}
              // Light-mode terracotta HSL (oklch(0.52 0.145 28) ≈ hsl(14 60 45)).
              // Dark-mode override lives in app/globals.css via [data-theme="dark"]
              // .border-glow-card { --bg-glow-hsl: 14 55 60 } so the same
              // component instance picks up the correct hue per theme.
              glowColor="14 60 45"
              backgroundColor="var(--clay-50, var(--color-surface))"
              edgeSensitivity={20}
              glowRadius={28}
              glowIntensity={0.6}
              coneSpread={20}
              borderRadius={12}
              animated={false}
            >
              <CourseCard course={PINNED_COURSE} />
            </BorderGlow>
          ) : null}
          <PostList posts={POSTS_NEWEST_FIRST} />
        </div>
      </div>
    </div>
  );
}
