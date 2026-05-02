"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * EvalsOrVibesCover — the wine-panel grid.
 *
 * One sentence:
 *   A 4×3 tasting-ballot grid where 11 cells are terracotta-filled and one
 *   cell is empty — the failure that didn't show up in your evals.
 *
 * Why this metaphor:
 *   The post's running lens is wine-panel calibration. A ballot is a grid
 *   of judges' marks; a CSV is a grid of rows. The empty cell is the only
 *   contrast on the cover, which is also the article's claim — the
 *   failure mode you can't see is the one your eval set didn't sample.
 *
 * Composition (12 elements + 1 frame line = 13 load-bearing):
 *   1–11.  Eleven filled cells (terracotta dots).
 *   12.    One empty cell (just the cell ring, no dot).
 *   13.    A subtle baseline rule under the grid (the "ballot edge") for
 *          geometric anchor.
 *
 * Motion (playbook §3, §4, §14 — refined contemplative register):
 *   - 6s continuous loop.
 *   - One quiet support gesture: the four neighbors of the empty cell
 *     pulse-in-rotation (one at a time brightens by ~12% opacity for
 *     ~0.6s, then settles). This suggests the panel is "tasting around
 *     the gap" without ever filling it. The empty cell never lights up —
 *     that is the load-bearing point.
 *   - No scale gestures on chrome. No solid terracotta pulses. The
 *     metaphor is contemplative; the eyes should rest on the gap.
 *
 * Reduced-motion end-state: all 11 filled cells visible with the empty
 * cell at row 1 col 2. The metaphor lands statically: 11 × on the
 * ballot, one blank. The blank is what your evals missed.
 *
 * Frame stability R6: only opacity animates. No transform, no path,
 * no geometry attribute changes.
 */

// 4 cols × 3 rows grid layout in a 200×200 viewBox.
// Cell size 28; gap 14; centered.
const COLS = 4;
const ROWS = 3;
const CELL = 28;
const GAP = 14;
const GRID_W = COLS * CELL + (COLS - 1) * GAP;
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP;
const ORIGIN_X = (200 - GRID_W) / 2;
const ORIGIN_Y = (200 - GRID_H) / 2 - 4; // bias up slightly for baseline rule
const DOT_R = 6;

// The empty cell — row 0 (top row), col 2 (third from left). Off-center
// enough to read as deliberate, not corner-tucked.
const EMPTY_ROW = 0;
const EMPTY_COL = 2;

type CellPos = { row: number; col: number; cx: number; cy: number };

function cellAt(row: number, col: number): CellPos {
  return {
    row,
    col,
    cx: ORIGIN_X + col * (CELL + GAP) + CELL / 2,
    cy: ORIGIN_Y + row * (CELL + GAP) + CELL / 2,
  };
}

const CELLS: CellPos[] = (() => {
  const out: CellPos[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) out.push(cellAt(r, c));
  }
  return out;
})();

// The four orthogonal neighbors of the empty cell — these will pulse in
// rotation. (Skip neighbors that fall outside the grid.)
const NEIGHBORS: CellPos[] = [
  { dr: -1, dc: 0 }, // up — out of grid (row -1) — filtered
  { dr: 1, dc: 0 }, // down
  { dr: 0, dc: -1 }, // left
  { dr: 0, dc: 1 }, // right
]
  .map(({ dr, dc }) => ({ r: EMPTY_ROW + dr, c: EMPTY_COL + dc }))
  .filter(
    ({ r, c }) => r >= 0 && r < ROWS && c >= 0 && c < COLS,
  )
  .map(({ r, c }) => cellAt(r, c));

// For each neighbor, build an opacity keyframe schedule across a 6s loop.
// Each neighbor "brightens" for 0.6s in its own slot, others stay at
// baseline. Baseline opacity is 0.85; pulse peak is 1.0. Subtle.
function pulseSchedule(): number[] {
  // Each neighbor owns a 0.10 slot; the rest is hold. Total covered:
  // 3–4 × 0.10 = ~0.40, leaving ~0.60 of contemplative quiet — the point.
  // Keyframes: [0, start, start+slot/2, start+slot, 1]
  const baseline = 0.85;
  const peak = 1.0;
  return [baseline, baseline, peak, baseline, baseline];
}

function pulseTimes(idx: number): number[] {
  const slot = 0.1;
  const pad = 0.05;
  const start = idx * (slot + pad);
  return [
    0,
    Math.max(0, start),
    Math.min(1, start + slot / 2),
    Math.min(1, start + slot),
    1,
  ];
}

export function EvalsOrVibesCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── Baseline rule under the grid (geometric anchor) ─── */}
      <line
        x1={ORIGIN_X}
        y1={ORIGIN_Y + GRID_H + 14}
        x2={ORIGIN_X + GRID_W}
        y2={ORIGIN_Y + GRID_H + 14}
        stroke="var(--color-text-muted)"
        strokeWidth={1.0}
        opacity={0.32}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── 12 cells: 11 filled with terracotta dot, 1 empty (ring only) ─── */}
      {CELLS.map((cell) => {
        const isEmpty = cell.row === EMPTY_ROW && cell.col === EMPTY_COL;

        // For the filled cells, find which neighbor index this corresponds
        // to (if any) so it can pulse on its turn. Non-neighbors stay at
        // baseline opacity for the whole loop.
        const neighborIdx = NEIGHBORS.findIndex(
          (n) => n.row === cell.row && n.col === cell.col,
        );
        const isNeighbor = neighborIdx !== -1;

        if (isEmpty) {
          // Empty cell: just a thin ring + a tiny "x" or just nothing —
          // we use just the ring, so the gap is the loudest thing.
          return (
            <circle
              key={`empty-${cell.row}-${cell.col}`}
              cx={cell.cx}
              cy={cell.cy}
              r={DOT_R + 0.5}
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth={1.2}
              strokeDasharray="2 2"
              opacity={0.55}
              vectorEffect="non-scaling-stroke"
            />
          );
        }

        return (
          <motion.circle
            key={`filled-${cell.row}-${cell.col}`}
            cx={cell.cx}
            cy={cell.cy}
            r={DOT_R}
            fill="var(--color-accent)"
            initial={{ opacity: 0.85 }}
            animate={
              animate && isNeighbor
                ? { opacity: pulseSchedule() }
                : { opacity: 0.85 }
            }
            transition={
              animate && isNeighbor
                ? {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: pulseTimes(neighborIdx),
                  }
                : undefined
            }
            variants={{
              idle: {},
              // Hover: brighten all filled cells very slightly. The empty
              // cell stays empty — that's the joke.
              hover: { opacity: 0.95 },
            }}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
    </motion.g>
  );
}

/**
 * EvalsOrVibesCoverStatic — Satori-safe pure-JSX export.
 *
 * Reduced-motion end-state: all 11 filled cells at baseline opacity, the
 * empty cell as a dashed ring at row 0 col 2, baseline rule below the
 * grid. The metaphor reads from the still: the gap is the failure your
 * evals didn't catch.
 *
 * Inline hex palette only (no CSS vars, no color-mix, no hooks).
 */
export function EvalsOrVibesCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Baseline rule */}
      <line
        x1={ORIGIN_X}
        y1={ORIGIN_Y + GRID_H + 14}
        x2={ORIGIN_X + GRID_W}
        y2={ORIGIN_Y + GRID_H + 14}
        stroke={MUTED}
        strokeWidth={1.0}
        opacity={0.32}
      />

      {CELLS.map((cell) => {
        const isEmpty = cell.row === EMPTY_ROW && cell.col === EMPTY_COL;

        if (isEmpty) {
          return (
            <circle
              key={`empty-${cell.row}-${cell.col}`}
              cx={cell.cx}
              cy={cell.cy}
              r={DOT_R + 0.5}
              fill="none"
              stroke={MUTED}
              strokeWidth={1.2}
              strokeDasharray="2 2"
              opacity={0.55}
            />
          );
        }

        return (
          <circle
            key={`filled-${cell.row}-${cell.col}`}
            cx={cell.cx}
            cy={cell.cy}
            r={DOT_R}
            fill={ACCENT}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}
