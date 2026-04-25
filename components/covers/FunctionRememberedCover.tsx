"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * FunctionRememberedCover — closure: nested function frames + captured value + memory tether.
 *
 * Concept (research/animated-covers-redesign/concepts-v2.md §4):
 * The article teaches closure — the inner function holds a reference to a
 * value from the outer scope, even after the outer scope has "returned".
 * The cover renders three nested function-frames; the OUTER frame fades
 * (scope returning), the captured value (terracotta) and tether persist.
 *
 * Composition (~50 elements):
 *  - Background (~8): faint cross-hatch in lower-right.
 *  - Mid-ground (~28): three nested frames + label stubs + content stubs.
 *  - Foreground (~14): captured value + tether + memory dots flowing +
 *    accent ring + 4 sparkle ticks.
 *
 * Motion (DESIGN.md §9):
 *  - Primary (3.5s loop, continuous): outer-frame opacity drifts
 *    1.0 → 0.4 → 1.0; memory dots flow along tether from outer→inner.
 *  - Secondary: captured-value ring scale-pulse; sparkle-tick opacity oscillation.
 *  - Hover: tether thickens.
 *
 * Frame-stability R6: opacity / scale / cx / cy only. Tokens-only.
 *
 * Path-data shape vocabulary derived from Phosphor (MIT) bracket/code icons.
 */
export function FunctionRememberedCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // 4 memory dots flowing along the tether path. Tether goes from outer
  // captured-value (at ~150,150) inward toward inner frame (at ~100,100).
  const memoryDots = [0, 1, 2, 3];

  return (
    <g>
      {/* ─── Background: faint cross-hatch (lower-right) ──── */}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`hatch-${i}`}
          x1={150 + i * 8}
          y1={170}
          x2={170 + i * 8}
          y2={150}
          stroke="var(--color-text-muted)"
          strokeWidth={0.7}
          opacity={0.15}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`hatch-b-${i}`}
          x1={20 + i * 6}
          y1={36}
          x2={32 + i * 6}
          y2={24}
          stroke="var(--color-text-muted)"
          strokeWidth={0.7}
          opacity={0.12}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* ─── Mid-ground: outer function frame ─────────────── */}
      <motion.g
        initial={{ opacity: 1 }}
        animate={animate ? { opacity: [1, 0.4, 1] } : { opacity: 0.55 }}
        transition={
          animate
            ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        <rect
          x={20}
          y={20}
          width={160}
          height={160}
          rx={6}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        {/* Outer frame label: function outer() — text-stubs at top-left */}
        <rect x={28} y={28} width={14} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        <rect x={45} y={28} width={20} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        <rect x={68} y={28} width={6} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        {/* Outer content stubs */}
        <rect x={28} y={36} width={50} height={1.6} rx={0.8} fill="var(--color-text-muted)" opacity={0.4} />
        <rect x={28} y={42} width={36} height={1.6} rx={0.8} fill="var(--color-text-muted)" opacity={0.4} />
        <rect x={28} y={170} width={6} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.6} />
      </motion.g>

      {/* ─── Mid-ground: middle function frame ────────────── */}
      <motion.g
        initial={{ opacity: 0.85 }}
        animate={animate ? { opacity: [0.85, 0.7, 0.85] } : { opacity: 0.78 }}
        transition={
          animate
            ? { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        <rect
          x={45}
          y={50}
          width={110}
          height={110}
          rx={5}
          fill="var(--color-surface)"
          fillOpacity={0.5}
          stroke="var(--color-text-muted)"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        {/* Middle label */}
        <rect x={52} y={58} width={12} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        <rect x={66} y={58} width={20} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        <rect x={89} y={58} width={6} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        {/* Middle content stubs */}
        <rect x={52} y={66} width={42} height={1.6} rx={0.8} fill="var(--color-text-muted)" opacity={0.45} />
        <rect x={52} y={72} width={28} height={1.6} rx={0.8} fill="var(--color-text-muted)" opacity={0.45} />
      </motion.g>

      {/* ─── Mid-ground: inner function frame (always bright) ─── */}
      <g>
        <rect
          x={70}
          y={80}
          width={60}
          height={60}
          rx={4}
          fill="var(--color-surface)"
          fillOpacity={0.7}
          stroke="var(--color-text-muted)"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        {/* Inner label */}
        <rect x={76} y={86} width={10} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.85} />
        <rect x={88} y={86} width={16} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.85} />
        <rect x={107} y={86} width={5} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.85} />
        {/* Inner content stub */}
        <rect x={76} y={94} width={32} height={1.6} rx={0.8} fill="var(--color-text-muted)" opacity={0.6} />
      </g>

      {/* ─── Foreground: memory tether (curve from outer corner → inner) ─── */}
      <motion.path
        d="M 150 150 Q 130 130, 110 110"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 1 }}
        animate={animate ? { pathLength: [0.92, 1, 0.92] } : { pathLength: 1 }}
        transition={
          animate
            ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        whileHover={{ strokeWidth: 2 }}
      />

      {/* ─── Foreground: memory dots flowing along tether ─── */}
      {memoryDots.map((i) => {
        // Approximate quadratic Bezier sampling along (150,150)→(130,130)→(110,110)
        // We'll just animate them along a straight diagonal — close enough at 64×64 thumbnail.
        return (
          <motion.circle
            key={`mem-${i}`}
            r={1.6}
            fill="var(--color-accent)"
            initial={{ cx: 150, cy: 150, opacity: 0 }}
            animate={
              animate
                ? {
                    cx: [150, 110],
                    cy: [150, 110],
                    opacity: [0, 0.9, 0.9, 0],
                  }
                : {
                    cx: 130 - i * 6,
                    cy: 130 - i * 6,
                    opacity: 0.7,
                  }
            }
            transition={
              animate
                ? {
                    duration: 2,
                    delay: (i * 2) / memoryDots.length,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.15, 0.85, 1],
                  }
                : undefined
            }
          />
        );
      })}

      {/* ─── Foreground: captured value (terracotta dot in outer corner) ─── */}
      <circle cx={150} cy={150} r={5} fill="var(--color-accent)" />

      {/* Accent ring around captured value — scale-pulse */}
      <motion.circle
        cx={150}
        cy={150}
        r={7}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        opacity={0.7}
        vectorEffect="non-scaling-stroke"
        initial={{ scale: 1 }}
        animate={animate ? { scale: [1, 1.2, 1], opacity: [0.7, 0.4, 0.7] } : { scale: 1.1, opacity: 0.55 }}
        transition={
          animate
            ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
        style={{ transformOrigin: "150px 150px", transformBox: "fill-box" as const }}
      />

      {/* ─── Foreground: 4 sparkle ticks at inner-frame corners ─── */}
      {[
        { x: 70, y: 80 },
        { x: 130, y: 80 },
        { x: 70, y: 140 },
        { x: 130, y: 140 },
      ].map((p, i) => (
        <motion.circle
          key={`spark-${i}`}
          cx={p.x}
          cy={p.y}
          r={1.4}
          fill="var(--color-accent)"
          initial={{ opacity: 0.6 }}
          animate={animate ? { opacity: [0.4, 0.8, 0.4] } : { opacity: 0.7 }}
          transition={
            animate
              ? {
                  duration: 2,
                  delay: i * 0.18,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : undefined
          }
        />
      ))}
    </g>
  );
}
