"use client";

/**
 * <CourseOutline> — the snake-and-ladders course board.
 *
 * Rebuilt for PR #67. The earlier serpentine attempts felt visually
 * trash, too compact, and lacked character. This version throws out the
 * Bezier-rope-with-floating-cards pattern entirely. The board is now a
 * tall, scrolling neo-brutalist game board:
 *
 *   - 7 rows × 5 columns of cells (35 total).
 *   - Boustrophedon path: row 0 L→R, row 1 R→L, row 2 L→R, …
 *   - Cards are INSIDE cells; the path passes between cell centres.
 *   - Modules (Foundations / Core / Application) are bold coloured row
 *     spans behind the cells.
 *   - Snakes-and-ladders flourishes (1 ladder, 1 snake) drawn as
 *     decorative SVG overlays.
 *   - START button at the top, FINISH banner under the last row.
 *
 * Brutalist treatments:
 *   - 2 px hard black borders on every cell (var(--color-text)).
 *   - 4 px chunky outer frame around the whole board.
 *   - Each cell has an offset duplicate <rect> for tactile "depth"
 *     instead of a CSS box-shadow (DESIGN.md §12 bans drop-shadows).
 *   - Bold uppercase module headers and START / FINISH labels.
 *   - Numbered cells in a Plex-Mono badge top-left of each cell.
 *
 * Course-surface palette (DESIGN.md §3 register exception):
 *   The course page is a distinct surface from articles. Articles
 *   stay editorial-calm with one terracotta accent. The course page
 *   is anchored to terracotta but uses two supporting hues (warm
 *   ochre and muted sage) from the same warm-earth family. Tokens
 *   are scoped to [data-surface="course"] and never leak globally.
 *
 * Animation:
 *   - On scroll-in (`useInView`, once: true) the path stroke draws
 *     itself in via pathLength. Cells fade up in stagger.
 *   - Reduced-motion: render the final state instantly.
 *
 * Frame-stability (R6): the SVG and the cell grid share an aspect
 * ratio container, so the canvas can't reflow during the animation.
 *
 * Mobile fallback (<720 px container): the SVG board collapses to a
 * single-column vertical stack — one cell per row, full-width, with
 * a vertical line connecting them. Module colours preserved.
 */

import { useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SPRING } from "@/lib/motion";
import type {
  CourseModule,
  CourseSection,
} from "@/content/courses-manifest";
import { CourseStop } from "./CourseStop";

/* ────────────────────────────────────────────────────────────────────
 * BOARD GEOMETRY
 *
 * The board lives inside an SVG with a fixed viewBox. Coordinates are
 * derived from a small set of constants so the geometry stays in sync
 * with itself and can be retuned by editing one row.
 *
 * Layout (in viewBox units):
 *   - PAD             — outer board padding
 *   - HEADER_H        — vertical space at the top reserved for the
 *                        START button banner
 *   - FOOTER_H        — bottom space reserved for the FINISH banner
 *   - CELL_W / CELL_H — single cell's width / height
 *   - GAP             — gap between adjacent cells
 *   - ROWS / COLS     — board dimensions
 *
 * Cells are 1-indexed in path order (1..ROWS*COLS). cellRect(idx)
 * returns the (x, y, row, col) of cell `idx`, accounting for
 * boustrophedon traversal.
 * ──────────────────────────────────────────────────────────────────── */

const PAD = 40;
const HEADER_H = 180;
const FOOTER_H = 100;
const CELL_W = 200;
const CELL_H = 160;
const GAP = 18;
const ROWS = 7;
const COLS = 5;

const VB_W = PAD * 2 + COLS * CELL_W + (COLS - 1) * GAP;
const VB_H = PAD * 2 + HEADER_H + ROWS * CELL_H + (ROWS - 1) * GAP + FOOTER_H;

/** Inner brutalist border around the play area (between header / footer). */
const PLAY_X = PAD;
const PLAY_Y = PAD + HEADER_H;
const PLAY_W = VB_W - PAD * 2;
const PLAY_H = ROWS * CELL_H + (ROWS - 1) * GAP;

/**
 * Boustrophedon cell rect for a 1-indexed cell.
 *
 * Row 0 traverses L→R; row 1 traverses R→L; etc. The path enters at
 * the START button above row 0 and exits at FINISH below row 6.
 *
 *   cell  1 → row 0 col 0          (top-left)
 *   cell  5 → row 0 col 4
 *   cell  6 → row 1 col 4
 *   cell 10 → row 1 col 0
 *   cell 35 → row 6 col 4          (bottom-right) — FINISH cell
 */
function cellRect(idx: number) {
  const i = idx - 1;
  const row = Math.floor(i / COLS);
  const within = i % COLS;
  const col = row % 2 === 0 ? within : COLS - 1 - within;
  const x = PLAY_X + col * (CELL_W + GAP);
  const y = PLAY_Y + row * (CELL_H + GAP);
  return { x, y, row, col };
}

/** Centre of a cell — used as a path anchor and a marker pin. */
function cellCenter(idx: number) {
  const r = cellRect(idx);
  return { cx: r.x + CELL_W / 2, cy: r.y + CELL_H / 2, row: r.row, col: r.col };
}

const TOTAL_CELLS = ROWS * COLS;

/* ────────────────────────────────────────────────────────────────────
 * MODULE GROUPING
 *
 * Each module spans a contiguous range of rows. The renderer uses these
 * ranges to draw the coloured row-span backgrounds AND to tag cells
 * with their owning module so sub-segment shading works.
 *
 * 7 rows / 3 modules:
 *   foundations  → rows 0–1   (cells 1–10)
 *   core         → rows 2–4   (cells 11–25)
 *   application  → rows 5–6   (cells 26–35)
 * ──────────────────────────────────────────────────────────────────── */

type ModuleSpec = {
  id: CourseModule;
  label: string;
  rowFrom: number;
  rowTo: number; // inclusive
};

const MODULES: ModuleSpec[] = [
  { id: "foundations", label: "Foundations", rowFrom: 0, rowTo: 1 },
  { id: "core", label: "Core mechanics", rowFrom: 2, rowTo: 4 },
  { id: "application", label: "Application", rowFrom: 5, rowTo: 6 },
];

function moduleForRow(row: number): ModuleSpec {
  return MODULES.find((m) => row >= m.rowFrom && row <= m.rowTo) ?? MODULES[0];
}

/* ────────────────────────────────────────────────────────────────────
 * THE PATH
 *
 * A boustrophedon zig-zag from cell 1's centre to cell 35's centre.
 * For each row:
 *   - draw a horizontal segment along the row's centre y from the
 *     entry-side cell centre to the exit-side cell centre,
 *   - then drop down to the next row's centre y with a tight cubic
 *     bend at the row end (a single C with control points placed to
 *     curve cleanly over the GAP between rows).
 *
 * The path begins one cell-height above row 0 (so the START button
 * area connects into the first cell), and ends at the FINISH banner.
 *
 * Output is a single `d` string, built once at module-load.
 * ──────────────────────────────────────────────────────────────────── */

function buildBoardPath(): string {
  const segments: string[] = [];

  // Anchor for the START button — sits centred horizontally above row 0.
  const startX = VB_W / 2;
  const startY = PAD + HEADER_H - 30;

  // Centre of cell 1 (top-left when row 0 is L→R).
  const c1 = cellCenter(1);
  segments.push(`M ${startX} ${startY}`);
  // Drop the path from the START button down into cell 1's centre with
  // a gentle Bezier rather than a bare line — gives the entry a hint
  // of mechanical curve.
  segments.push(
    `C ${startX} ${(startY + c1.cy) / 2}, ${c1.cx} ${(startY + c1.cy) / 2}, ${c1.cx} ${c1.cy}`
  );

  for (let row = 0; row < ROWS; row++) {
    const firstCell = row * COLS + 1;
    const lastCell = row * COLS + COLS;
    const fc = cellCenter(firstCell);
    const lc = cellCenter(lastCell);

    // Horizontal traversal along this row.
    segments.push(`L ${lc.cx} ${lc.cy}`);

    // If there's a next row, drop down with a 90°-style cubic bend.
    // Boustrophedon means the next row's first cell sits at the SAME
    // column as the current row's last cell, so the drop is a pure
    // vertical. Pushing the first control point outward (off the
    // canvas edge of the ending row) gives the corner a little hook
    // that reads as a real turn instead of a hairpin.
    if (row < ROWS - 1) {
      const nextFirst = (row + 1) * COLS + 1;
      const nf = cellCenter(nextFirst);
      const goingRight = row % 2 === 0; // row L→R ends on the right edge
      const hookOut = goingRight ? 60 : -60;
      const c1x = lc.cx + hookOut;
      const c1y = lc.cy + (nf.cy - lc.cy) * 0.35;
      const c2x = nf.cx + hookOut;
      const c2y = lc.cy + (nf.cy - lc.cy) * 0.65;
      segments.push(`C ${c1x} ${c1y}, ${c2x} ${c2y}, ${nf.cx} ${nf.cy}`);
    }
  }

  // Run the path past the last cell into the FINISH banner area.
  const lastCenter = cellCenter(TOTAL_CELLS);
  const finishY = VB_H - PAD - FOOTER_H / 2;
  segments.push(
    `C ${lastCenter.cx} ${(lastCenter.cy + finishY) / 2}, ${VB_W / 2} ${(lastCenter.cy + finishY) / 2}, ${VB_W / 2} ${finishY}`
  );

  return segments.join(" ");
}

const BOARD_D = buildBoardPath();

/* ────────────────────────────────────────────────────────────────────
 * DECORATIVE SNAKE & LADDER
 *
 * One snake (terracotta cubic from a higher cell back to a lower cell)
 * and one ladder (parallel verticals + rungs between two cells in the
 * same column). Decorative only — no semantics.
 *
 * Hand-tuned to fall in visually empty zones of the board so they
 * don't fight cells. Anchors are cell indices.
 * ──────────────────────────────────────────────────────────────────── */

const SNAKE = {
  // Snake from cell 22 (row 4, mid-board) back down to cell 33
  // (row 6) — a graceful S-curve down and to the left.
  fromCell: 22,
  toCell: 33,
};

const LADDER = {
  // Ladder linking cell 7 (row 1, col 3) up to cell 14 (row 2, col 3)
  // — same column, so the ladder rails sit cleanly vertical.
  fromCell: 14,
  toCell: 7,
};

/* ────────────────────────────────────────────────────────────────────
 * STOP → CELL MAPPING
 *
 * The 7 manifest stops map onto active cells distributed across the
 * 7 rows. One active cell per row keeps the journey legible:
 *
 *   stop 1 → cell  1  (row 0, leftmost)   — Foundations
 *   stop 2 → cell  6  (row 1, rightmost)  — Foundations
 *   stop 3 → cell 11  (row 2, leftmost)   — Core
 *   stop 4 → cell 18  (row 3, middle)     — Core
 *   stop 5 → cell 23  (row 4, middle)     — Core
 *   stop 6 → cell 28  (row 5, middle)     — Application
 *   stop 7 → cell 35  (row 6, rightmost)  — Application (FINISH)
 *
 * The remaining 28 cells are "transit" cells — they show only a
 * numbered marker and the path passing through.
 * ──────────────────────────────────────────────────────────────────── */

const STOP_TO_CELL: Record<number, number> = {
  1: 1,
  2: 6,
  3: 11,
  4: 18,
  5: 23,
  6: 28,
  7: 35,
};

type Props = {
  outline: CourseSection[];
};

export function CourseOutline({ outline }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  // Start drawing once a sliver of the board is on-screen.
  const inView = useInView(wrapperRef, { amount: 0.05, once: true });

  // Sort stops by their `stop` index so renders stay in path order.
  const sortedStops = useMemo(
    () => [...outline].sort((a, b) => a.stop - b.stop),
    [outline]
  );

  // Build a fast cell-index → stop lookup for active cells.
  const stopByCell: Record<number, CourseSection> = useMemo(() => {
    const map: Record<number, CourseSection> = {};
    for (const s of sortedStops) {
      const cell = STOP_TO_CELL[s.stop];
      if (cell) map[cell] = s;
    }
    return map;
  }, [sortedStops]);

  return (
    <div ref={wrapperRef} className="bs-course-board" data-surface="course">
      {/* ───────────── DESKTOP / WIDE: snake-and-ladders SVG board ───────────── */}
      <div className="bs-course-board-wide">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${VB_W} / ${VB_H}` }}
        >
          <svg
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ position: "absolute", inset: 0, display: "block" }}
            aria-hidden
            focusable={false}
          >
            {/* ------ Outer board frame: chunky 4 px brutalist border ------ */}
            <rect
              x={PAD / 2}
              y={PAD / 2}
              width={VB_W - PAD}
              height={VB_H - PAD}
              fill="var(--color-bg)"
              stroke="var(--color-text)"
              strokeWidth={4}
            />

            {/* ------ Module backgrounds: bold coloured row-spans ------ */}
            {MODULES.map((m, mi) => {
              const yTop = PLAY_Y + m.rowFrom * (CELL_H + GAP) - GAP / 2;
              const yBottom =
                PLAY_Y + (m.rowTo + 1) * CELL_H + m.rowTo * GAP + GAP / 2;
              return (
                <g key={`mod-${m.id}`}>
                  <rect
                    x={PLAY_X - GAP / 2}
                    y={yTop}
                    width={PLAY_W + GAP}
                    height={yBottom - yTop}
                    fill={`var(--course-mod-${mi + 1})`}
                  />
                </g>
              );
            })}

            {/* ------ Sub-segment cell shading: alternating tints within
                each module. Even cells in path order get the lighter
                tint, odd cells get the darker. Not a gradient — solid
                fills only. ------ */}
            {Array.from({ length: TOTAL_CELLS }, (_, k) => {
              const idx = k + 1;
              const r = cellRect(idx);
              const m = moduleForRow(r.row);
              const mi = MODULES.indexOf(m) + 1;
              const tone = idx % 2 === 0 ? "alt" : "base";
              return (
                <rect
                  key={`tone-${idx}`}
                  x={r.x}
                  y={r.y}
                  width={CELL_W}
                  height={CELL_H}
                  fill={`var(--course-mod-${mi}-${tone})`}
                />
              );
            })}

            {/* ------ Cell brutalist offsets: a duplicate "shadow" rect
                4 px down-and-right from each cell, stroked black, no
                fill — creates the tactile depth without a CSS shadow. ------ */}
            {Array.from({ length: TOTAL_CELLS }, (_, k) => {
              const idx = k + 1;
              const r = cellRect(idx);
              return (
                <rect
                  key={`shadow-${idx}`}
                  x={r.x + 4}
                  y={r.y + 4}
                  width={CELL_W}
                  height={CELL_H}
                  fill="var(--color-text)"
                />
              );
            })}

            {/* ------ Cell faces: 2 px black border, fill-on-top of the
                tone tint so the brutalist offset peeks through. ------ */}
            {Array.from({ length: TOTAL_CELLS }, (_, k) => {
              const idx = k + 1;
              const r = cellRect(idx);
              const m = moduleForRow(r.row);
              const mi = MODULES.indexOf(m) + 1;
              const tone = idx % 2 === 0 ? "alt" : "base";
              return (
                <rect
                  key={`cell-${idx}`}
                  x={r.x}
                  y={r.y}
                  width={CELL_W}
                  height={CELL_H}
                  fill={`var(--course-mod-${mi}-${tone})`}
                  stroke="var(--color-text)"
                  strokeWidth={2}
                />
              );
            })}

            {/* ------ DECORATIVE LADDER (cells 7 ↔ 13) ------ */}
            <DecoLadder fromCell={LADDER.fromCell} toCell={LADDER.toCell} />

            {/* ------ The path: a wider "drop ink" shadow under a 6 px
                black stroke. Stroke draws in via pathLength on view. ------ */}
            <motion.path
              d={BOARD_D}
              fill="none"
              stroke="var(--color-text)"
              strokeOpacity={0.18}
              strokeWidth={12}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={
                reduced || inView ? { pathLength: 1 } : { pathLength: 0 }
              }
              transition={
                reduced
                  ? { duration: 0.001 }
                  : { ...SPRING.dramatic, restDelta: 0.001 }
              }
            />
            <motion.path
              d={BOARD_D}
              fill="none"
              stroke="var(--color-text)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
              animate={
                reduced || inView ? { pathLength: 1 } : { pathLength: 0 }
              }
              transition={
                reduced
                  ? { duration: 0.001 }
                  : { ...SPRING.dramatic, restDelta: 0.001 }
              }
            />

            {/* ------ DECORATIVE SNAKE (cells 22 ↔ 33) — drawn after
                the path so it sits visually above the ink line. ------ */}
            <DecoSnake fromCell={SNAKE.fromCell} toCell={SNAKE.toCell} />

            {/* ------ START button: top centre, terracotta fill,
                chunky black border. ------ */}
            <StartButton x={VB_W / 2} y={PAD + 60} />

            {/* ------ FINISH banner: bottom centre. ------ */}
            <FinishBanner x={VB_W / 2} y={VB_H - PAD - 30} />

            {/* ------ Module labels — bold uppercase down the left
                margin against each module band. ------ */}
            {MODULES.map((m, mi) => {
              const yTop = PLAY_Y + m.rowFrom * (CELL_H + GAP);
              const yBottom =
                PLAY_Y + (m.rowTo + 1) * CELL_H + m.rowTo * GAP;
              const yMid = (yTop + yBottom) / 2;
              return (
                <g key={`mod-label-${m.id}`}>
                  <text
                    x={PAD + 12}
                    y={yTop + 16}
                    fontFamily="var(--font-mono)"
                    fontSize={12}
                    fontWeight={600}
                    fill="var(--color-text)"
                    style={{ letterSpacing: "0.12em" }}
                  >
                    {`MODULE 0${mi + 1}`}
                  </text>
                  <text
                    x={PAD + 12}
                    y={yTop + 32}
                    fontFamily="var(--font-sans)"
                    fontSize={18}
                    fontWeight={700}
                    fill="var(--color-text)"
                    style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
                  >
                    {m.label}
                  </text>
                  {/* invisible — keeps yMid referenced for future label */}
                  <text x={-9999} y={yMid} fontSize={0}>
                    {""}
                  </text>
                </g>
              );
            })}

            {/* ------ Numbered cell badges + transit markers ------ */}
            {Array.from({ length: TOTAL_CELLS }, (_, k) => {
              const idx = k + 1;
              const r = cellRect(idx);
              const isActive = stopByCell[idx] !== undefined;
              return (
                <g key={`num-${idx}`}>
                  {/* Cell number — Plex Mono, top-left of every cell. */}
                  <text
                    x={r.x + 10}
                    y={r.y + 18}
                    fontFamily="var(--font-mono)"
                    fontSize={11}
                    fontWeight={500}
                    fill="var(--color-text)"
                    style={{ letterSpacing: "0.04em" }}
                  >
                    {String(idx).padStart(2, "0")}
                  </text>
                  {/* Transit-cell centre marker: small circle at cell
                      centre when no card lives here. Active cells get
                      their card in the foreign-object below. */}
                  {!isActive ? (
                    <circle
                      cx={r.x + CELL_W / 2}
                      cy={r.y + CELL_H / 2}
                      r={6}
                      fill="var(--color-text)"
                    />
                  ) : null}
                </g>
              );
            })}

            {/* ------ Active-cell card content via foreignObject ------ */}
            {sortedStops.map((s) => {
              const cellIdx = STOP_TO_CELL[s.stop];
              if (!cellIdx) return null;
              const r = cellRect(cellIdx);
              const m = moduleForRow(r.row);
              const mi = MODULES.indexOf(m) + 1;
              return (
                <foreignObject
                  key={`fo-${s.id}`}
                  x={r.x + 8}
                  y={r.y + 26}
                  width={CELL_W - 16}
                  height={CELL_H - 34}
                >
                  <CourseStop
                    title={s.title}
                    type={s.type}
                    description={s.description}
                    icon={s.icon}
                    moduleIndex={mi}
                  />
                </foreignObject>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ───────────── MOBILE / NARROW: single-column vertical stack ─────────── */}
      <div className="bs-course-board-stack">
        <StartButtonHTML />
        <ol className="bs-board-list">
          {Array.from({ length: TOTAL_CELLS }, (_, k) => {
            const idx = k + 1;
            const r = cellRect(idx);
            const m = moduleForRow(r.row);
            const mi = MODULES.indexOf(m) + 1;
            const stop = stopByCell[idx];
            const tone = idx % 2 === 0 ? "alt" : "base";

            // Row breaks: render a module header above the FIRST cell
            // of each module.
            const showModuleHeader =
              idx === MODULES[0].rowFrom * COLS + 1 ||
              MODULES.some((mod) => mod.rowFrom === r.row && r.col === 0 && idx % COLS === 1);

            return (
              <li key={`stack-${idx}`} className="bs-board-li">
                {showModuleHeader && r.col === 0 && (
                  <ModuleHeaderHTML
                    label={m.label}
                    index={MODULES.indexOf(m) + 1}
                  />
                )}
                <div
                  className="bs-board-cell-stack"
                  style={{
                    background: `var(--course-mod-${mi}-${tone})`,
                  }}
                >
                  <span className="bs-board-cell-num">
                    {String(idx).padStart(2, "0")}
                  </span>
                  {stop ? (
                    <CourseStop
                      title={stop.title}
                      type={stop.type}
                      description={stop.description}
                      icon={stop.icon}
                      moduleIndex={mi}
                      stacked
                    />
                  ) : (
                    <span className="bs-board-transit" aria-hidden>
                      ·
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <FinishBannerHTML />
      </div>

      {/* ────── Course-surface palette + container-query toggle ────── */}
      <style>{`
        .bs-course-board {
          container-type: inline-size;
          container-name: courseboard;
          /* Course-surface register: terracotta + ochre + sage. Scoped
             to this component / data-surface=course only — DESIGN.md §3
             allows the wider palette here as a deliberate exception
             from the editorial-calm article register. */
          --course-mod-1: oklch(0.92 0.06 55);            /* terracotta wash */
          --course-mod-1-base: oklch(0.95 0.04 55);
          --course-mod-1-alt:  oklch(0.90 0.07 55);

          --course-mod-2: oklch(0.91 0.08 80);            /* warm ochre */
          --course-mod-2-base: oklch(0.94 0.05 80);
          --course-mod-2-alt:  oklch(0.88 0.10 80);

          --course-mod-3: oklch(0.91 0.05 130);           /* muted sage */
          --course-mod-3-base: oklch(0.94 0.03 130);
          --course-mod-3-alt:  oklch(0.88 0.06 130);
        }
        :root[data-theme="dark"] .bs-course-board {
          --course-mod-1: oklch(0.40 0.06 55);
          --course-mod-1-base: oklch(0.36 0.05 55);
          --course-mod-1-alt:  oklch(0.44 0.07 55);
          --course-mod-2: oklch(0.42 0.07 80);
          --course-mod-2-base: oklch(0.38 0.06 80);
          --course-mod-2-alt:  oklch(0.46 0.08 80);
          --course-mod-3: oklch(0.40 0.04 130);
          --course-mod-3-base: oklch(0.36 0.03 130);
          --course-mod-3-alt:  oklch(0.44 0.05 130);
        }
        .bs-course-board-wide { display: none; }
        .bs-course-board-stack { display: block; }
        .bs-board-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
          position: relative;
        }
        .bs-board-list::before {
          /* Vertical connector line that runs the length of the stack
             — the mobile equivalent of the path. */
          content: "";
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 4px;
          margin-left: -2px;
          background: var(--color-text);
          z-index: 0;
        }
        .bs-board-li {
          position: relative;
          z-index: 1;
        }
        .bs-board-cell-stack {
          position: relative;
          border: 2px solid var(--color-text);
          padding: var(--spacing-sm) var(--spacing-md);
          margin-bottom: var(--spacing-sm);
          min-height: 88px;
          display: flex;
          flex-direction: column;
          gap: var(--spacing-3xs);
        }
        .bs-board-cell-stack::before {
          /* Brutalist 4 px offset duplicate — pure border, no shadow. */
          content: "";
          position: absolute;
          inset: 4px -4px -4px 4px;
          background: var(--color-text);
          z-index: -1;
        }
        .bs-board-cell-num {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          color: var(--color-text);
          font-weight: 500;
        }
        .bs-board-transit {
          font-family: var(--font-mono);
          color: var(--color-text-muted);
          font-size: 14px;
        }
        @container courseboard (min-width: 720px) {
          .bs-course-board-wide { display: block; }
          .bs-course-board-stack { display: none; }
        }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Sub-components — chunky brutalist primitives.
 * ──────────────────────────────────────────────────────────────────── */

function StartButton({ x, y }: { x: number; y: number }) {
  // Pill-button geometry: 220 wide × 60 tall, centred on (x, y).
  const w = 240;
  const h = 64;
  const bx = x - w / 2;
  const by = y - h / 2;
  return (
    <g>
      {/* Brutalist offset shadow */}
      <rect
        x={bx + 6}
        y={by + 6}
        width={w}
        height={h}
        fill="var(--color-text)"
      />
      {/* Button face */}
      <rect
        x={bx}
        y={by}
        width={w}
        height={h}
        fill="var(--color-accent)"
        stroke="var(--color-text)"
        strokeWidth={4}
      />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono)"
        fontSize={20}
        fontWeight={700}
        fill="var(--color-bg)"
        style={{ letterSpacing: "0.14em" }}
      >
        ▶ START HERE
      </text>
    </g>
  );
}

function FinishBanner({ x, y }: { x: number; y: number }) {
  const w = 220;
  const h = 56;
  const bx = x - w / 2;
  const by = y - h / 2;
  return (
    <g>
      <rect
        x={bx + 5}
        y={by + 5}
        width={w}
        height={h}
        fill="var(--color-text)"
      />
      <rect
        x={bx}
        y={by}
        width={w}
        height={h}
        fill="var(--color-bg)"
        stroke="var(--color-text)"
        strokeWidth={4}
      />
      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-mono)"
        fontSize={18}
        fontWeight={700}
        fill="var(--color-text)"
        style={{ letterSpacing: "0.18em" }}
      >
        ★ FINISH ★
      </text>
    </g>
  );
}

function StartButtonHTML() {
  return (
    <div className="bs-board-html-banner bs-board-html-start">
      <span>▶ START HERE</span>
      <style>{`
        .bs-board-html-banner {
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 0.14em;
          padding: var(--spacing-sm) var(--spacing-md);
          border: 4px solid var(--color-text);
          margin-bottom: var(--spacing-md);
          text-align: center;
          position: relative;
          z-index: 2;
        }
        .bs-board-html-start {
          background: var(--color-accent);
          color: var(--color-bg);
        }
        .bs-board-html-finish {
          background: var(--color-bg);
          color: var(--color-text);
          margin-top: var(--spacing-md);
          margin-bottom: 0;
          letter-spacing: 0.18em;
        }
      `}</style>
    </div>
  );
}

function FinishBannerHTML() {
  return (
    <div className="bs-board-html-banner bs-board-html-finish">
      <span>★ FINISH ★</span>
    </div>
  );
}

function ModuleHeaderHTML({
  label,
  index,
}: {
  label: string;
  index: number;
}) {
  return (
    <div className="bs-board-mod-header">
      <span className="bs-board-mod-eyebrow">{`MODULE 0${index}`}</span>
      <span className="bs-board-mod-title">{label.toUpperCase()}</span>
      <style>{`
        .bs-board-mod-header {
          padding: var(--spacing-sm) var(--spacing-md);
          margin: var(--spacing-md) 0 var(--spacing-sm) 0;
          border-top: 4px solid var(--color-text);
          border-bottom: 2px solid var(--color-text);
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: var(--color-bg);
        }
        .bs-board-mod-eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        .bs-board-mod-title {
          font-family: var(--font-sans);
          font-size: var(--text-h3);
          letter-spacing: 0.04em;
          font-weight: 700;
          color: var(--color-text);
        }
      `}</style>
    </div>
  );
}

/**
 * Decorative ladder between two cell centres in the same column. Two
 * parallel verticals + four rungs. Drawn black; sits on top of cells
 * but below the path ink.
 */
function DecoLadder({
  fromCell,
  toCell,
}: {
  fromCell: number;
  toCell: number;
}) {
  const a = cellCenter(fromCell);
  const b = cellCenter(toCell);
  const x = a.cx;
  const y0 = Math.min(a.cy, b.cy) - 30;
  const y1 = Math.max(a.cy, b.cy) + 30;
  const railOffset = 22;
  const rungs = 5;
  const stroke = "var(--color-text)";
  return (
    <g opacity={0.85} aria-hidden>
      <line
        x1={x - railOffset}
        y1={y0}
        x2={x - railOffset}
        y2={y1}
        stroke={stroke}
        strokeWidth={4}
      />
      <line
        x1={x + railOffset}
        y1={y0}
        x2={x + railOffset}
        y2={y1}
        stroke={stroke}
        strokeWidth={4}
      />
      {Array.from({ length: rungs }, (_, k) => {
        const t = (k + 1) / (rungs + 1);
        const yy = y0 + (y1 - y0) * t;
        return (
          <line
            key={`rung-${k}`}
            x1={x - railOffset}
            y1={yy}
            x2={x + railOffset}
            y2={yy}
            stroke={stroke}
            strokeWidth={3}
          />
        );
      })}
    </g>
  );
}

/**
 * Decorative snake — a fat terracotta cubic Bezier from one cell
 * centre to another, with a small head circle and a forked tongue.
 */
function DecoSnake({
  fromCell,
  toCell,
}: {
  fromCell: number;
  toCell: number;
}) {
  const a = cellCenter(fromCell);
  const b = cellCenter(toCell);
  // Pull control points sideways for an S-shape.
  const c1x = a.cx + 140;
  const c1y = (a.cy + b.cy) / 2 - 40;
  const c2x = b.cx - 140;
  const c2y = (a.cy + b.cy) / 2 + 40;
  return (
    <g aria-hidden>
      {/* Outer black outline for brutalist contrast */}
      <path
        d={`M ${a.cx} ${a.cy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.cx} ${b.cy}`}
        fill="none"
        stroke="var(--color-text)"
        strokeWidth={16}
        strokeLinecap="round"
      />
      {/* Inner accent body */}
      <path
        d={`M ${a.cx} ${a.cy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.cx} ${b.cy}`}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      {/* Head at the FROM end (the high cell) */}
      <circle
        cx={a.cx}
        cy={a.cy}
        r={11}
        fill="var(--color-accent)"
        stroke="var(--color-text)"
        strokeWidth={2}
      />
      <circle cx={a.cx - 3} cy={a.cy - 3} r={1.6} fill="var(--color-text)" />
      <circle cx={a.cx + 3} cy={a.cy - 3} r={1.6} fill="var(--color-text)" />
      {/* Tail tip at the TO end */}
      <circle
        cx={b.cx}
        cy={b.cy}
        r={4}
        fill="var(--color-text)"
      />
    </g>
  );
}
