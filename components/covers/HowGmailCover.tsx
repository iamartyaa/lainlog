"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * HowGmailCover — bloom filter: an email pulse hashes into 3 lit cells.
 *
 * One sentence (the user-named hero):
 *   An email input pulse fans through three hash arcs (each carrying a
 *   travelling sparkle) into a 4×3 bit-array grid; three cells flip terracotta
 *   in sequence and a verdict tick lands with a /delight sparkle.
 *
 * Composition (~14 load-bearing elements — at the budget cap):
 *  1.  Email input bubble (rounded-rect with caret)
 *  2.  Caret stub (terracotta, blinks via opacity)
 *  3.  Pulse dot (terracotta, emits from input)
 *  4-6. 3 hash arcs (curved bezier paths, pathLength draws + travelling sparkles)
 *  7.  Bit-array group (12 cells in 4×3 grid — counted as one composition element)
 *  8.  Lit-cell overlay 1 (terracotta fill that flips in)
 *  9.  Lit-cell overlay 2
 *  10. Lit-cell overlay 3
 *  11. Verdict tick (terracotta ✓ that draws after cells light, scales 0→1.4→1)
 *  12. Verdict halo (small accent ring around the tick)
 *  13. Sparkle 1 (delight beat — terracotta sparkle on tick arrival)
 *  14. Sparkle 2 (second sparkle, smaller)
 *
 * Note: 3 travelling-sparkle dots ride along arcs but are visually subordinate
 *  to the arcs themselves; counted within (4-6).
 *
 * Motion (playbook §3, §4 — /overdrive applied):
 *  - 5s continuous loop, no idle gap > 600ms.
 *  - Phase 1 (0–0.18): caret blinks; pulse dot emits 0→1.4→0.9 scale, opacity.
 *  - Phase 2 (0.18–0.55): 3 hash arcs draw simultaneously (pathLength 0→1).
 *    A small terracotta sparkle rides along each arc from start to destination.
 *  - Phase 3 (0.55–0.80): cells flip in sequence (60ms apart), each scaling
 *    1 → 1.25 → 1 with a pop.
 *  - Phase 4 (0.80–0.94): verdict tick draws 0→1 + scales 0 → 1.4 → 1
 *    (committed; was subtle in v4). Halo ring expands. Sparkles fire (delight).
 *  - Phase 5 (0.94–1): hold then reset.
 *  - Hover amplifies via whileHover on the wrapping motion.g.
 *
 * Frame-stability R6: only opacity / scale / pathLength animate. Tokens-only.
 *
 * Reduced-motion end-state: 3 cells lit terracotta, verdict tick visible
 * scaled 1.0, halo at peak, sparkles at peak. The article's thesis lands
 * statically — "yes, taken."
 */
export function HowGmailCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // ── Bit-array geometry — 4×3 grid for breathing room (was 1×12) ──
  const cols = 4;
  const rows = 3;
  const cellW = 22;
  const cellH = 14;
  const cellGapX = 4;
  const cellGapY = 4;
  const arrayW = cols * cellW + (cols - 1) * cellGapX;
  const arrayH = rows * cellH + (rows - 1) * cellGapY;
  const arrayX = (200 - arrayW) / 2;
  const arrayY = 116;

  // 3 hash destinations — chosen to spread across the grid.
  // Indexes: row 0 col 1, row 1 col 3, row 2 col 0
  const litIndexes: Array<{ row: number; col: number }> = [
    { row: 0, col: 1 },
    { row: 1, col: 3 },
    { row: 2, col: 0 },
  ];

  const cellAt = (row: number, col: number) => ({
    x: arrayX + col * (cellW + cellGapX),
    y: arrayY + row * (cellH + cellGapY),
  });

  const litCells = litIndexes.map((p) => ({
    ...p,
    ...cellAt(p.row, p.col),
    cx: arrayX + p.col * (cellW + cellGapX) + cellW / 2,
    cy: arrayY + p.row * (cellH + cellGapY) + cellH / 2,
  }));

  // Input bubble center.
  const inputCx = 100;
  const inputCy = 56;
  const inputBottomY = 70;

  // Lit-cell flip schedule — staggered 60ms apart.
  const litTimes: number[][] = [
    [0, 0.5, 0.58, 0.66, 0.92, 1],
    [0, 0.55, 0.64, 0.72, 0.92, 1],
    [0, 0.6, 0.7, 0.78, 0.92, 1],
  ];

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── Email input bubble at top ──────────────────────────── */}
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
          x={48}
          y={38}
          width={104}
          height={32}
          rx={8}
          fill="var(--color-surface)"
          stroke="var(--color-text)"
          strokeWidth={2.6}
          vectorEffect="non-scaling-stroke"
        />
        {/* "you@" text-stub glyphs */}
        <rect x={56} y={52} width={5} height={5} rx={1} fill="var(--color-text-muted)" opacity={0.85} />
        <rect x={64} y={52} width={5} height={5} rx={1} fill="var(--color-text-muted)" opacity={0.85} />
        <rect x={72} y={52} width={5} height={5} rx={1} fill="var(--color-text-muted)" opacity={0.85} />
        {/* @ symbol */}
        <circle cx={84} cy={54.5} r={3} fill="none" stroke="var(--color-text-muted)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
        <circle cx={84} cy={54.5} r={1} fill="var(--color-text-muted)" />
        {/* domain glyphs */}
        <rect x={92} y={52} width={5} height={5} rx={1} fill="var(--color-text-muted)" opacity={0.65} />
        <rect x={100} y={52} width={5} height={5} rx={1} fill="var(--color-text-muted)" opacity={0.65} />
        <rect x={108} y={52} width={5} height={5} rx={1} fill="var(--color-text-muted)" opacity={0.5} />

        {/* Caret — blinks */}
        <motion.rect
          x={120}
          y={48}
          width={2}
          height={14}
          rx={0.5}
          fill="var(--color-accent)"
          initial={{ opacity: 1 }}
          animate={animate ? { opacity: [1, 0, 1, 0, 1] } : { opacity: 1 }}
          transition={
            animate
              ? {
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, 0.12, 0.24, 0.36, 0.48],
                }
              : undefined
          }
        />
      </motion.g>

      {/* ─── Pulse dot (emitted from input bottom) ──────────────── */}
      <motion.circle
        cx={inputCx}
        cy={inputBottomY + 4}
        r={4.5}
        fill="var(--color-accent)"
        initial={{ scale: 0, opacity: 0 }}
        animate={
          animate
            ? {
                scale: [0, 1.5, 1, 0, 0],
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
        style={{ transformOrigin: `${inputCx}px ${inputBottomY + 4}px`, transformBox: "fill-box" as const }}
      />

      {/* ─── 3 hash arcs (the fan-out) + travelling sparkles ───── */}
      {litCells.map((cell, i) => {
        const startX = inputCx;
        const startY = inputBottomY + 6;
        const endX = cell.cx;
        const endY = cell.y - 1;
        const midX = (startX + endX) / 2;
        const midY = startY + 22 + i * 4; // gentle dip
        const d = `M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`;
        return (
          <g key={`arc-${i}`}>
            {/* Arc path */}
            <motion.path
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
            {/* Travelling sparkle along the arc — opacity gates entry/exit;
                position interpolated between start, mid, end. */}
            <motion.circle
              r={2}
              fill="var(--color-accent)"
              initial={{ opacity: 0 }}
              animate={
                animate
                  ? {
                      cx: [startX, startX, midX, endX, endX],
                      cy: [startY, startY, midY, endY, endY],
                      opacity: [0, 0, 1, 1, 0],
                      scale: [0.6, 0.6, 1.3, 1, 0.6],
                    }
                  : { cx: endX, cy: endY, opacity: 0, scale: 1 }
              }
              transition={
                animate
                  ? {
                      duration: 5,
                      repeat: Infinity,
                      ease: [0.4, 0, 0.2, 1],
                      times: [0, 0.18, 0.36, 0.5, 0.55],
                    }
                  : undefined
              }
            />
          </g>
        );
      })}

      {/* ─── Bit-array (4×3 grid) — neutral cells ───────────────── */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const { x, y } = cellAt(r, c);
          return (
            <rect
              key={`cell-${r}-${c}`}
              x={x}
              y={y}
              width={cellW}
              height={cellH}
              rx={2.5}
              fill="var(--color-surface)"
              stroke="var(--color-text)"
              strokeWidth={2}
              vectorEffect="non-scaling-stroke"
            />
          );
        }),
      )}

      {/* ─── Lit-cell overlays (3 cells flip terracotta) ────────── */}
      {litCells.map((cell, i) => (
        <motion.rect
          key={`lit-${i}`}
          x={cell.x}
          y={cell.y}
          width={cellW}
          height={cellH}
          rx={2.5}
          fill="var(--color-accent)"
          initial={{ opacity: 0, scale: 1 }}
          animate={
            animate
              ? {
                  opacity: [0, 0, 1, 1, 0, 0],
                  scale: [1, 1, 1.25, 1, 1, 1],
                }
              : { opacity: 1, scale: 1 }
          }
          transition={
            animate
              ? {
                  duration: 5,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  times: litTimes[i],
                }
              : undefined
          }
          style={{
            transformOrigin: `${cell.cx}px ${cell.cy}px`,
            transformBox: "fill-box" as const,
          }}
        />
      ))}

      {/* ─── Verdict halo (small ring around the tick) ──────────── */}
      <motion.circle
        cx={170}
        cy={88}
        r={14}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.4 }}
        animate={
          animate
            ? { opacity: [0, 0, 0.7, 0, 0], scale: [0.4, 0.4, 1, 1.6, 1.6] }
            : { opacity: 0.6, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.78, 0.86, 0.96, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "170px 88px", transformBox: "fill-box" as const }}
      />

      {/* ─── Verdict tick (committed scale: 0 → 1.4 → 1) ────────── */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={
          animate
            ? {
                scale: [0, 0, 1.4, 1, 1, 0],
                opacity: [0, 0, 1, 1, 1, 0],
              }
            : { scale: 1, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.78, 0.86, 0.92, 0.96, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "170px 88px", transformBox: "fill-box" as const }}
      >
        <motion.path
          d="M 162 90 L 168 96 L 180 82"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={3.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={
            animate
              ? { pathLength: [0, 0, 1, 1, 1, 0] }
              : { pathLength: 1 }
          }
          transition={
            animate
              ? {
                  duration: 5,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.78, 0.86, 0.92, 0.96, 1],
                }
              : undefined
          }
        />
      </motion.g>

      {/* ─── Sparkle 1 (delight beat) ──────────────────────────── */}
      <motion.circle
        cx={184}
        cy={78}
        r={2}
        fill="var(--color-accent)"
        initial={{ opacity: 0, scale: 0 }}
        animate={
          animate
            ? { opacity: [0, 0, 0, 1, 0, 0], scale: [0, 0, 0, 1.6, 0, 0] }
            : { opacity: 1, scale: 1.2 }
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
        style={{ transformOrigin: "184px 78px", transformBox: "fill-box" as const }}
      />
      {/* ─── Sparkle 2 (small companion) ───────────────────────── */}
      <motion.circle
        cx={158}
        cy={100}
        r={1.4}
        fill="var(--color-accent)"
        initial={{ opacity: 0, scale: 0 }}
        animate={
          animate
            ? { opacity: [0, 0, 0, 0.85, 0, 0], scale: [0, 0, 0, 1.4, 0, 0] }
            : { opacity: 0.85, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.84, 0.88, 0.92, 0.96, 1],
              }
            : undefined
        }
        style={{ transformOrigin: "158px 100px", transformBox: "fill-box" as const }}
      />
    </motion.g>
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
