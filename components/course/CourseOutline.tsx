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
 * PR #67 enrichment iteration:
 *  - Path redrawn for FOUR traversals (left→right→left→right→end) instead
 *    of the original two-traversal S-curve. Same viewBox 1166×716, same
 *    four-layer stroke stack.
 *  - Inner-wash layer is split into 5 sub-paths with progressive accent
 *    opacity (8% → 24%) so the rope's interior reads as having tonal
 *    progression along its length. No SVG gradient (DESIGN.md §12 ban) —
 *    discrete steps via strokeDasharray on a normalized pathLength.
 *  - Decorative scatter elements (terracotta dots, hash-stitches, asterisk
 *    glyphs) sprinkled at ~8 hand-tuned positions between stops.
 *  - Stops re-anchored for clusters-and-gaps rhythm rather than even
 *    metronome spacing. Cards now tier-coded (size + border + wash) by
 *    section type.
 *
 * Layers (outer → inner):
 *   1. shadow stroke   — width 84, --color-rule (soft beige outline)
 *   2. dark spine      — width 80, --color-text  (the rope's body)
 *   3. inner wash × 5  — width 70, segmented accent 8% → 24%
 *   4. stitching       — width 1.5, dashed (2.01 / 80.58), text-muted
 *
 * Animation:
 *   - On first scroll-in (`useInView`, once: true) the stitching pathLength
 *     animates 0 → 1 over a single SPRING.dramatic spring. Numbered
 *     markers, decorations, and stop cards stagger in alongside.
 *   - Reduced-motion: render the final state instantly. No rAF, no tween.
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
 * autonomous animations do NOT call `playSound`). Audio is intentionally
 * not wired here — the rope draw is scroll-driven, hence autonomous.
 */

import { useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";
import type { CourseSection } from "@/content/courses-manifest";
import { CourseStop } from "./CourseStop";

/**
 * Serpentine path geometry — four traversals across the canvas.
 *
 *   1. (80, 660) → (760, 660)        bottom sweep, L → R
 *   2. (760, 660) → (1080, 420)      right edge, climbing
 *   3. (1080, 420) → (100, 380)      across to far left, R → L
 *   4. (100, 380) → (220, 180)       left edge loop
 *   5. (220, 180) → (920, 200)       upper sweep, L → R
 *   6. (920, 200) → (980, 80)        right edge, climbing
 *   7. (980, 80) → (360, 90)         top, R → L
 *   8. (360, 90) → (100, 140)        finish at top-left
 *
 * One continuous Bezier curve. SAFE TO EDIT, but anchors below depend on
 * this geometry. If reshaped, recompute STOP_ANCHORS using a path-sample
 * tool.
 */
const SERPENTINE_D =
  "M 80 660 C 280 700, 540 700, 760 660 C 980 620, 1100 540, 1080 420 C 1060 320, 880 280, 660 320 C 440 360, 280 380, 100 380 C -40 380, -20 200, 220 180 C 460 160, 700 200, 920 200 C 1080 200, 1140 120, 980 80 C 820 40, 540 60, 360 90 C 220 110, 140 130, 100 140";

/**
 * Inner-wash segmentation. Each segment renders one fifth of the path with
 * a progressively deeper terracotta wash, creating tonal depth along the
 * rope without using an SVG gradient (DESIGN.md §12).
 *
 * Implementation trick: every sub-path shares the same `d`, but each one
 * sets `pathLength={100}` to normalize the stroke metric, then uses a
 * `strokeDasharray="20 80"` + a negative `strokeDashoffset` to make only
 * its 20-unit window visible. The five negative offsets (0, -20, -40, -60,
 * -80) march the visible window along the rope.
 *
 * 0.5 unit overlap on each end of the dash window prevents hairline gaps
 * between adjacent segments at the seams.
 */
type WashSegment = {
  /** opacity of var(--color-accent) in color-mix, 0–100 */
  pct: number;
  /** strokeDashoffset (negative) — shifts the visible 20u window */
  offset: number;
};
const WASH_SEGMENTS: WashSegment[] = [
  { pct: 8, offset: 0 },
  { pct: 12, offset: -20 },
  { pct: 16, offset: -40 },
  { pct: 20, offset: -60 },
  { pct: 24, offset: -80 },
];

/**
 * Anchor coordinates for each stop in viewBox units. These were chosen
 * along the new four-traversal path to give a clusters-and-gaps rhythm:
 *
 *   - 1, 2  cluster on the bottom sweep (intro phase)
 *   - 3, 4  cluster on the right-side descent (core mechanics)
 *   - 5, 6  cluster on the upper-right sweep (applied phase)
 *   - 7     alone at the top-left (the destination)
 *
 * `cardDx/cardDy` shifts the card from the anchor in viewBox units so the
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
  // intro cluster — bottom sweep
  1: { x: 250, y: 686, cardDx: -150, cardDy: -190, tilt: -2 },
  2: { x: 560, y: 690, cardDx: 30, cardDy: -200, tilt: 2 },
  // core mechanics cluster — right-side descent and turnaround
  3: { x: 970, y: 470, cardDx: -250, cardDy: -200, tilt: -1 },
  4: { x: 660, y: 320, cardDx: -50, cardDy: 50, tilt: 1 },
  // applied cluster — upper-right sweep
  5: { x: 720, y: 195, cardDx: -260, cardDy: 60, tilt: -1 },
  6: { x: 970, y: 130, cardDx: -250, cardDy: -110, tilt: 2 },
  // destination — top-left
  7: { x: 220, y: 105, cardDx: 50, cardDy: 30, tilt: -1 },
};

/**
 * Decorative stickers / scatter elements. Terracotta-only, hand-positioned
 * at quiet spots along the rope so they don't collide with cards. Drawn
 * inside the SVG so they share viewBox coordinates and scale with the rope.
 *
 * Each entry produces a small motion.g that fades in alongside the rope
 * draw via whileInView. Reduced-motion: rendered in final state.
 */
type DecoKind = "dot-cluster" | "stitch" | "asterisk" | "milestone";
type Deco = {
  id: string;
  kind: DecoKind;
  x: number;
  y: number;
  /** Rotation in degrees (used by stitch / asterisk). */
  rot?: number;
  /** Stagger delay seconds. */
  delay: number;
};

const DECORATIONS: Deco[] = [
  // sit between stops 1 and 2, above the bottom sweep
  { id: "d1", kind: "dot-cluster", x: 410, y: 660, delay: 0.35 },
  // big leap — between 2 and 3, just past the bottom-right turn
  { id: "d2", kind: "asterisk", x: 1060, y: 540, rot: 8, delay: 0.55 },
  // milestone marker between core-mechanics cluster and the loop
  { id: "d3", kind: "milestone", x: 380, y: 358, delay: 0.75 },
  // hash-stitch on the left-side loop
  { id: "d4", kind: "stitch", x: 30, y: 290, rot: 70, delay: 0.85 },
  // dot cluster on the upper sweep
  { id: "d5", kind: "dot-cluster", x: 470, y: 188, delay: 1.05 },
  // asterisk near the top-right turn
  { id: "d6", kind: "asterisk", x: 1080, y: 125, rot: -12, delay: 1.2 },
  // hash-stitch on the long top traverse, between 6 and 7
  { id: "d7", kind: "stitch", x: 600, y: 60, rot: 0, delay: 1.4 },
  // tiny dot trio just before the final stop
  { id: "d8", kind: "dot-cluster", x: 290, y: 110, delay: 1.55 },
];

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
            {/* Layer 3 — segmented inner wash (5 sub-paths, progressive accent
                opacity 8% → 24%). Each sub-path renders one fifth of the rope
                via a normalized pathLength=100 + 20-unit dash window. */}
            {WASH_SEGMENTS.map((seg) => (
              <path
                key={`wash-${seg.pct}`}
                d={SERPENTINE_D}
                fill="none"
                stroke={`color-mix(in oklab, var(--color-accent) ${seg.pct}%, var(--color-surface))`}
                strokeWidth={70}
                strokeMiterlimit={10}
                strokeLinecap="butt"
                pathLength={100}
                // 0.5 unit overlap on each side of the 20u window prevents
                // hairline gaps at the seams between adjacent segments.
                strokeDasharray="20.5 79.5"
                strokeDashoffset={seg.offset}
              />
            ))}
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

            {/* Decorative stickers — fade in as the rope draws. Pure SVG so
                they share viewBox coordinates with the rope and scale
                consistently. Hand-tuned positions, terracotta-only. */}
            {DECORATIONS.map((d) => (
              <motion.g
                key={d.id}
                initial={
                  reduced ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }
                }
                animate={
                  reduced
                    ? { opacity: 1, scale: 1 }
                    : inView
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0, scale: 0.7 }
                }
                transition={
                  reduced
                    ? { duration: 0.001 }
                    : { ...SPRING.gentle, delay: d.delay }
                }
                style={{
                  transformOrigin: `${d.x}px ${d.y}px`,
                  transformBox: "fill-box",
                }}
              >
                <Decoration kind={d.kind} x={d.x} y={d.y} rot={d.rot ?? 0} />
              </motion.g>
            ))}

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
                  width: "min(28%, 320px)",
                }}
              >
                <CourseStop
                  number={s.stop}
                  title={s.title}
                  type={s.type}
                  description={s.description}
                  icon={s.icon}
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
                  icon={s.icon}
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

/**
 * Decorative-sticker primitives. Each one is a small terracotta-monochrome
 * SVG fragment positioned at (x, y) in viewBox units. Drawn only as flavor:
 * dots, hash-stitches, asterisks, and a tiny "milestone" diamond.
 */
function Decoration({
  kind,
  x,
  y,
  rot,
}: {
  kind: DecoKind;
  x: number;
  y: number;
  rot: number;
}) {
  const accent = "var(--color-accent)";
  const muted = "var(--color-text-muted)";

  if (kind === "dot-cluster") {
    // Three dots arranged in a small triangle.
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <circle cx={-8} cy={4} r={3.5} fill={accent} />
        <circle cx={6} cy={6} r={2.5} fill={accent} />
        <circle cx={0} cy={-6} r={2} fill={accent} opacity={0.7} />
      </g>
    );
  }
  if (kind === "stitch") {
    // Three short hash-marks, perpendicular to the rope at this position.
    return (
      <g
        transform={`translate(${x} ${y}) rotate(${rot})`}
        stroke={accent}
        strokeWidth={2}
        strokeLinecap="round"
      >
        <line x1={-12} y1={0} x2={-12} y2={10} />
        <line x1={0} y1={0} x2={0} y2={12} />
        <line x1={12} y1={0} x2={12} y2={10} />
      </g>
    );
  }
  if (kind === "asterisk") {
    // 6-pointed asterisk — like a small printed glyph.
    return (
      <g
        transform={`translate(${x} ${y}) rotate(${rot})`}
        stroke={accent}
        strokeWidth={1.6}
        strokeLinecap="round"
      >
        <line x1={-9} y1={0} x2={9} y2={0} />
        <line x1={-4.5} y1={-7.8} x2={4.5} y2={7.8} />
        <line x1={4.5} y1={-7.8} x2={-4.5} y2={7.8} />
      </g>
    );
  }
  if (kind === "milestone") {
    // A tiny diamond + ring — feels like a numbered checkpoint marker.
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <circle
          cx={0}
          cy={0}
          r={9}
          fill="none"
          stroke={muted}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
        <path
          d="M 0 -5 L 5 0 L 0 5 L -5 0 Z"
          fill={accent}
        />
      </g>
    );
  }
  return null;
}
