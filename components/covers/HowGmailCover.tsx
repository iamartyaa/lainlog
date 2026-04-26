"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * HowGmailCover — bloom filter: an email pulse hashes into 3 lit cells, verdict tick.
 *
 * v4 concept (one sentence — user-specified hero):
 *   An input pulse fans through 3 hash arcs into a bit-array; 3 cells light
 *   terracotta in sequence, then a verdict tick confirms — "yes, taken."
 *
 * Composition (~14 elements):
 *  1. Input bubble (rounded-rect at top with cursor stub)
 *  2. Input pulse dot (terracotta, emits at start of each cycle)
 *  3-5. Three hash arcs (curved bezier paths fanning out, animated pathLength)
 *  6-17. Twelve bit-array cells (rounded-rects in a row at bottom; 3 light up)
 *  18. Verdict tick (terracotta ✓ that draws after the 3rd cell lights)
 *
 * Note: total motion-bearing elements ≈ 14 (the 12 cells share one map). The
 *  3 lit cells are the load-bearing accent moments.
 *
 * Motion (DESIGN.md §9):
 *  - 5s loop with ~1s idle gap. /overdrive applied — this is the hero.
 *  - Phase 1 (0–0.18): input bubble pulses, pulse dot emits and shrinks.
 *  - Phase 2 (0.18–0.55): 3 hash arcs draw simultaneously (pathLength 0→1).
 *  - Phase 3 (0.55–0.78): cells 2, 6, 9 flip neutral→terracotta in sequence
 *    (100ms apart), each with a brief scale pop.
 *  - Phase 4 (0.78–0.92): verdict tick draws (pathLength 0→1) + tiny spark.
 *  - Phase 5 (0.92–1): hold then reset.
 *
 * Frame-stability R6: opacity / scale / pathLength only. Tokens-only.
 *
 * Reduced-motion end-state: 3 cells lit terracotta, verdict tick visible.
 */
export function HowGmailCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Bit-array geometry: 12 cells in a row at y=148.
  const cellCount = 12;
  const cellW = 12;
  const cellH = 16;
  const cellGap = 2;
  const arrayW = cellCount * cellW + (cellCount - 1) * cellGap;
  const arrayX = (200 - arrayW) / 2; // center horizontally
  const arrayY = 140;

  const cells = Array.from({ length: cellCount }, (_, i) => ({
    x: arrayX + i * (cellW + cellGap),
    y: arrayY,
    lit: i === 1 || i === 5 || i === 9, // 3 hash destinations
  }));

  // Hash arc end-x for the 3 lit cells (centers).
  const litCenters = cells
    .filter((c) => c.lit)
    .map((c) => c.x + cellW / 2);

  // Input bubble origin (bottom-center of bubble).
  const inputCx = 100;
  const inputCy = 56;

  // Lit-cell appearance schedule within the 5s loop:
  //  arcs draw 0.18→0.55; cells light at 0.55, 0.62, 0.69; verdict tick at 0.78.
  // Six keyframes match the 6-stop opacity/scale arrays below.
  const litTimes: number[][] = [
    [0, 0.5, 0.55, 0.6, 0.92, 1],
    [0, 0.55, 0.62, 0.67, 0.92, 1],
    [0, 0.6, 0.69, 0.74, 0.92, 1],
  ];

  return (
    <g>
      {/* ─── Input bubble at top ──────────────────────────────── */}
      <motion.g
        initial={{ scale: 1 }}
        animate={animate ? { scale: [1, 1.08, 1, 1, 1] } : { scale: 1 }}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.08, 0.18, 0.92, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${inputCx}px ${inputCy}px`, transformBox: "fill-box" as const }}
      >
        <rect
          x={56}
          y={36}
          width={88}
          height={28}
          rx={8}
          fill="var(--color-surface)"
          stroke="var(--color-text)"
          strokeWidth={2.4}
          vectorEffect="non-scaling-stroke"
        />
        {/* Typed-text glyph stubs */}
        <rect x={64} y={48} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        <rect x={72} y={48} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        <rect x={80} y={48} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        <rect x={88} y={48} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
        <rect x={96} y={48} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.55} />
        <rect x={104} y={48} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.55} />
        <rect x={112} y={48} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.55} />
        {/* @ symbol stub */}
        <circle cx={124} cy={50} r={2.4} fill="none" stroke="var(--color-text-muted)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
      </motion.g>

      {/* ─── Pulse dot emitted from input ─────────────────────── */}
      <motion.circle
        cx={inputCx}
        cy={inputCy + 8}
        r={4}
        fill="var(--color-accent)"
        initial={{ scale: 0, opacity: 0 }}
        animate={
          animate
            ? {
                scale: [0, 1.4, 1, 0, 0],
                opacity: [0, 1, 0.85, 0, 0],
              }
            : { scale: 0, opacity: 0 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.08, 0.18, 0.28, 1],
              }
            : undefined
        }
        style={{ transformOrigin: `${inputCx}px ${inputCy + 8}px`, transformBox: "fill-box" as const }}
      />

      {/* ─── 3 hash arcs (the fan-out) ────────────────────────── */}
      {litCenters.map((endX, i) => {
        // Curved path from input bottom-center to the cell top-center.
        const startX = inputCx;
        const startY = inputCy + 12;
        const endY = arrayY - 2;
        const midX = (startX + endX) / 2;
        const midY = startY + 30 + i * 4; // gentle dip
        const d = `M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`;
        return (
          <motion.path
            key={`arc-${i}`}
            d={d}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={2.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0.3 }}
            animate={
              animate
                ? {
                    pathLength: [0, 0, 1, 1, 0, 0],
                    opacity: [0.3, 0.3, 0.95, 0.7, 0.3, 0.3],
                  }
                : { pathLength: 1, opacity: 0.85 }
            }
            transition={
              animate
                ? {
                    duration: 5,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.2, 1],
                    times: [0, 0.18, 0.5, 0.88, 0.95, 1],
                  }
                : undefined
            }
          />
        );
      })}

      {/* ─── Bit-array cells ──────────────────────────────────── */}
      {cells.map((c, i) => {
        if (!c.lit) {
          // Neutral cell — static.
          return (
            <rect
              key={`cell-${i}`}
              x={c.x}
              y={c.y}
              width={cellW}
              height={cellH}
              rx={2}
              fill="var(--color-surface)"
              stroke="var(--color-text)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          );
        }
        // Lit cell — flips terracotta in sequence.
        const litIdx = litCenters.findIndex((x) => x === c.x + cellW / 2);
        const times = litTimes[litIdx];
        return (
          <g key={`cell-${i}`}>
            {/* Static neutral underlay (always present) */}
            <rect
              x={c.x}
              y={c.y}
              width={cellW}
              height={cellH}
              rx={2}
              fill="var(--color-surface)"
              stroke="var(--color-text)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
            {/* Terracotta fill that fades in on schedule */}
            <motion.rect
              x={c.x}
              y={c.y}
              width={cellW}
              height={cellH}
              rx={2}
              fill="var(--color-accent)"
              initial={{ opacity: 0, scale: 1 }}
              animate={
                animate
                  ? {
                      opacity: [0, 0, 1, 1, 0, 0],
                      scale: [1, 1, 1.18, 1, 1, 1],
                    }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                animate
                  ? {
                      duration: 5,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.2, 1],
                      times,
                    }
                  : undefined
              }
              style={{
                transformOrigin: `${c.x + cellW / 2}px ${c.y + cellH / 2}px`,
                transformBox: "fill-box" as const,
              }}
            />
          </g>
        );
      })}

      {/* ─── Verdict tick (top-right of input — "taken!") ─────── */}
      <motion.path
        d="M 154 92 L 162 100 L 178 84"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          animate
            ? {
                pathLength: [0, 0, 1, 1, 0],
                opacity: [0, 0, 1, 1, 0],
              }
            : { pathLength: 1, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.78, 0.86, 0.92, 0.97],
              }
            : undefined
        }
      />

      {/* Small terracotta sparkle on the tick — /delight beat (1 of 4 cap) */}
      <motion.circle
        cx={170}
        cy={86}
        r={2}
        fill="var(--color-accent)"
        initial={{ opacity: 0, scale: 0 }}
        animate={
          animate
            ? { opacity: [0, 0, 0, 1, 0, 0], scale: [0, 0, 0, 1.6, 0, 0] }
            : { opacity: 0, scale: 0 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.82, 0.86, 0.9, 0.94, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "170px 86px", transformBox: "fill-box" as const }}
      />
    </g>
  );
}

/**
 * HowGmailCoverStatic — Satori-safe pure-JSX export of the reduced-motion
 * end-state. Bit-array fully resolved with 3 cells lit terracotta and the
 * verdict tick visible. Used by the /og share-preview route.
 *
 * Hex constants inline because Satori has limited CSS-variable support;
 * see components/covers/static-registry.ts for the canonical palette.
 */
export function HowGmailCoverStatic() {
  const ACCENT = "#d97341";
  const TEXT = "#f8f5f0";
  const MUTED = "#7a7570";
  const SURFACE = "#1a1714";

  const cellCount = 12;
  const cellW = 12;
  const cellH = 16;
  const cellGap = 2;
  const arrayW = cellCount * cellW + (cellCount - 1) * cellGap;
  const arrayX = (200 - arrayW) / 2;
  const arrayY = 140;

  const cells = Array.from({ length: cellCount }, (_, i) => ({
    x: arrayX + i * (cellW + cellGap),
    y: arrayY,
    lit: i === 1 || i === 5 || i === 9,
  }));

  const litCenters = cells.filter((c) => c.lit).map((c) => c.x + cellW / 2);

  const inputCx = 100;
  const inputCy = 56;

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Input bubble */}
      <rect x={56} y={36} width={88} height={28} rx={8} fill={SURFACE} stroke={TEXT} strokeWidth={2.4} />
      <rect x={64} y={48} width={4} height={4} rx={1} fill={MUTED} opacity={0.7} />
      <rect x={72} y={48} width={4} height={4} rx={1} fill={MUTED} opacity={0.7} />
      <rect x={80} y={48} width={4} height={4} rx={1} fill={MUTED} opacity={0.7} />
      <rect x={88} y={48} width={4} height={4} rx={1} fill={MUTED} opacity={0.7} />
      <rect x={96} y={48} width={4} height={4} rx={1} fill={MUTED} opacity={0.55} />
      <rect x={104} y={48} width={4} height={4} rx={1} fill={MUTED} opacity={0.55} />
      <rect x={112} y={48} width={4} height={4} rx={1} fill={MUTED} opacity={0.55} />
      <circle cx={124} cy={50} r={2.4} fill="none" stroke={MUTED} strokeWidth={1.4} />

      {/* 3 hash arcs (fully drawn) */}
      {litCenters.map((endX, i) => {
        const startX = inputCx;
        const startY = inputCy + 12;
        const endY = arrayY - 2;
        const midX = (startX + endX) / 2;
        const midY = startY + 30 + i * 4;
        const d = `M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`;
        return (
          <path
            key={`arc-${i}`}
            d={d}
            fill="none"
            stroke={ACCENT}
            strokeWidth={2.2}
            strokeLinecap="round"
            opacity={0.85}
          />
        );
      })}

      {/* Bit-array cells */}
      {cells.map((c, i) => (
        <g key={`cell-${i}`}>
          <rect
            x={c.x}
            y={c.y}
            width={cellW}
            height={cellH}
            rx={2}
            fill={SURFACE}
            stroke={TEXT}
            strokeWidth={2}
          />
          {c.lit && (
            <rect
              x={c.x}
              y={c.y}
              width={cellW}
              height={cellH}
              rx={2}
              fill={ACCENT}
            />
          )}
        </g>
      ))}

      {/* Verdict tick */}
      <path
        d="M 154 92 L 162 100 L 178 84"
        fill="none"
        stroke={ACCENT}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
