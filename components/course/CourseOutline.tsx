"use client";

/**
 * <CourseOutline> — the hero serpentine timeline for course pages.
 *
 * Pattern: a single winding SVG path drawn with a stacked stroke stack
 * (outer rule outline / dark spine / inner accent wash / dashed stitching),
 * with milestone cards and a numbered marker placed along the path. The
 * path is original geometry; every visual layer obeys lainlog's
 * terracotta-only token palette (DESIGN.md §3).
 *
 * PR #67 rebuild iteration:
 *  - Path simplified from a four-traversal self-intersecting Bezier to a
 *    clean THREE-traversal serpent: top L→R, middle R→L, bottom L→R. No
 *    segment crosses another. Single continuous Bezier; gentle U-turns on
 *    the right and left edges connect the traversals.
 *  - viewBox grew from 1166×716 to 1200×900 — taller canvas gives every
 *    traversal a comfortable horizontal stripe and a card-shaped gap above.
 *  - Numbered-marker anchor coordinates are now derived at mount-time from
 *    `getPointAtLength` on a hidden invisible measurement path. Markers
 *    are mathematically ON the rope, not eyeballed beside it.
 *  - Card placement choreographed by traversal: every card sits ABOVE its
 *    stop, in the gap toward the previous traversal (or the top of canvas).
 *    No card overlaps another card or the rope, by construction.
 *  - Per-stop polaroid tilts removed; cards align cleanly horizontal.
 *  - Decoration count trimmed to 6 and repositioned into genuinely empty
 *    canvas regions.
 *
 * Layers (outer → inner):
 *   1. shadow stroke   — width 84, --color-rule
 *   2. dark spine      — width 80, --color-text
 *   3. inner wash × 5  — width 70, accent 8% → 24% via dash-window stepping
 *   4. stitching       — width 1.5, dashed, drawn in via pathLength
 *
 * Animation:
 *   - On scroll-in (`useInView`, once: true) the stitching pathLength
 *     animates 0 → 1 over a SPRING.dramatic. Markers, decorations, and
 *     stop cards stagger in alongside.
 *   - Reduced-motion: render the final state instantly.
 *
 * Frame-stability (R6): the SVG container has a fixed aspect ratio so the
 * canvas can't reflow during animation. Cards are absolutely positioned
 * relative to the same wrapper.
 *
 * Mobile fallback: at container widths below 720 px the SVG is dropped
 * and a vertical-timeline of stacked CourseStop cards renders instead.
 *
 * One-accent rule: every visual variation is opacity / saturation of
 * --color-accent + neutrals. No new hues (DESIGN.md §3).
 */

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";
import type { CourseSection } from "@/content/courses-manifest";
import { CourseStop } from "./CourseStop";

/**
 * Serpentine path geometry — three clean traversals across a 1200×900
 * canvas. Each traversal is a horizontal stripe at a different y; gentle
 * U-turns on the right and left edges connect them without crossing any
 * earlier stroke.
 *
 *   top traversal     y ≈ 240    (100, 240)  → (1080, 240)       L → R
 *   right U-turn                 (1080, 240) → (1040, 490)
 *   middle traversal  y ≈ 490    (1040, 490) → (120, 490)        R → L
 *   left U-turn                  (120, 490)  → (180, 740)
 *   bottom traversal  y ≈ 740    (180, 740)  → (1100, 740)       L → R
 *
 * The traversals sit ~250 viewBox units apart, leaving each row a
 * card-shaped gap above it (cards live in the gap between this traversal
 * and the previous one — or the canvas top, for stop 1).
 *
 * Mental trace: top stripe, smooth dip down the right edge, middle stripe,
 * smooth dip down the left edge, bottom stripe. No segment crosses another.
 */
const SERPENTINE_D =
  "M 100 240 " +
  "C 320 200, 700 200, 1080 240 " +
  // right-edge U-turn from top to middle (stays right of x=1080)
  "C 1180 260, 1200 400, 1140 460 " +
  "C 1110 485, 1080 490, 1040 490 " +
  // middle traversal R → L
  "C 720 510, 380 470, 120 490 " +
  // left-edge U-turn from middle to bottom (stays left of x=180)
  "C 40 510, 20 660, 80 710 " +
  "C 110 735, 140 740, 180 740 " +
  // bottom traversal L → R
  "C 480 760, 800 760, 1100 740";

/**
 * Inner-wash segmentation. Five sub-paths share `d` and use a normalized
 * `pathLength=100` plus a 20-unit dash window with marching offsets to
 * split the rope into five tonal bands without using an SVG gradient
 * (DESIGN.md §12 ban). The 0.5-unit overlap on each side prevents
 * hairline gaps at seams.
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
 * Anchor placement strategy.
 *
 * Numbered-marker (x, y) coordinates are derived at mount-time via
 * `getPointAtLength` on a hidden measurement path — they're guaranteed to
 * sit ON the rope. The fractions below were chosen for clusters-and-gaps
 * rhythm across the three traversals:
 *
 *   ~0.05  stop 1 — early on top traversal (left)
 *   ~0.18  stop 2 — middle of top traversal
 *   ~0.30  stop 3 — late top traversal (just before the right U-turn)
 *   ~0.50  stop 4 — middle of middle traversal
 *   ~0.62  stop 5 — late middle traversal (just before the left U-turn)
 *   ~0.80  stop 6 — middle of bottom traversal
 *   ~0.96  stop 7 — destination at the right end of bottom traversal
 *
 * Card placement direction is fixed per stop: every card sits ABOVE its
 * marker. With three traversals stacked vertically, this puts each card
 * in the gap toward the PREVIOUS traversal (or the canvas top for stop 1).
 * No card collides with another card or with the rope, by construction.
 *
 * cardDx/cardDy are in viewBox units relative to the marker. The card's
 * top-left corner lands at (anchor.x + cardDx, anchor.y + cardDy).
 */
const STOP_FRACTIONS: Record<number, number> = {
  1: 0.05,
  2: 0.18,
  3: 0.3,
  4: 0.5,
  5: 0.62,
  6: 0.8,
  7: 0.96,
};

type CardOffset = {
  /** Card position offset from marker, in viewBox units. */
  cardDx: number;
  cardDy: number;
};

/**
 * Card offsets per stop — all cards sit ABOVE their marker in the gap
 * toward the previous traversal (or the canvas top for stop 1).
 *
 * cardDx pulls the card horizontally so it doesn't overhang the U-turn
 * or the canvas edge. cardDy is uniform at -200 so every card sits the
 * same distance above its marker.
 *
 * Card width is `min(24%, 280px)` → up to 288 viewBox units; height
 * varies with display size but tops out around 160 viewBox-y units. With
 * these offsets, no card overlaps another or its marker:
 *
 *   stop 1 (top, x≈160)    card x≈70..360,    y≈40..200    [gap to marker 22]
 *   stop 2 (top, x≈580)    card x≈440..730,   y≈40..200
 *   stop 3 (top, x≈970)    card x≈820..1110,  y≈40..200
 *   stop 4 (middle, x≈700) card x≈560..850,   y≈290..450
 *   stop 5 (middle, x≈340) card x≈180..470,   y≈290..450
 *   stop 6 (bottom, x≈580) card x≈420..710,   y≈540..700
 *   stop 7 (bottom, x≈1080) card x≈880..1170, y≈540..700
 *
 * Inter-card horizontal gaps on each traversal: 80–110 viewBox-x units.
 */
const CARD_OFFSETS: Record<number, CardOffset> = {
  // Top traversal — cards above, in y≈40–200 region
  1: { cardDx: -90, cardDy: -200 },
  2: { cardDx: -140, cardDy: -200 },
  3: { cardDx: -150, cardDy: -200 },
  // Middle traversal — cards above, in y≈290–450 region
  4: { cardDx: -140, cardDy: -200 },
  5: { cardDx: -160, cardDy: -200 },
  // Bottom traversal — cards above, in y≈540–700 region
  6: { cardDx: -160, cardDy: -200 },
  7: { cardDx: -200, cardDy: -200 },
};

/**
 * Decorative stickers — terracotta-only flavor placed in genuinely empty
 * canvas regions (not overlapping cards or the rope). Trimmed from 8 to 6.
 *
 * Verified empty zones:
 *   - between stop-1 cards and stop-2 cards (top, between x=200 and x=380)
 *   - upper-right corner above the right U-turn
 *   - middle-row gap between stop-4 card and stop-3 marker right side
 *   - left-edge zone below middle traversal
 *   - bottom-left between bottom-traversal start and stop-6 card area
 *   - bottom-right empty patch below bottom traversal
 */
type DecoKind = "dot-cluster" | "stitch" | "asterisk" | "milestone";
type Deco = {
  id: string;
  kind: DecoKind;
  x: number;
  y: number;
  rot?: number;
  delay: number;
};

const DECORATIONS: Deco[] = [
  // top-row gap between card 1 (ends ~x=360) and card 2 (starts ~x=440)
  { id: "d1", kind: "dot-cluster", x: 400, y: 110, delay: 0.35 },
  // top-row gap between card 2 (ends ~x=730) and card 3 (starts ~x=820)
  { id: "d2", kind: "asterisk", x: 770, y: 100, rot: -10, delay: 0.55 },
  // middle-row gap between card 5 (ends ~x=470) and card 4 (starts ~x=560)
  { id: "d3", kind: "stitch", x: 510, y: 360, rot: 8, delay: 0.75 },
  // middle-row right of card 4, before right U-turn enters this y region
  { id: "d4", kind: "milestone", x: 940, y: 360, delay: 0.95 },
  // bottom-row gap between card 6 (ends ~x=710) and card 7 (starts ~x=880)
  { id: "d5", kind: "dot-cluster", x: 800, y: 600, delay: 1.1 },
  // below the bottom traversal — empty canvas-floor patch
  { id: "d6", kind: "asterisk", x: 600, y: 850, rot: 4, delay: 1.3 },
];

/** viewBox dimensions — kept as constants so aspect ratio stays in sync. */
const VB_W = 1200;
const VB_H = 900;

type Props = {
  outline: CourseSection[];
};

export function CourseOutline({ outline }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const measurePathRef = useRef<SVGPathElement | null>(null);
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
   * Marker coordinates derived from `getPointAtLength` on a hidden
   * measurement path. Computed once at mount; `null` until the layout
   * effect runs. The fallback during the first paint is a small set of
   * approximate coordinates so SSR / first-render aren't blank.
   */
  const [anchors, setAnchors] = useState<Record<number, { x: number; y: number }>>(
    () => {
      // Approximate fallback positions matching the path geometry — used
      // until getPointAtLength runs on the client. These are close to the
      // measured values; the layout effect snaps them to exact-on-path
      // coordinates a tick later.
      return {
        1: { x: 175, y: 230 },
        2: { x: 580, y: 210 },
        3: { x: 970, y: 230 },
        4: { x: 700, y: 490 },
        5: { x: 340, y: 482 },
        6: { x: 580, y: 750 },
        7: { x: 1080, y: 742 },
      };
    }
  );

  useLayoutEffect(() => {
    const path = measurePathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const next: Record<number, { x: number; y: number }> = {};
    for (const [stop, fraction] of Object.entries(STOP_FRACTIONS)) {
      const pt = path.getPointAtLength(fraction * total);
      next[Number(stop)] = { x: pt.x, y: pt.y };
    }
    setAnchors(next);
  }, []);

  /**
   * Stagger the stop reveals so the marker scales in just as the path
   * reaches it. The path tween runs ~1.4s; spread N stops across that
   * window with a small padding so the last stop pops just after the
   * rope finishes.
   */
  const stopDelay = (stop: number, total: number): number => {
    if (total <= 1) return 0.4;
    const t = (stop - 1) / (total - 1); // 0 → 1
    return 0.2 + t * 1.1;
  };

  return (
    <div ref={wrapperRef} className="bs-course-outline">
      {/* ───────────── Desktop / wide: serpentine SVG with cards above each stop ───────────── */}
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
            {/* Hidden measurement path — getPointAtLength reads this once at
                mount to derive marker coordinates. Stroke is invisible. */}
            <path
              ref={measurePathRef}
              d={SERPENTINE_D}
              fill="none"
              stroke="none"
              style={{ pointerEvents: "none" }}
            />

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
            {/* Layer 3 — segmented inner wash (5 sub-paths, accent 8% → 24%) */}
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
              initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
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

            {/* Decorative stickers — terracotta-only flavor, in empty regions */}
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

            {/* Numbered markers — terracotta discs pinned to the rope. Coordinates
                are mathematically ON the path (getPointAtLength). */}
            {sortedStops.map((s) => {
              const anchor = anchors[s.stop];
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
                    reduced ? { duration: 0.001 } : { ...SPRING.snappy, delay }
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

          {/* Stop cards — absolutely positioned over the SVG. cardDx/cardDy are in
              viewBox units, then converted to percentages so cards scale with the
              responsive aspect-ratio container. */}
          {sortedStops.map((s) => {
            const anchor = anchors[s.stop];
            const offset = CARD_OFFSETS[s.stop];
            if (!anchor || !offset) return null;
            const delay = stopDelay(s.stop, sortedStops.length);
            const cardX = anchor.x + offset.cardDx;
            const cardY = anchor.y + offset.cardDy;
            return (
              <div
                key={`card-${s.id}`}
                style={{
                  position: "absolute",
                  left: `${(cardX / VB_W) * 100}%`,
                  top: `${(cardY / VB_H) * 100}%`,
                  width: "min(24%, 280px)",
                }}
              >
                <CourseStop
                  number={s.stop}
                  title={s.title}
                  type={s.type}
                  description={s.description}
                  icon={s.icon}
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
    return (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <circle cx={-8} cy={4} r={3.5} fill={accent} />
        <circle cx={6} cy={6} r={2.5} fill={accent} />
        <circle cx={0} cy={-6} r={2} fill={accent} opacity={0.7} />
      </g>
    );
  }
  if (kind === "stitch") {
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
        <path d="M 0 -5 L 5 0 L 0 5 L -5 0 Z" fill={accent} />
      </g>
    );
  }
  return null;
}
