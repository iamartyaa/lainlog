"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * HowGmailCover — Gmail-style email-input scene at the moment of validation.
 *
 * Concept (research/animated-covers-redesign/concepts-v2.md §1):
 * The article teaches the silence-then-verdict cadence — the user types, then
 * ~300ms of network silence, then a terracotta verdict. The cover renders
 * that scene continuously: typing beat + signal lines arcing toward an
 * off-canvas server + verdict ring pulsing on a 3s loop.
 *
 * Composition (~52 elements):
 *  - Background: faint dot grid (12) suggesting form-context.
 *  - Mid-ground: form-label stubs (4), input field rounded rect, typed-text
 *    glyph stubs (8), caret, status row stub, 3 signal-line arcs.
 *  - Foreground: verdict ring + check path + 4 micro-sparkles + 2 ghost stubs.
 *
 * Motion (DESIGN.md §9):
 *  - Primary (3s loop, continuous): caret blink + signal-line dashes flowing
 *    + verdict ring scale-pulse + check pathLength draw.
 *  - Secondary: typed-text glyph stubs subtle opacity flicker on 3s offset.
 *  - Hover (@media hover:hover): verdict ring scales to 1.08 and brightens.
 *
 * Frame-stability R6: only opacity / scale / pathLength / cx animate. The
 * 200×200 viewBox never resizes. Tokens-only: --color-accent + muted + text + surface.
 *
 * Path data sourced from Heroicons (MIT) — check icon path is a tiny
 * polyline; recreated as SVG path string from icon shape vocabulary.
 */
export function HowGmailCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Background dot grid — 4×3 dots in upper-left.
  const dots = [];
  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      dots.push({ cx: 24 + i * 32, cy: 24 + j * 18, key: `dot-${i}-${j}` });
    }
  }

  // Typed-text glyph stubs — 8 short verticals inside the input field.
  const glyphs = [];
  for (let i = 0; i < 8; i += 1) {
    glyphs.push({ x: 60 + i * 6, key: `glyph-${i}` });
  }

  return (
    <g>
      {/* ─── Background: faint dot grid ─────────────────── */}
      {dots.map((d) => (
        <motion.circle
          key={d.key}
          cx={d.cx}
          cy={d.cy}
          r={1.2}
          fill="var(--color-text-muted)"
          initial={{ opacity: 0.2 }}
          animate={animate ? { opacity: [0.2, 0.32, 0.2] } : { opacity: 0.25 }}
          transition={
            animate
              ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        />
      ))}

      {/* ─── Mid-ground: form label stubs (above input) ─── */}
      <rect x={50} y={66} width={28} height={2.2} rx={1.1} fill="var(--color-text-muted)" opacity={0.5} />
      <rect x={82} y={66} width={18} height={2.2} rx={1.1} fill="var(--color-text-muted)" opacity={0.5} />
      <rect x={50} y={72} width={40} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.4} />

      {/* ─── Mid-ground: input field rounded rect ─────── */}
      <rect
        x={50}
        y={84}
        width={110}
        height={28}
        rx={5}
        fill="var(--color-surface)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.8}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Mid-ground: typed-text glyph stubs ───────── */}
      <g>
        {glyphs.map((g, i) => (
          <motion.rect
            key={g.key}
            x={g.x}
            y={94}
            width={1.6}
            height={8}
            rx={0.6}
            fill="var(--color-text)"
            initial={{ opacity: 0.6 }}
            animate={
              animate
                ? { opacity: [0.5, 0.85, 0.5] }
                : { opacity: 0.7 }
            }
            transition={
              animate
                ? {
                    duration: 3,
                    delay: i * 0.08,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
                : undefined
            }
          />
        ))}
      </g>

      {/* ─── Mid-ground: caret (blinking) ─────────────── */}
      <motion.line
        x1={111}
        y1={92}
        x2={111}
        y2={104}
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 1 }}
        animate={animate ? { opacity: [1, 1, 0, 0, 1] } : { opacity: 1 }}
        transition={
          animate
            ? {
                duration: 1,
                repeat: Infinity,
                times: [0, 0.45, 0.5, 0.95, 1],
                ease: "linear",
              }
            : undefined
        }
      />

      {/* ─── Mid-ground: status row stub below input ─── */}
      <rect x={50} y={120} width={64} height={1.8} rx={0.9} fill="var(--color-text-muted)" opacity={0.35} />

      {/* ─── Mid-ground: signal lines arcing toward server (off-canvas right) ─── */}
      {[0, 1, 2].map((i) => (
        <motion.path
          key={`signal-${i}`}
          d={`M 160 ${94 + i * 4} Q 184 ${94 + i * 4 - 6}, 200 ${88 + i * 6}`}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={
            animate
              ? {
                  pathLength: [0, 1, 1, 0],
                  opacity: [0.2, 0.85, 0.85, 0.2],
                }
              : { pathLength: 1, opacity: 0.4 }
          }
          transition={
            animate
              ? {
                  duration: 3,
                  delay: i * 0.18,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.35, 0.65, 1],
                }
              : undefined
          }
        />
      ))}

      {/* ─── Foreground: verdict ring + check (right of input) ─── */}
      <motion.g
        style={{ transformOrigin: "150px 98px", transformBox: "fill-box" as const }}
        initial={{ scale: 1 }}
        animate={animate ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={
          animate
            ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        whileHover={{ scale: 1.08 }}
      >
        <motion.circle
          cx={150}
          cy={98}
          r={9}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0.9 }}
          animate={animate ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
          transition={
            animate
              ? { duration: 3, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        />
        <motion.path
          d="M 145.5 98 L 149 101.5 L 154.5 95"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 1, opacity: 1 }}
          animate={
            animate
              ? { pathLength: [0.4, 1, 1, 0.4], opacity: [0.6, 1, 1, 0.6] }
              : { pathLength: 1, opacity: 1 }
          }
          transition={
            animate
              ? {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.35, 0.7, 1],
                }
              : undefined
          }
        />
      </motion.g>

      {/* ─── Foreground: 4 micro-sparkle ticks around verdict ring ─── */}
      {[
        { x1: 150, y1: 86, x2: 150, y2: 88.5 },
        { x1: 150, y1: 110, x2: 150, y2: 107.5 },
        { x1: 138, y1: 98, x2: 140.5, y2: 98 },
        { x1: 162, y1: 98, x2: 159.5, y2: 98 },
      ].map((t, i) => (
        <motion.line
          key={`spark-${i}`}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="var(--color-accent)"
          strokeWidth={1.2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0.4 }}
          animate={animate ? { opacity: [0.2, 0.7, 0.2] } : { opacity: 0.5 }}
          transition={
            animate
              ? {
                  duration: 3,
                  delay: 0.4 + i * 0.06,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
        />
      ))}

      {/* ─── Foreground: 2 ghost-stubs of "available" message below input ─── */}
      <motion.rect
        x={50}
        y={132}
        width={28}
        height={1.6}
        rx={0.8}
        fill="var(--color-accent)"
        initial={{ opacity: 0.2 }}
        animate={animate ? { opacity: [0.1, 0.35, 0.1] } : { opacity: 0.3 }}
        transition={
          animate
            ? { duration: 3, delay: 1.2, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />
      <motion.rect
        x={82}
        y={132}
        width={20}
        height={1.6}
        rx={0.8}
        fill="var(--color-accent)"
        initial={{ opacity: 0.18 }}
        animate={animate ? { opacity: [0.08, 0.3, 0.08] } : { opacity: 0.25 }}
        transition={
          animate
            ? { duration: 3, delay: 1.4, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      />
    </g>
  );
}
