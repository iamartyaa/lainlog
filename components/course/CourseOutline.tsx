"use client";

/**
 * <CourseOutline> — the hero serpentine timeline for course pages.
 *
 * Pattern adapted from the reference react.gg "From Start to Ready" board
 * layout: a single winding SVG path drawn with multiple stacked strokes
 * (outer shadow / dark spine / inner wash / dashed stitching), with
 * milestone cards scattered along the path at hard-coded anchor points.
 * The path geometry is reused as-is; every visual layer is rebuilt against
 * lainlog's terracotta-only token palette (DESIGN.md §3).
 *
 * Layers (outer → inner):
 *   1. shadow stroke — width 84, --color-rule (soft beige outline)
 *   2. dark spine    — width 80, --color-text  (the rope's body)
 *   3. inner wash    — width 70, accent 16% mixed with surface (warm fill)
 *   4. stitching     — width 1.5, dashed (2.01 / 80.58), text-muted
 *
 * Animation:
 *   - On first scroll-in (`useInView`, once: true) the path's pathLength
 *     animates 0 → 1 over a single SPRING.dramatic spring. Numbered
 *     markers and stop cards stagger in as the rope reaches each anchor.
 *   - Reduced-motion: render the final state instantly. No rAF, no
 *     pathLength tween.
 *
 * Frame-stability (R6): the SVG container has a fixed aspect ratio of
 * 1166 / 716 so it cannot reflow during animation. Cards are absolutely
 * positioned relative to the same wrapper, so their anchor coordinates
 * are stable across viewport widths.
 *
 * Mobile fallback: at container widths below 720 px the SVG is dropped
 * and a vertical-timeline of stacked CourseStop cards renders instead,
 * with a continuous left rail + numbered terracotta circles.
 *
 * One-accent rule: every visual variation between stop cards comes from
 * opacity / saturation of --color-accent + neutrals (§3). No greens, no
 * blues, no pinks — even though the reference layout uses them.
 *
 * Audio: `lib/audio.ts` documents principle #7 (user-triggered only —
 * autonomous animations do NOT call `playSound`). The brief proposed a
 * Swoosh on path-completion; that's a scroll-driven autonomous cue and
 * would violate the principle. Audio is intentionally not wired here.
 */

import { useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";
import type { CourseSection } from "@/content/courses-manifest";
import { CourseStop } from "./CourseStop";

/**
 * Serpentine path geometry. Adapted (geometry only) from the reference
 * board-game SVG; viewBox 0 0 1166 716. The first L1 reaches 678→598
 * vertically, then sweeps a long S-curve across to ~893,187, and
 * terminates back near the centre at ~458,224 — a rope that visits both
 * sides of the canvas twice.
 *
 * SAFE TO EDIT, but anchors below depend on this curve. If the path is
 * ever reshaped, recompute STOP_ANCHORS using a path-sample tool.
 */
const SERPENTINE_D =
  "M55.02 678.9v-10.02c0-179 147-190.61 193.6-194.65 46.6-4.04 123.39-15.83 422-15.83s317.66-194.63 235.24-280.28c-82.42-85.66-330.6-109.35-559.81-67.08-219.92 40.55-194.35 246.89 7.09 214.89";

/**
 * Anchor coordinates for each stop in viewBox units. These were sampled
 * along the serpentine path at evenly-spaced parameter values so the
 * cards trace the rope visually rather than crowding.
 *
 * `markerOffset` shifts the card from the anchor in viewBox units so the
 * card sits beside the rope rather than on top of it.
 */
type Anchor = {
  /** Marker (numbered circle) position on the path itself, in viewBox units. */
  x: number;
  y: number;
  /** Card position offset from marker, in viewBox units. */
  cardDx: number;
  cardDy: number;
  /** Polaroid tilt, signed degrees. */
  tilt: number;
};

const STOP_ANCHORS: Record<number, Anchor> = {
  1: { x: 55, y: 660, cardDx: 60, cardDy: -100, tilt: -2 },
  2: { x: 130, y: 510, cardDx: 80, cardDy: -40, tilt: 1 },
  3: { x: 360, y: 462, cardDx: -130, cardDy: -120, tilt: -1 },
  4: { x: 660, y: 458, cardDx: 30, cardDy: 60, tilt: 2 },
  5: { x: 905, y: 320, cardDx: -300, cardDy: -90, tilt: -1 },
  6: { x: 720, y: 130, cardDx: -260, cardDy: 60, tilt: 1 },
  7: { x: 320, y: 122, cardDx: 60, cardDy: -110, tilt: -2 },
  8: { x: 130, y: 230, cardDx: 130, cardDy: 30, tilt: 1 },
  9: { x: 458, y: 224, cardDx: -120, cardDy: 80, tilt: -1 },
};

/** viewBox dimensions — kept as constants so the aspect ratio stays in sync. */
const VB_W = 1166;
const VB_H = 716;

type Props = {
  outline: CourseSection[];
};

export function CourseOutline({ outline }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  // amount: 0.25 — start drawing once a quarter of the canvas is on-screen.
  // once: true — the path draws once per page-load, never again on re-scroll.
  const inView = useInView(wrapperRef, { amount: 0.25, once: true });

  // Sort stops by their `stop` index so the markers and cards render in path order.
  const sortedStops = useMemo(
    () => [...outline].sort((a, b) => a.stop - b.stop),
    [outline]
  );

  /**
   * Stagger the stop reveals so the marker scales in just as the path
   * reaches it. The path tween runs ~1.4s; spread N stops across that
   * window (with a small padding so the last stop pops just after the
   * rope finishes).
   */
  const stopDelay = (stop: number, total: number): number => {
    if (total <= 1) return 0.4;
    const t = (stop - 1) / (total - 1); // 0 → 1
    return 0.2 + t * 1.1; // first stop ~200ms in, last ~1.3s in
  };

  return (
    <div ref={wrapperRef} className="bs-course-outline">
      {/* ───────────── Desktop / wide: serpentine SVG with scattered cards ───────────── */}
      <div className="bs-course-outline-wide relative w-full">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
            focusable={false}
            style={{ position: "absolute", inset: 0 }}
          >
            {/* Layer 1 — shadow stroke (soft outline) */}
            <path
              d={SERPENTINE_D}
              fill="none"
              stroke="var(--color-rule)"
              strokeWidth={84}
              strokeMiterlimit={10}
              strokeLinecap="round"
            />
            {/* Layer 2 — dark spine (the rope body) */}
            <path
              d={SERPENTINE_D}
              fill="none"
              stroke="var(--color-text)"
              strokeWidth={80}
              strokeMiterlimit={10}
              strokeLinecap="round"
            />
            {/* Layer 3 — interior wash (warm terracotta-tinted fill) */}
            <path
              d={SERPENTINE_D}
              fill="none"
              stroke="color-mix(in oklab, var(--color-accent) 16%, var(--color-surface))"
              strokeWidth={70}
              strokeMiterlimit={10}
              strokeLinecap="round"
            />
            {/* Layer 4 — dashed stitching, drawn-in via pathLength */}
            <motion.path
              d={SERPENTINE_D}
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth={1.5}
              strokeDasharray="0 0 2.01 80.58"
              strokeMiterlimit={10}
              initial={
                reduced ? { pathLength: 1 } : { pathLength: 0 }
              }
              animate={
                reduced
                  ? { pathLength: 1 }
                  : inView
                    ? { pathLength: 1 }
                    : { pathLength: 0 }
              }
              transition={
                reduced
                  ? { duration: 0.001 }
                  : { ...SPRING.dramatic, restDelta: 0.001 }
              }
            />

            {/* Numbered markers — small terracotta discs pinned to the path */}
            {sortedStops.map((s) => {
              const anchor = STOP_ANCHORS[s.stop];
              if (!anchor) return null;
              const delay = stopDelay(s.stop, sortedStops.length);
              return (
                <motion.g
                  key={`marker-${s.id}`}
                  initial={
                    reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }
                  }
                  animate={
                    reduced
                      ? { scale: 1, opacity: 1 }
                      : inView
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0, opacity: 0 }
                  }
                  transition={
                    reduced
                      ? { duration: 0.001 }
                      : { ...SPRING.snappy, delay }
                  }
                  style={{
                    transformOrigin: `${anchor.x}px ${anchor.y}px`,
                    transformBox: "fill-box",
                  }}
                >
                  <circle
                    cx={anchor.x}
                    cy={anchor.y}
                    r={18}
                    fill="var(--color-accent)"
                    stroke="var(--color-bg)"
                    strokeWidth={3}
                  />
                  <text
                    x={anchor.x}
                    y={anchor.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="var(--font-mono)"
                    fontSize={16}
                    fontWeight={500}
                    fill="var(--color-bg)"
                  >
                    {s.stop}
                  </text>
                </motion.g>
              );
            })}
          </svg>

          {/* Stop cards — absolutely positioned over the SVG. Coordinates are
              percentage-based so layout scales with the responsive SVG. */}
          {sortedStops.map((s) => {
            const anchor = STOP_ANCHORS[s.stop];
            if (!anchor) return null;
            const delay = stopDelay(s.stop, sortedStops.length);
            const cardX = anchor.x + anchor.cardDx;
            const cardY = anchor.y + anchor.cardDy;
            return (
              <div
                key={`card-${s.id}`}
                style={{
                  position: "absolute",
                  left: `${(cardX / VB_W) * 100}%`,
                  top: `${(cardY / VB_H) * 100}%`,
                  // The card is anchored at its top-left corner. Translation
                  // from the path is already baked into cardDx/cardDy.
                  width: "min(28%, 280px)",
                }}
              >
                <CourseStop
                  number={s.stop}
                  title={s.title}
                  type={s.type}
                  description={s.description}
                  tilt={anchor.tilt}
                  delay={delay + 0.05}
                  reduced={reduced}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ───────────── Mobile / narrow: stacked vertical-timeline ───────────── */}
      <div className="bs-course-outline-stack relative">
        {/* Continuous vertical rule — the rope, simplified. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 18,
            top: 0,
            bottom: 0,
            width: 2,
            background:
              "color-mix(in oklab, var(--color-accent) 30%, var(--color-rule))",
          }}
        />
        <ol
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-md)",
          }}
        >
          {sortedStops.map((s) => {
            const delay = stopDelay(s.stop, sortedStops.length);
            return (
              <li
                key={`stack-${s.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "38px 1fr",
                  gap: "var(--spacing-sm)",
                  alignItems: "start",
                }}
              >
                <motion.div
                  initial={
                    reduced ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }
                  }
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={
                    reduced
                      ? { duration: 0.001 }
                      : { ...SPRING.snappy, delay: 0.08 }
                  }
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    color: "var(--color-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-small)",
                    fontWeight: 500,
                    border: "3px solid var(--color-bg)",
                    // Slight elevation above the vertical rule.
                    position: "relative",
                    zIndex: 1,
                  }}
                  aria-hidden
                >
                  {s.stop}
                </motion.div>
                <CourseStop
                  number={s.stop}
                  title={s.title}
                  type={s.type}
                  description={s.description}
                  delay={delay}
                  reduced={reduced}
                  stacked
                />
              </li>
            );
          })}
        </ol>
      </div>

      {/* Container-query toggle — wide above 720px, stacked below. */}
      <style>{`
        .bs-course-outline {
          container-type: inline-size;
          container-name: course;
        }
        .bs-course-outline-wide { display: none; }
        .bs-course-outline-stack { display: block; }
        @container course (min-width: 720px) {
          .bs-course-outline-wide { display: block; }
          .bs-course-outline-stack { display: none; }
        }
      `}</style>
    </div>
  );
}
