"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * EvalsOrVibesCover — the eval cycle in one gesture.
 *
 * One sentence:
 *   A 4×3 terracotta grid where, once per loop, a hidden failure surfaces
 *   on row 1 col 2 (a cell flickers off into a dashed "miss"), a scan
 *   beam sweeps that row right→left and catches it, and the cell resolves
 *   back to filled — the eval cycle compressed into one continuous loop.
 *
 * Why this metaphor:
 *   The article's thesis is that evals catch what vibes miss. The previous
 *   v1 cover (a static grid with a permanently-empty cell) read as inert
 *   at 64 px — opacity-only support pulses on neighbors below the noise
 *   floor (playbook §3). v2 makes the eval *cycle itself* the cover. The
 *   running gesture is the answer to "how do I know if my AI is any
 *   good": you scan, you catch, you fix, repeat.
 *
 * Composition (13 load-bearing elements):
 *   1–11.  Eleven filled cells (terracotta dots) at baseline opacity 0.95.
 *   12.    The "failure cell" at row 1, col 2 — animates: filled →
 *          dashed-ring miss → caught flash → filled again.
 *   13.    Scan beam — a thin horizontal terracotta bar that sweeps the
 *          failure-row right→left during phase B, with a soft trailing
 *          wash. The hero gesture.
 *   14.    Baseline rule under the grid (geometric anchor).
 *
 * Motion (playbook §3, §4, §14 — refined kinetic register):
 *   - 5s continuous loop, no idle gap.
 *   - Phase A (0–25%): failure cell fades terracotta dot → dashed empty
 *     ring at row 1, col 2. The miss surfaces.
 *   - Phase B (25–58%): scan beam translates from x ≈ 175 → x ≈ 25
 *     across the failure row, with trailing wash. Beam amplitude = 150
 *     px in the 200×200 viewBox = 75% of width. Visible at 64 px.
 *   - Phase C (58–82%): as the beam passes the failure cell, the cell
 *     opacity-flashes 0 → 1.0 (caught) and the dashed ring fades to 0.
 *     Cell now filled terracotta = fixed.
 *   - Phase D (82–100%): all 12 cells at uniform 0.95 opacity, breathing
 *     hold; loop.
 *
 * Reduced-motion end-state: the "caught" moment — beam at the failure
 * cell's position, cell freshly filled at full opacity, dashed ring at
 * 0.4 opacity (still visible as the residual trace of what was just
 * caught). The reader reads from the still: evals are scanning the grid
 * and catching the miss.
 *
 * Frame stability R6: only opacity and transform (translateX on the
 * beam) animate. No geometry attribute changes.
 */

// 4 cols × 3 rows grid layout in a 200×200 viewBox.
const COLS = 4;
const ROWS = 3;
const CELL = 28;
const GAP = 14;
const GRID_W = COLS * CELL + (COLS - 1) * GAP;
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP;
const ORIGIN_X = (200 - GRID_W) / 2;
const ORIGIN_Y = (200 - GRID_H) / 2 - 4;
const DOT_R = 6;

// The failure cell — middle row, third column. Off-center, deliberate.
const FAIL_ROW = 1;
const FAIL_COL = 2;

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

// Failure-cell geometry, hoisted so the JSX stays clean.
const FAIL = cellAt(FAIL_ROW, FAIL_COL);

// Scan-beam path: right→left across the failure row, with a small
// outside-grid pad on each end so the beam slides "in" and "out" cleanly.
const BEAM_Y = FAIL.cy;
const BEAM_X_RIGHT = ORIGIN_X + GRID_W + 8; // start just right of grid
const BEAM_X_LEFT = ORIGIN_X - 8; // end just left of grid
const BEAM_HALF_W = (GRID_W + 16) / 2;

// Reduced-motion still: place beam centered on the failure cell.
const BEAM_X_CAUGHT = FAIL.cx;

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

      {/* ─── 11 stable filled cells (everything except the failure cell) ─── */}
      {CELLS.map((cell) => {
        const isFail = cell.row === FAIL_ROW && cell.col === FAIL_COL;
        if (isFail) return null;
        return (
          <circle
            key={`cell-${cell.row}-${cell.col}`}
            cx={cell.cx}
            cy={cell.cy}
            r={DOT_R}
            fill="var(--color-accent)"
            opacity={0.95}
          />
        );
      })}

      {/* ─── Failure cell: filled dot — fades out in phase A, flashes back in phase C ─── */}
      <motion.circle
        cx={FAIL.cx}
        cy={FAIL.cy}
        r={DOT_R}
        fill="var(--color-accent)"
        initial={false}
        animate={
          animate
            ? { opacity: [0.95, 0, 0, 1, 0.95, 0.95] }
            : { opacity: 1 } // reduced-motion: just-caught, freshly filled
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                // [start, after-fade-out, hold-empty, caught-flash, settle, end]
                times: [0, 0.22, 0.58, 0.66, 0.82, 1],
              }
            : undefined
        }
        variants={{
          idle: {},
          hover: { opacity: 1 },
        }}
      />

      {/* ─── Failure cell: dashed "miss" ring — only visible in phase A→B ─── */}
      <motion.circle
        cx={FAIL.cx}
        cy={FAIL.cy}
        r={DOT_R + 0.5}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1.2}
        strokeDasharray="2 2"
        initial={false}
        animate={
          animate
            ? { opacity: [0, 0.7, 0.7, 0, 0, 0] }
            : { opacity: 0.4 } // reduced-motion: residual trace of the caught miss
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.22, 0.58, 0.68, 0.82, 1],
              }
            : undefined
        }
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Scan beam — the hero gesture, sweeps row right→left in phase B ─── */}
      {/*
       * The beam is a horizontal terracotta bar centered on its own anchor
       * (so translateX moves the *center* across the row). We render two
       * stacked lines: a thin sharp leading edge + a softer wash above for
       * the "afterglow" (the §3 corollary register: opacity-led trail, not
       * a punchy filled rectangle). The whole group's opacity is gated to
       * phase B + a brief tail into phase C so the catch reads.
       */}
      <motion.g
        initial={false}
        animate={
          animate
            ? {
                x: [
                  BEAM_X_RIGHT - BEAM_HALF_W - ORIGIN_X, // hidden right
                  BEAM_X_RIGHT - BEAM_HALF_W - ORIGIN_X, // park at right of grid (phase A)
                  FAIL.cx - BEAM_HALF_W - ORIGIN_X, // mid-sweep over the failure cell (catch)
                  BEAM_X_LEFT - BEAM_HALF_W - ORIGIN_X, // exit left
                  BEAM_X_LEFT - BEAM_HALF_W - ORIGIN_X, // hold off-stage
                  BEAM_X_RIGHT - BEAM_HALF_W - ORIGIN_X, // teleport back to right (during invisible hold)
                ],
                opacity: [0, 0, 1, 0.85, 0, 0],
              }
            : {
                x: BEAM_X_CAUGHT - BEAM_HALF_W - ORIGIN_X,
                opacity: 0.9,
              } // reduced-motion: caught moment over the failure cell
        }
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.25, 0.5, 0.6, 0.82, 1],
              }
            : undefined
        }
        // Anchor the beam group at (ORIGIN_X + BEAM_HALF_W, BEAM_Y) by
        // pre-rendering the beam centered on (BEAM_HALF_W, 0) and then
        // translating into place. We use the SVG transform attribute on
        // an inner group for the static base position; the motion.g above
        // animates the relative `x`.
      >
        <g transform={`translate(${ORIGIN_X} ${BEAM_Y})`}>
          {/* Sharp leading line — terracotta, full width of the row + small overshoot */}
          <line
            x1={0}
            y1={0}
            x2={BEAM_HALF_W * 2}
            y2={0}
            stroke="var(--color-accent)"
            strokeWidth={2.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Trailing wash — softer line just below the leading edge */}
          <line
            x1={6}
            y1={3}
            x2={BEAM_HALF_W * 2 - 6}
            y2={3}
            stroke="color-mix(in oklab, var(--color-accent) 45%, transparent)"
            strokeWidth={1.4}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* Outermost wash — even softer, gives the beam a sense of glow */}
          <line
            x1={12}
            y1={-3}
            x2={BEAM_HALF_W * 2 - 12}
            y2={-3}
            stroke="color-mix(in oklab, var(--color-accent) 22%, transparent)"
            strokeWidth={1}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </motion.g>
    </motion.g>
  );
}

/**
 * EvalsOrVibesCoverStatic — Satori-safe pure-JSX export.
 *
 * Reduced-motion / OG end-state per playbook §8: the "caught" moment.
 *  - All 11 surrounding cells filled at 0.95 opacity.
 *  - Failure cell freshly restored to terracotta fill (the catch just
 *    completed).
 *  - Dashed "miss" ring lingering at 0.4 opacity over the failure cell —
 *    the residual trace of what was caught. The reader sees: this cell
 *    was a miss; it's been caught.
 *  - Scan beam centered on the failure cell at full opacity.
 *  - Baseline rule under the grid for geometric anchor.
 *
 * Inline hex palette only (no CSS vars, no color-mix, no hooks).
 */
export function EvalsOrVibesCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  // color-mix(accent 45% + transparent) approximation over BG #0e1114
  const ACCENT_TRAIL = "#7a3a1f";
  // color-mix(accent 22% + transparent) approximation over BG #0e1114
  const ACCENT_GLOW = "#3b2018";

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

      {/* 11 surrounding cells */}
      {CELLS.map((cell) => {
        const isFail = cell.row === FAIL_ROW && cell.col === FAIL_COL;
        if (isFail) return null;
        return (
          <circle
            key={`cell-${cell.row}-${cell.col}`}
            cx={cell.cx}
            cy={cell.cy}
            r={DOT_R}
            fill={ACCENT}
            opacity={0.95}
          />
        );
      })}

      {/* Failure cell: freshly restored to filled terracotta */}
      <circle cx={FAIL.cx} cy={FAIL.cy} r={DOT_R} fill={ACCENT} opacity={1} />

      {/* Residual dashed-ring trace — what was just caught */}
      <circle
        cx={FAIL.cx}
        cy={FAIL.cy}
        r={DOT_R + 0.5}
        fill="none"
        stroke={MUTED}
        strokeWidth={1.2}
        strokeDasharray="2 2"
        opacity={0.4}
      />

      {/* Scan beam at the "caught" position — centered on failure cell */}
      <g
        transform={`translate(${FAIL.cx - (GRID_W + 16) / 2} ${FAIL.cy})`}
        opacity={0.9}
      >
        <line
          x1={0}
          y1={0}
          x2={GRID_W + 16}
          y2={0}
          stroke={ACCENT}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <line
          x1={6}
          y1={3}
          x2={GRID_W + 10}
          y2={3}
          stroke={ACCENT_TRAIL}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <line
          x1={12}
          y1={-3}
          x2={GRID_W + 4}
          y2={-3}
          stroke={ACCENT_GLOW}
          strokeWidth={1}
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
