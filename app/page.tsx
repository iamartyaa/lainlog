import { PostList } from "@/components/nav/PostList";
import { AboutColumn } from "@/components/nav/AboutColumn";
import { CourseCard } from "@/components/nav/CourseCard";
import { BorderGlow } from "@/components/courses/BorderGlow";
import { POSTS_NEWEST_FIRST } from "@/content/posts-manifest";
import { PINNED_COURSE } from "@/content/courses-manifest";
import { COURSES_VISIBLE } from "@/lib/site-flags";
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
          {COURSES_VISIBLE && PINNED_COURSE ? (
            // polish-r5 ITEM 1 + ITEM 2 — neo-brutalism wrapper around
            // re-vendored BorderGlow.
            //
            // Composition (outer → inner):
            //   .bs-course-card-brutalist  ← heavy border + 8px offset
            //     shadow + "COURSE" label glyph; owns hover "press"
            //     micro-interaction. Mobile shrinks shadow to 4px for
            //     frame-stability.
            //   <BorderGlow ...>           ← React Bits pointer-tracked
            //     conic ring + mesh radial, retoned to terracotta tokens.
            //   <CourseCard />              ← actual link markup; dashed
            //     top/bottom rules suppressed via [data-on-tilted-card].
            //
            // Both data-course (clay-token scope) and data-on-tilted-card
            // (CourseCard rule-suppression) flow through to BorderGlow.
            // /layout phase — vertical rhythm. The brutalist wrapper's
            // ::before COURSE label protrudes 10 px above the card; we
            // give it `mt-3` so the protrusion doesn't clip against the
            // grid row above. The `mb-[var(--spacing-xl)]` reserves
            // breathing room below so the 8 px offset shadow can breathe
            // without colliding with the post-list's first dashed rule.
            <div className="bs-course-card-brutalist mt-3 mb-[var(--spacing-xl)]">
              <BorderGlow
                data-course="true"
                data-on-tilted-card="true"
                colors={[
                  "var(--color-accent)",
                  "var(--clay-200, var(--color-rule))",
                  "var(--clay-100, var(--color-surface))",
                ]}
                // Light-mode terracotta HSL (oklch(0.52 0.145 28) ≈
                // hsl(14 60 45)). Dark-mode override in globals.css.
                glowColor="14 60 45"
                backgroundColor="var(--clay-50, var(--color-surface))"
                edgeSensitivity={24}
                glowRadius={32}
                glowIntensity={0.7}
                coneSpread={22}
                // Match the brutalist wrapper's 4 px corner so the
                // pointer-tracked ring traces the same perimeter.
                borderRadius={4}
                animated={false}
              >
                <CourseCard course={PINNED_COURSE} />
              </BorderGlow>
            </div>
          ) : null}
          <PostList posts={POSTS_NEWEST_FIRST} />
        </div>
      </div>
    </div>
  );
}
