"use client";

import { motion, useReducedMotion } from "motion/react";
import { CourseSpine } from "./CourseSpine";
import { CourseChapterCard } from "./CourseChapterCard";
import { useCourseProgress } from "@/lib/hooks/use-course-progress";
import type { CourseMeta } from "@/content/courses-manifest";
import { totalReadingMinutes } from "@/content/courses-manifest";
import { H2, P, Dots } from "@/components/prose";
import Link from "next/link";

/**
 * CourseLandingHero — the animated body of /courses/<slug>.
 *
 * Composition (top-to-bottom):
 *   1. Eyebrow `Mini course`
 *   2. Title with per-word fade+rise reveal (NOT VerticalCutReveal — banned)
 *   3. <CourseSpine /> generative SVG behind the title
 *   4. Action pair (`Start the course →` filled · `Read intro` outlined)
 *   5. Course meta strip (chapters · minutes · last updated · level)
 *   6. Intro section (`#intro`) — pull-quote + paragraph + ornament
 *   7. <Dots /> ornament + `<H2>Chapters</H2>`
 *   8. Chapter outline — vertical sequence of <CourseChapterCard> rows
 *   9. Footer "what you'll know after this course" callout
 *
 * Two /overdrive surfaces live in this component (Q12=a):
 *   - Hero composition (per-word reveal + spine grow + action-pair entrance,
 *     orchestrated under a tight <300ms first-paint motion budget)
 *   - Chapter-outline reveal on first scroll (cards cascade in at 60ms
 *     stagger when the outline section enters the viewport)
 *
 * Reduced-motion: every animated element falls back to its end-state.
 */

const WORD_FADE_DURATION = 0.24; // seconds
const WORD_FADE_STAGGER = 0.06;  // seconds — total budget kept <300ms
// /overdrive surface #1: hero. Custom easing — ease-out-quint (slightly
// snappier than the SPRING.smooth used elsewhere) to make the title's
// arrival feel decisive, not floaty. Letter-spacing decays from a hair
// loose to its target tight tracking on each word, so the type "settles
// in" rather than just fading. Tight enough to stay invisible if
// you're not looking for it; visible enough to feel deliberate.
const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function CourseLandingHero({ course }: { course: CourseMeta }) {
  const reduce = useReducedMotion();
  const { visited, isHydrated } = useCourseProgress(course.slug);

  const minutes = totalReadingMinutes(course);
  const words = course.title.split(/\s+/);

  const titleVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: WORD_FADE_STAGGER, delayChildren: 0.04 },
    },
  };
  // Each word: opacity fade + 8px rise + letter-spacing decay from
  // -0.005em → -0.025em. The decay makes the type look like it's
  // "tightening into place" — the overdrive touch.
  const wordVariants = {
    hidden: { opacity: 0, y: 8, letterSpacing: "-0.005em" },
    show: {
      opacity: 1,
      y: 0,
      letterSpacing: "-0.025em",
      transition: { duration: WORD_FADE_DURATION, ease: EASE_OUT_QUINT },
    },
  };

  return (
    <div className="mx-auto w-full" style={{ maxWidth: "min(100%, 720px)" }}>
      {/* 1. Eyebrow — Plex Mono small caps, terracotta. The hairline dot
          before the label echoes the chapter-card number column and the
          home-card eyebrow's "course ·" prefix, threading the same motif
          across all three surfaces. Fades in tightly ahead of the title. */}
      <motion.p
        className="font-mono"
        style={{
          fontSize: "var(--text-small)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--color-accent)",
          margin: 0,
          fontWeight: 500,
        }}
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <span aria-hidden style={{ marginRight: "0.5em", opacity: 0.7 }}>
          ·
        </span>
        Mini course
      </motion.p>

      {/* 2 + 3. Title with spine behind it — the spine underlays the
          title's last line (Q2=a: title-first, spine as quiet background
          motif). z-index keeps the title in front; the spine reads as
          three quiet dashes under the bottom line of type. */}
      <div className="relative mt-[var(--spacing-sm)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0"
          style={{
            bottom: "calc(-0.5em)",
            top: "auto",
            zIndex: 0,
            opacity: 0.5,
          }}
        >
          <CourseSpine />
        </div>
        <motion.h1
          className="relative mt-0 mb-0 font-sans font-semibold"
          style={{
            fontSize: "clamp(2.25rem, 1.8rem + 2vw, 3.25rem)",
            letterSpacing: "-0.025em",
            lineHeight: 1.02,
            zIndex: 1,
          }}
          initial={reduce ? "show" : "hidden"}
          animate="show"
          variants={titleVariants}
        >
          {words.map((w, i) => (
            <motion.span
              key={i}
              variants={wordVariants}
              style={{ display: "inline-block", marginRight: "0.25em" }}
            >
              {w}
            </motion.span>
          ))}
        </motion.h1>
      </div>

      {/* Hook — tight to title (same beat); narrow measure draws the eye in.
          Fades in just after the title's last word lands. */}
      <motion.p
        className="font-serif"
        style={{
          fontSize: "var(--text-medium, 1.0625rem)",
          color: "var(--color-text-muted)",
          lineHeight: 1.55,
          maxWidth: "52ch",
          margin: "var(--spacing-md) 0 0 0",
        }}
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 0.22, delay: 0.18, ease: [0.22, 1, 0.36, 1] }
        }
      >
        {course.hook}
      </motion.p>

      {/* 4. Action pair — enters last in the hero sequence. The 0.24s delay
          keeps the orchestrated sequence inside the 300ms first-paint
          motion budget (Q7=b): title staggers 0–0.18s, hook 0.18–0.40s,
          actions 0.24–0.46s — visually the user perceives motion completing
          at ~280ms because the last word and the action pair finish nearly
          together. */}
      <motion.div
        className="mt-[var(--spacing-xl)] flex flex-col gap-[var(--spacing-sm)] sm:flex-row sm:items-center sm:gap-[var(--spacing-md)]"
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce
            ? { duration: 0 }
            : { duration: 0.24, delay: 0.24, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <PrimaryAction href={`/courses/${course.slug}/${course.chapters[0]?.slug ?? ""}`}>
          Start the course
        </PrimaryAction>
        <SecondaryAction href="#intro">Read intro</SecondaryAction>
      </motion.div>

      {/* 5. Meta strip — separated by a dashed rule, sits as a quiet
          metadata band before the content phase begins. */}
      <p
        className="mt-[var(--spacing-xl)] font-mono"
        style={{
          fontSize: "var(--text-small)",
          letterSpacing: "0.06em",
          color: "var(--color-text-muted)",
          margin: "var(--spacing-xl) 0 0 0",
          paddingTop: "var(--spacing-md)",
          borderTop: "1px dashed var(--color-rule)",
        }}
      >
        {course.chapters.length} chapters
        <Sep />~{minutes} min
        {course.updatedAt ? (
          <>
            <Sep />last updated {formatUpdatedAt(course.updatedAt)}
          </>
        ) : null}
        {course.level ? (
          <>
            <Sep />level: {course.level}
          </>
        ) : null}
      </p>

      {/* 6. Intro section — stronger phase break (2xl above), pull-quote
          sits as a distinct visual unit before the placeholder body. */}
      <section
        id="intro"
        className="mt-[var(--spacing-2xl)]"
        style={{ scrollMarginTop: "var(--spacing-xl)" }}
      >
        <blockquote
          className="font-serif italic"
          style={{
            margin: 0,
            paddingLeft: "var(--spacing-md)",
            borderLeft:
              "1px solid color-mix(in oklab, var(--color-accent) 40%, transparent)",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-medium, 1.0625rem)",
            lineHeight: 1.55,
          }}
        >
          {course.hook}
        </blockquote>
        <div className="mt-[var(--spacing-md)]">
          <P>
            This course is the layout shell. Real chapter prose lands in a
            follow-up task — five short essays, one per chapter, each paired
            with a small interactive widget. Until then, every chapter
            renders a single placeholder paragraph so the navigation,
            progress, and rhythm can be exercised end-to-end.
          </P>
        </div>
      </section>

      {/* 7. Section break + heading — Dots ornament establishes the phase
          shift from "intro" to "chapter outline". */}
      <Dots />

      <H2 id="chapters">Chapters</H2>

      {/* 8. Chapter outline — vertical sequence of tactile rows. The
          oversized number column at the left creates a strong vertical
          ladder; rows breathe via per-row vertical padding rather than
          inter-row gaps.

          /overdrive surface #2: when the outline first enters the
          viewport, rows cascade in via 60 ms stagger × 240 ms fade+rise
          each. IntersectionObserver-driven (motion/react's whileInView).
          Fires once. Reduced-motion: instant, no stagger. */}
      <motion.ol
        className="list-none p-0"
        style={{ margin: "var(--spacing-md) 0 0 0" }}
        aria-label="Course chapters"
        initial={reduce ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: reduce ? 0 : 0.04 },
          },
        }}
      >
        {course.chapters.map((c, i) => (
          <motion.li
            key={c.slug}
            className="list-none"
            variants={{
              hidden: reduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: reduce ? 0 : 0.24, ease: EASE_OUT_QUINT },
              },
            }}
          >
            <CourseChapterCard
              courseSlug={course.slug}
              chapter={c}
              index={i}
              visited={visited.has(c.slug)}
              isHydrated={isHydrated}
            />
          </motion.li>
        ))}
        {/* bottom rule under the last card */}
        <li
          aria-hidden
          style={{
            listStyle: "none",
            borderTop: "1px solid var(--color-rule)",
            height: 0,
          }}
        />
      </motion.ol>

      {/* 9. Footer callout — generous space-above marks the bottom of the
          page; mono bullets read as quiet promise, not marketing. */}
      <section
        className="mt-[var(--spacing-3xl)]"
        aria-label="What you'll know after this course"
      >
        <h3
          className="font-sans font-semibold"
          style={{
            fontSize: "var(--text-h3)",
            letterSpacing: "-0.01em",
            margin: 0,
          }}
        >
          What you&apos;ll know after this course
        </h3>
        <ul
          className="mt-[var(--spacing-md)] font-mono"
          style={{
            fontSize: "var(--text-small)",
            color: "var(--color-text-muted)",
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm)",
            lineHeight: 1.55,
          }}
        >
          <li>· what an MCP actually is, in one paragraph.</li>
          <li>· why the protocol shape is the way it is.</li>
          <li>· when to reach for one — and when not to.</li>
        </ul>
      </section>
    </div>
  );
}

function Sep() {
  return (
    <span aria-hidden style={{ margin: "0 0.5em", opacity: 0.6 }}>
      ·
    </span>
  );
}

function PrimaryAction({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-[var(--spacing-xs)] no-underline transition-colors duration-[200ms] motion-reduce:transition-none hover:bg-[color:var(--color-accent-pressed,var(--color-accent))]"
      style={{
        background: "var(--color-accent)",
        color: "var(--color-bg)",
        padding: "calc(var(--spacing-sm) + 2px) var(--spacing-lg)",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-sans)",
        fontWeight: 600,
        fontSize: "var(--text-ui)",
        letterSpacing: "0.005em",
        minHeight: 44,
      }}
    >
      <span
        aria-hidden
        className="inline-flex items-center justify-center transition-transform duration-[400ms] motion-reduce:transition-none group-hover:rotate-[120deg]"
        style={{ width: 14, height: 14 }}
      >
        <ProgressArcIcon />
      </span>
      <span>{children}</span>
      <span
        aria-hidden
        className="transition-transform duration-[200ms] motion-reduce:transition-none group-hover:translate-x-[2px]"
        style={{ marginLeft: "var(--spacing-3xs)", opacity: 0.85 }}
      >
        →
      </span>
    </Link>
  );
}

function SecondaryAction({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group inline-flex items-center gap-[var(--spacing-xs)] no-underline transition-colors duration-[200ms] motion-reduce:transition-none"
      style={{
        color: "var(--color-accent)",
        padding: "calc(var(--spacing-sm) + 1px) var(--spacing-lg)",
        border: "1px solid var(--color-accent)",
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-sans)",
        fontWeight: 500,
        fontSize: "var(--text-ui)",
        letterSpacing: "0.005em",
        minHeight: 44,
        background: "transparent",
      }}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className="inline-block transition-transform duration-[200ms] motion-reduce:transition-none group-hover:translate-y-[2px]"
        style={{ marginLeft: "var(--spacing-3xs)", opacity: 0.7 }}
      >
        ↓
      </span>
    </a>
  );
}

/**
 * ProgressArcIcon — decorative-only (banked feedback v1 #4). Always renders
 * a full ring; not bound to course progress in v1. The hover spin lives in
 * the parent's group-hover transform.
 */
function ProgressArcIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
      focusable={false}
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M 8 2 A 6 6 0 0 1 14 8" strokeLinecap="round" />
    </svg>
  );
}
