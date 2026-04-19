"use client";

import { Block, type BlockState } from "@/components/viz/Block";

type Props = {
  /** Bit-array width. */
  m: number;
  /** Per-cell state; indexes past bits.length default to "empty". */
  bits?: BlockState[];
  /** Labels override the default (index). Pass an empty string to hide a single label. */
  labels?: (string | number | undefined)[];
  /** Cell size in SVG units. */
  cellSize?: number;
  /** Gap between cells in SVG units. */
  gap?: number;
  /** Columns before the array wraps to a new row. Default 32. */
  wrap?: number;
  /** Force label visibility. Default: labels shown when m <= 32. */
  showLabels?: boolean;
  /** Render as a <g> group expecting a parent <svg>. Default false → own <svg>. */
  asGroup?: boolean;
  /** Translate origin when asGroup is true. */
  x?: number;
  y?: number;
};

/**
 * BitArray — the shared bit-strip substrate. Renders `m` cells as rows of
 * `<Block>`s. Used standalone for the "stamp bits" section and embedded inside
 * HashLane / FalsePositiveLab / FNVTrace as a <g>.
 */
export function BitArray({
  m,
  bits,
  labels,
  cellSize = 24,
  gap = 2,
  wrap = 32,
  showLabels,
  asGroup = false,
  x = 0,
  y = 0,
}: Props) {
  const cols = Math.min(m, wrap);
  const rows = Math.ceil(m / cols);
  const width = cols * (cellSize + gap) - gap;
  const height = rows * (cellSize + gap) - gap;
  const labelsOn = showLabels ?? m <= 32;

  const cells = [];
  for (let i = 0; i < m; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const cx = x + col * (cellSize + gap);
    const cy = y + row * (cellSize + gap);
    const state: BlockState = bits?.[i] ?? "empty";
    const explicit = labels?.[i];
    const label = explicit !== undefined ? explicit : labelsOn ? i : undefined;
    cells.push(<Block key={i} x={cx} y={cy} size={cellSize} state={state} label={label} />);
  }

  if (asGroup) return <g>{cells}</g>;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width, height: "auto" }}
      role="img"
      aria-label={`Bit array of ${m} cells`}
    >
      {cells}
    </svg>
  );
}
