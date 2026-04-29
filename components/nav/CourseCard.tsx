import Link from "next/link";
import { CourseGlyph } from "@/components/covers/CourseGlyph";
import {
  totalReadingMinutes,
  type CourseMeta,
} from "@/content/courses-manifest";

/**
 * CourseCard — the home pinned course row.
 *
 * Sits inline above <PostList /> in the right column at app/page.tsx.
 * DESIGN.md-strict — same row template + dashed-rule vocabulary as PostList:
 *   thumbnail · eyebrow + title + hook stacked · arrow on the right.
 *
 * Q11=a default: top + bottom dashed rules in --color-rule. The /polish
 * phase reviews the doubled-seam read at 1440 px and may drop the bottom
 * rule (Q11(d) fallback) if it reads as a thicker rule rather than a
 * bracket. Decision is documented inline at /polish time.
 *
 * Server component — no client hooks, no view-transition-name, no motion.
 * The card is a content-class affordance, not a widget.
 */
export function CourseCard({ course }: { course: CourseMeta }) {
  const minutes = totalReadingMinutes(course);

  return (
    <Link
      href={`/courses/${course.slug}`}
      aria-label={`${course.title} — ${course.hook}`}
      className="bs-course-card group grid items-center gap-[var(--spacing-md)] lg:gap-[var(--spacing-lg)] px-[var(--spacing-sm)] py-[var(--spacing-lg)] no-underline transition-colors hover:bg-[color:color-mix(in_oklab,var(--color-accent)_4%,transparent)]"
      style={{
        gridTemplateColumns: "64px minmax(0, 1fr) 24px",
        // /polish-phase Q11 decision (recorded 2026-04-30)
        // ----------------------------------------------------
        // Q11=a default keeps both top + bottom dashed rules. The Q11(d)
        // fallback exists for the case where the card's bottom rule and
        // PostList's first-row top rule sit flush, reading as a single
        // thicker rule rather than a clean bracket.
        //
        // Inspection at 1440 px: PostList renders its first <li> with NO
        // top border (`i === 0 ? "" : "border-t border-dashed …"`), so the
        // seam between this card and the first post row is a SINGLE 1-px
        // dashed line — the card's bottom border. No doubling occurs.
        // Therefore Q11=a holds: keep both rules. The card reads as a
        // bracketed unit; the seam below it is the same one-rule rhythm
        // PostList uses between subsequent rows.
        borderTop: "1px dashed var(--color-rule)",
        borderBottom: "1px dashed var(--color-rule)",
      }}
    >
      {/* Glyph */}
      <div className="flex items-center justify-center">
        <CourseGlyph size="thumb" />
      </div>

      {/* Eyebrow + title + hook */}
      <div className="min-w-0 flex flex-col gap-[var(--spacing-2xs)]">
        <span
          className="font-mono"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            letterSpacing: "0.04em",
          }}
        >
          <span style={{ color: "var(--color-accent)" }}>course ·</span>
          {" "}
          {course.chapters.length} chapters · ~{minutes} min
        </span>
        <h3
          className="font-sans font-semibold transition-colors group-hover:text-[color:var(--color-accent)]"
          style={{
            fontSize: "clamp(1.5rem, 1.3rem + 1.2vw, 2rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            color: "var(--color-text)",
            margin: 0,
          }}
        >
          {course.title}
        </h3>
        <p
          className="font-serif"
          style={{
            fontSize: "var(--text-body)",
            color: "var(--color-text-muted)",
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {course.hook}
        </p>
      </div>

      {/* Arrow */}
      <div
        aria-hidden
        className="justify-self-end transition-transform duration-[200ms] group-hover:translate-x-[3px] group-hover:text-[color:var(--color-accent)]"
        style={{ color: "var(--color-text-muted)" }}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="M13 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
