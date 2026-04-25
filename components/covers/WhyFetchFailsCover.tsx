"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * WhyFetchFailsCover — browser window where a `fetch()` request hits CORS.
 *
 * Concept (research/animated-covers-redesign/concepts-v2.md §2):
 * The article teaches that same-origin policy lives in the browser, not the
 * network. The cover renders a literal browser scene: chrome with traffic
 * dots + URL bar, content stubs, and a terracotta packet flying across the
 * viewport into a hatched wall, bouncing back, fading. Wall never moves.
 *
 * Composition (~64 elements):
 *  - Background (~9): faint network grid hairlines.
 *  - Mid-ground (~38): browser outline + chrome bar + 3 traffic dots + URL
 *    bar + 5 URL stubs + 6 content stubs + 8 hatched-wall strokes.
 *  - Foreground (~17): packet + 5-dot trail + bounce-back arc.
 *
 * Motion (DESIGN.md §9):
 *  - Primary (3.5s loop, continuous): packet x flies left→wall, scale-impact,
 *    elastic return, fade. Trail dots follow with stagger. No idle gaps.
 *  - Secondary: hatched wall strokes pulse opacity 0.5↔0.85 on a 3s offset;
 *    URL bar stubs oscillate.
 *  - Hover: hatch lines saturate (alive boundary).
 *
 * Frame-stability R6: x / opacity / scale / pathLength only. Tokens-only.
 *
 * Path-data shape vocabulary derived from Phosphor (MIT) browser/window icons.
 */
export function WhyFetchFailsCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Network grid hairlines (background).
  const hHairlines = [30, 60, 100, 140, 170];
  const vHairlines = [30, 80, 130, 180];

  // Content stubs inside browser body.
  const contentStubs = [
    { x: 36, y: 80, w: 90 },
    { x: 36, y: 90, w: 110 },
    { x: 36, y: 100, w: 78 },
    { x: 36, y: 110, w: 100 },
    { x: 36, y: 120, w: 88 },
    { x: 36, y: 130, w: 60 },
  ];

  return (
    <g>
      {/* ─── Background: network grid hairlines ─────────────── */}
      {hHairlines.map((y) => (
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={200}
          y2={y}
          stroke="var(--color-text-muted)"
          strokeWidth={0.6}
          opacity={0.15}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {vHairlines.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={200}
          stroke="var(--color-text-muted)"
          strokeWidth={0.6}
          opacity={0.15}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* ─── Mid-ground: browser window outline ──────────────── */}
      <rect
        x={28}
        y={50}
        width={140}
        height={100}
        rx={6}
        fill="var(--color-surface)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.8}
        vectorEffect="non-scaling-stroke"
      />

      {/* Browser chrome bar (top strip) */}
      <rect
        x={28}
        y={50}
        width={140}
        height={16}
        rx={6}
        fill="var(--color-text-muted)"
        opacity={0.12}
      />
      {/* Chrome bottom edge */}
      <line
        x1={28}
        y1={66}
        x2={168}
        y2={66}
        stroke="var(--color-text-muted)"
        strokeWidth={0.8}
        opacity={0.4}
        vectorEffect="non-scaling-stroke"
      />

      {/* 3 traffic-light dots (kept muted grey to avoid §12.1 carve-out) */}
      <circle cx={36} cy={58} r={2.4} fill="var(--color-text-muted)" opacity={0.7} />
      <circle cx={43} cy={58} r={2.4} fill="var(--color-text-muted)" opacity={0.55} />
      <circle cx={50} cy={58} r={2.4} fill="var(--color-text-muted)" opacity={0.4} />

      {/* URL bar */}
      <rect
        x={62}
        y={54}
        width={96}
        height={9}
        rx={2}
        fill="var(--color-text-muted)"
        opacity={0.18}
      />
      {/* URL stub-text inside URL bar */}
      {[64, 72, 84, 96, 110].map((x, i) => (
        <motion.rect
          key={`url-${i}`}
          x={x}
          y={57}
          width={i === 4 ? 30 : 5 + (i % 3)}
          height={2}
          rx={0.8}
          fill="var(--color-text-muted)"
          initial={{ opacity: 0.55 }}
          animate={animate ? { opacity: [0.5, 0.7, 0.5] } : { opacity: 0.55 }}
          transition={
            animate
              ? { duration: 2.5, delay: i * 0.1, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        />
      ))}

      {/* Content stubs (page body) */}
      {contentStubs.map((s, i) => (
        <rect
          key={`stub-${i}`}
          x={s.x}
          y={s.y}
          width={s.w}
          height={2}
          rx={1}
          fill="var(--color-text-muted)"
          opacity={0.45}
        />
      ))}

      {/* ─── Mid-ground: hatched CORS wall (right side) ───────── */}
      {/* Wall vertical baseline */}
      <line
        x1={170}
        y1={50}
        x2={170}
        y2={150}
        stroke="var(--color-text-muted)"
        strokeWidth={1.6}
        opacity={0.7}
        vectorEffect="non-scaling-stroke"
      />
      {/* 8 diagonal hatch strokes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.line
          key={`hatch-${i}`}
          x1={170}
          y1={56 + i * 12}
          x2={184}
          y2={50 + i * 12}
          stroke="var(--color-text-muted)"
          strokeWidth={1.4}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0.7 }}
          animate={animate ? { opacity: [0.5, 0.85, 0.5] } : { opacity: 0.7 }}
          transition={
            animate
              ? {
                  duration: 3,
                  delay: i * 0.12,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
          whileHover={{ opacity: 1 }}
        />
      ))}

      {/* ─── Foreground: trail dots (5, fading comet) ─────────── */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.circle
          key={`trail-${i}`}
          cy={100}
          r={2 - i * 0.25}
          fill="var(--color-accent)"
          initial={{ cx: 50, opacity: 0 }}
          animate={
            animate
              ? {
                  cx: [50, 168, 168, 50, 50],
                  opacity: [
                    0.6 - i * 0.1,
                    0.6 - i * 0.1,
                    0,
                    0.4 - i * 0.07,
                    0.6 - i * 0.1,
                  ],
                }
              : { cx: 168 - i * 4, opacity: 0.5 - i * 0.08 }
          }
          transition={
            animate
              ? {
                  duration: 3.5,
                  delay: i * 0.06,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.34, 0.42, 0.74, 1],
                }
              : undefined
          }
        />
      ))}

      {/* ─── Foreground: request packet (load-bearing) ────────── */}
      <motion.rect
        width={9}
        height={9}
        rx={2}
        fill="var(--color-accent)"
        y={95.5}
        initial={{ x: 46, scale: 1, opacity: 1 }}
        animate={
          animate
            ? {
                x: [46, 162, 162, 46, 46],
                scale: [1, 1, 0.7, 1, 1],
                opacity: [1, 1, 0.4, 1, 1],
              }
            : { x: 158, scale: 1, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 3.5,
                repeat: Infinity,
                ease: [0.42, 0, 0.58, 1],
                times: [0, 0.34, 0.42, 0.85, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "center", transformBox: "fill-box" as const }}
      />

      {/* ─── Foreground: bounce-back arc (subtle dashed) ─────── */}
      <motion.path
        d="M 50 100 Q 110 78, 168 100"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeDasharray="2 4"
        opacity={0.35}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={animate ? { pathLength: [0, 1, 1, 0] } : { pathLength: 1 }}
        transition={
          animate
            ? {
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.4, 0.7, 1],
              }
            : undefined
        }
      />
    </g>
  );
}
