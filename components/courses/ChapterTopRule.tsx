"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";
import { useCourseProgress } from "@/lib/hooks/use-course-progress";

/**
 * ChapterTopRule — thin terracotta rule across the top of the chapter prose
 * column, animating from `scaleX: 0` to the share of *chapters visited*
 * (banked feedback v1 #1: progress = visited.size / totalChapters AFTER
 * marking the current chapter on mount).
 *
 * This is "% of chapters visited", not chapter index. A reader landing on
 * chapter 3 first will see 1/5 = 20% on first paint (their visit just
 * counted), not 60%. Document inline so future agents don't "fix" it.
 *
 * Side effect: marks the current chapter as visited once on mount (Q4=a
 * binary visit). Calls `markVisited` inside useEffect — no SSR write.
 *
 * Completion delight (restrained — bytesize voice)
 *   When the visited set first hits totalChapters in the same browser
 *   session, the rule plays a one-shot opacity-pulse — a quiet "you're
 *   done" acknowledgment, transform/opacity-only, no box-shadow, no
 *   confetti. Fires once per session via a useState latch.
 *
 * Reduced motion: jumps directly to the final width with no animation.
 *   The completion pulse also suppresses under reduced-motion.
 */
export function ChapterTopRule({
  courseSlug,
  chapterSlug,
  totalChapters,
}: {
  courseSlug: string;
  chapterSlug: string;
  totalChapters: number;
}) {
  const reduce = useReducedMotion();
  const { visited, isHydrated, markVisited } = useCourseProgress(courseSlug);
  const [pulse, setPulse] = useState(false);

  // Mark this chapter visited once on mount.
  useEffect(() => {
    markVisited(chapterSlug);
  }, [chapterSlug, markVisited]);

  // Detect first completion in this session (set transitioning from
  // < totalChapters to === totalChapters).
  useEffect(() => {
    if (!isHydrated || reduce) return;
    if (visited.size === totalChapters && visited.size > 0) {
      setPulse(true);
      const t = window.setTimeout(() => setPulse(false), 900);
      return () => window.clearTimeout(t);
    }
  }, [isHydrated, reduce, visited.size, totalChapters]);

  // Until hydrated, render the rule at 0 — no flash of "wrong" progress.
  // After hydration, the visited set includes the current chapter (the
  // markVisited effect ran), so the rule grows to its true share.
  const progress = isHydrated ? visited.size / Math.max(1, totalChapters) : 0;

  return (
    <div
      role="progressbar"
      aria-label="Course progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative w-full"
      style={{
        height: 2,
        background:
          "var(--clay-300, color-mix(in oklab, var(--color-text) 8%, transparent))",
      }}
    >
      <motion.div
        aria-hidden
        className="absolute left-0 top-0 h-full"
        style={{
          background: "var(--color-accent)",
          width: "100%",
          transformOrigin: "left center",
        }}
        initial={reduce ? { scaleX: progress } : { scaleX: 0 }}
        animate={
          pulse
            ? { scaleX: progress, opacity: [1, 0.5, 1] }
            : { scaleX: progress, opacity: 1 }
        }
        transition={
          reduce
            ? { duration: 0 }
            : pulse
              ? { ...SPRING.smooth, delay: 0.05, opacity: { duration: 0.9 } }
              : { ...SPRING.smooth, delay: 0.05 }
        }
      />
    </div>
  );
}
