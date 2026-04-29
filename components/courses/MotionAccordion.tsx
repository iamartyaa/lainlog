"use client";

/**
 * MotionAccordion — vendored from Unlumen's motion-accordion
 * (https://ui.unlumen.com/components/motion-accordion).
 *
 * polish-r2 ITEM 5 adaptations:
 *   - Replaces the chapter outline on /courses/<slug>. Each item is a
 *     chapter; the expanded panel shows the chapter hook, reading minutes,
 *     and a "Start chapter →" link routing to /courses/<slug>/<chapterSlug>.
 *   - Tokens swapped to bytesize palette: --color-bg / --color-text /
 *     --color-rule / --color-accent + the [data-course] tonal --clay-* range.
 *     No second accent introduced.
 *   - Rounded-corner style toned from 30 px to 4 px (var(--radius-md)) so
 *     the accordion sits inside bytesize's editorial-calm vocabulary.
 *   - Reduced-motion: height + opacity + scale + plus-icon rotation all
 *     instant under prefers-reduced-motion (suppressed via useReducedMotion);
 *     content still expands/collapses, just without animation.
 *   - Keyboard a11y: each header is a real <button> with aria-expanded;
 *     ArrowDown/ArrowUp cycle focus across the accordion items; Home/End
 *     jump to first/last.
 *   - The item's progress dot mirrors the original CourseChapterCard's
 *     binary-visit indicator (filled = visited, outlined = unvisited).
 *     Until isHydrated, dots render outlined to avoid hydration mismatch.
 */

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import type { ChapterMeta } from "@/content/courses-manifest";
import { ChapterGlyph } from "./ChapterGlyph";

export interface MotionAccordionProps {
  courseSlug: string;
  chapters: ChapterMeta[];
  visited: Set<string>;
  isHydrated: boolean;
  /** @default 8 */
  gap?: number;
  className?: string;
}

function AccordionItem({
  courseSlug,
  chapter,
  index,
  isOpen,
  onToggle,
  onKeyDown,
  itemId,
  panelId,
  visited,
  isHydrated,
  buttonRef,
  reduce,
}: {
  courseSlug: string;
  chapter: ChapterMeta;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  itemId: string;
  panelId: string;
  visited: boolean;
  isHydrated: boolean;
  buttonRef: (el: HTMLButtonElement | null) => void;
  reduce: boolean | null;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = React.useState(0);
  const numberLabel = String(index + 1).padStart(2, "0");
  const showFilled = isHydrated && visited;

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContentH(el.scrollHeight));
    ro.observe(el);
    setContentH(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      layout={!reduce}
      className={cn(
        "bs-accordion-item overflow-hidden",
        isOpen && "bs-accordion-item-open",
      )}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", stiffness: 280, damping: 28, mass: 0.9 }
      }
      animate={reduce ? { scale: 1 } : { scale: isOpen ? 1 : 0.995 }}
      initial={false}
      style={{ originX: 0.5, originY: 0 }}
    >
      <button
        id={itemId}
        type="button"
        ref={buttonRef}
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={onToggle}
        onKeyDown={onKeyDown}
        className="bs-accordion-header flex w-full cursor-pointer select-none items-center gap-[var(--spacing-md)] text-left"
      >
        {/* Number — same oversized mono motif as the previous chapter card,
            so the visual rhythm of the outline carries forward. */}
        <span
          aria-hidden
          className="font-mono tabular-nums"
          style={{
            fontSize: "clamp(1.5rem, 1.2rem + 0.9vw, 2rem)",
            color: "var(--clay-400, var(--color-text-muted))",
            letterSpacing: "-0.04em",
            lineHeight: 1,
            minWidth: "3ch",
            fontVariantNumeric: "tabular-nums slashed-zero",
            fontWeight: 400,
          }}
        >
          {numberLabel}
        </span>

        {/* Title — bytesize sans semibold, gentle hover-tint to terracotta. */}
        <span
          className="flex-1 min-w-0 font-sans font-semibold transition-colors duration-[200ms] motion-reduce:transition-none"
          style={{
            fontSize: "clamp(1.0625rem, 1rem + 0.4vw, 1.25rem)",
            lineHeight: 1.2,
            letterSpacing: "-0.012em",
            color: isOpen ? "var(--color-accent)" : "var(--color-text)",
          }}
        >
          {chapter.title}
        </span>

        {/* Glyph — hidden below sm: to keep the mobile header tight. */}
        <span
          aria-hidden
          className="hidden sm:inline-flex flex-shrink-0"
          style={{ width: 28, height: 28, opacity: 0.7 }}
        >
          <ChapterGlyph slug={chapter.slug} size={28} />
        </span>

        {/* Reading minutes — flush right alongside the chevron. */}
        {chapter.readingMinutes ? (
          <span
            aria-hidden
            className="hidden sm:inline-block font-mono"
            style={{
              fontSize: "var(--text-small)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.04em",
              fontVariantNumeric: "tabular-nums",
              opacity: 0.8,
            }}
          >
            {chapter.readingMinutes} min
          </span>
        ) : null}

        {/* Progress dot — preserved from CourseChapterCard. */}
        <span
          aria-label={showFilled ? "Visited" : "Not yet visited"}
          role="img"
          className="inline-block flex-shrink-0"
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: showFilled ? "var(--color-accent)" : "transparent",
            border: showFilled
              ? "1px solid var(--color-accent)"
              : "1px solid var(--clay-300, var(--color-rule))",
          }}
        />

        {/* Plus → x rotation chevron. */}
        <motion.span
          aria-hidden
          animate={reduce ? { rotate: 0 } : { rotate: isOpen ? 45 : 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 480, damping: 28 }
          }
          className="flex-shrink-0"
          style={{
            color: "var(--color-text-muted)",
            display: "inline-flex",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <path
              d="M6.5 0v13M0 6.5h13"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </motion.span>
      </button>

      <motion.div
        id={panelId}
        role="region"
        aria-labelledby={itemId}
        animate={
          reduce
            ? { height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }
            : {
                height: isOpen ? contentH : 0,
                opacity: isOpen ? 1 : 0,
              }
        }
        initial={false}
        transition={
          reduce
            ? { duration: 0 }
            : {
                height: {
                  type: "spring",
                  stiffness: 340,
                  damping: 34,
                  mass: 0.9,
                },
                opacity: { duration: 0.2, ease: "easeOut" },
              }
        }
        style={{ overflow: "hidden" }}
      >
        <motion.div
          ref={contentRef}
          animate={reduce ? { y: 0 } : { y: isOpen ? 0 : -8 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 360, damping: 30, mass: 0.8 }
          }
          className="bs-accordion-panel"
        >
          {/* Hook — Plex Serif italic muted; reads as "the pitch". */}
          <p
            className="font-serif italic"
            style={{
              fontSize: "var(--text-medium, 1.0625rem)",
              color: "var(--color-text-muted)",
              lineHeight: 1.55,
              margin: 0,
              maxWidth: "55ch",
            }}
          >
            {chapter.hook}
          </p>

          {/* Action row — start-chapter link + reading minutes echo. */}
          <div
            className="flex items-center gap-[var(--spacing-md)]"
            style={{ marginTop: "var(--spacing-md)" }}
          >
            <Link
              href={`/courses/${courseSlug}/${chapter.slug}`}
              prefetch={false}
              className="group inline-flex items-center gap-[var(--spacing-2xs)] no-underline transition-colors duration-[200ms] motion-reduce:transition-none"
              style={{
                color: "var(--color-accent)",
                fontFamily: "var(--font-sans)",
                fontWeight: 500,
                fontSize: "var(--text-ui)",
                letterSpacing: "0.01em",
              }}
            >
              <span>Start chapter</span>
              <span
                aria-hidden
                className="transition-transform duration-[200ms] motion-reduce:transition-none group-hover:translate-x-[3px]"
              >
                →
              </span>
            </Link>
            {chapter.readingMinutes ? (
              <span
                aria-hidden
                className="font-mono"
                style={{
                  fontSize: "var(--text-small)",
                  color: "var(--color-text-muted)",
                  letterSpacing: "0.04em",
                  fontVariantNumeric: "tabular-nums",
                  opacity: 0.75,
                }}
              >
                ~{chapter.readingMinutes} min
              </span>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function MotionAccordion({
  courseSlug,
  chapters,
  visited,
  isHydrated,
  gap = 8,
  className,
}: MotionAccordionProps) {
  const rawId = React.useId();
  const baseId = `accordion-${rawId.replace(/:/g, "")}`;
  const reduce = useReducedMotion();

  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  // Keyboard navigation: ArrowDown/Up cycle, Home/End jump to ends.
  const buttonRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    i: number,
  ) => {
    const last = chapters.length - 1;
    let target: number | null = null;
    switch (e.key) {
      case "ArrowDown":
        target = i === last ? 0 : i + 1;
        break;
      case "ArrowUp":
        target = i === 0 ? last : i - 1;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = last;
        break;
    }
    if (target !== null) {
      e.preventDefault();
      buttonRefs.current[target]?.focus();
    }
  };

  return (
    <div className={cn("w-full bs-accordion-root", className)}>
      <div
        className="flex flex-col"
        style={{ gap }}
        role="group"
        aria-label="Course chapters"
      >
        {chapters.map((c, i) => (
          <AccordionItem
            key={c.slug}
            courseSlug={courseSlug}
            chapter={c}
            index={i}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            itemId={`${baseId}-trigger-${i}`}
            panelId={`${baseId}-panel-${i}`}
            visited={visited.has(c.slug)}
            isHydrated={isHydrated}
            buttonRef={(el) => {
              buttonRefs.current[i] = el;
            }}
            reduce={reduce}
          />
        ))}
      </div>
    </div>
  );
}
