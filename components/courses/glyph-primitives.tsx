/**
 * glyph-primitives — six canonical SVG primitives + deterministic picker.
 *
 * Used by <ChapterGlyph> to give every chapter a distinctive systematic mark
 * (Q3=b). Same chapter slug always renders the same triple, so SSR and CSR
 * agree byte-for-byte.
 *
 * SSR safety (banked feedback v2-independent #2b)
 *   The hash is pure-string FNV-1a. No TextEncoder, no Buffer, no platform
 *   APIs. Identical output on Node and browser. Pure-deterministic.
 */

export type PrimitiveKind =
  | "dash"
  | "dot"
  | "arc"
  | "square"
  | "triangle"
  | "line";

export const PRIMITIVES: PrimitiveKind[] = [
  "dash",
  "dot",
  "arc",
  "square",
  "triangle",
  "line",
];

/**
 * FNV-1a 32-bit string hash. Walks the input as UTF-16 code units (matches
 * `string.charCodeAt`). Pure string in / unsigned int out — no encoder
 * dependencies. Deterministic and stable across rebuilds.
 */
export function fnv1a(input: string): number {
  // 32-bit unsigned arithmetic via Math.imul + zero-fill shift.
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Pick `k` distinct primitives from PRIMITIVES, deterministically seeded
 * by `slug`. Result preserves order — different orderings of the same
 * three primitives produce visually different glyphs, which is the point.
 *
 * Algorithm: Fisher–Yates shuffle, with successive pseudo-random draws
 * from the FNV-1a hash mixed with each step's index. Take the first k.
 */
export function pickGlyphs(slug: string, k = 3): PrimitiveKind[] {
  const pool = [...PRIMITIVES];
  const out: PrimitiveKind[] = [];
  let h = fnv1a(slug);
  for (let i = 0; i < k && pool.length > 0; i++) {
    // Mix `h` with i to advance the seed without re-hashing.
    h = Math.imul(h ^ (i + 0x9e3779b9), 0x85ebca6b) >>> 0;
    const idx = h % pool.length;
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

/* -------------------------------------------------------------------------
   Dev-only assertion (banked feedback v2-independent #12)

   Confirms the five mcps slugs produce five distinct primitive triples.
   Runs once at module-import time in dev; stripped by the bundler in prod.
   ------------------------------------------------------------------------- */
if (process.env.NODE_ENV !== "production") {
  const SLUGS = [
    "what-is-an-mcp",
    "why-build-mcps",
    "the-design-reasoning",
    "what-purpose-they-serve",
    "why-needed-today",
  ];
  const seen = new Set<string>();
  for (const s of SLUGS) {
    const key = pickGlyphs(s, 3).join("|");
    if (seen.has(key)) {
      // Don't throw — just warn so a future course doesn't crash dev.
      // eslint-disable-next-line no-console
      console.warn(
        `[glyph-primitives] mcps slug "${s}" collides with another slug at triple "${key}". Adjust pickGlyphs ordering or the slug list.`,
      );
    }
    seen.add(key);
  }
}

/* -------------------------------------------------------------------------
   Render helpers — one tiny path-set per primitive, all sized to a 32×32
   viewbox. Exported as a record so <ChapterGlyph> can do a constant-time
   lookup without a switch/case in the render path.
   ------------------------------------------------------------------------- */

export type PrimitiveRenderer = (props: {
  /** Stroke colour — typically `var(--color-accent)`. */
  stroke?: string;
  /** Stroke width inside the 32×32 viewbox. */
  strokeWidth?: number;
}) => React.ReactNode;

import type * as React from "react";

const STROKE_DEFAULT = "var(--color-accent)";
const SW_DEFAULT = 2;

export const RENDERERS: Record<PrimitiveKind, PrimitiveRenderer> = {
  dash: ({ stroke = STROKE_DEFAULT, strokeWidth = SW_DEFAULT }) => (
    <line
      x1="6"
      y1="16"
      x2="26"
      y2="16"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  ),
  dot: ({ stroke = STROKE_DEFAULT }) => (
    <circle cx="16" cy="16" r="3" fill={stroke} />
  ),
  arc: ({ stroke = STROKE_DEFAULT, strokeWidth = SW_DEFAULT }) => (
    <path
      d="M 6 22 A 10 10 0 0 1 26 22"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      fill="none"
    />
  ),
  square: ({ stroke = STROKE_DEFAULT, strokeWidth = SW_DEFAULT }) => (
    <rect
      x="9"
      y="9"
      width="14"
      height="14"
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill="none"
    />
  ),
  triangle: ({ stroke = STROKE_DEFAULT, strokeWidth = SW_DEFAULT }) => (
    <path
      d="M 16 7 L 26 24 L 6 24 Z"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      fill="none"
    />
  ),
  line: ({ stroke = STROKE_DEFAULT, strokeWidth = SW_DEFAULT }) => (
    <line
      x1="16"
      y1="6"
      x2="16"
      y2="26"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  ),
};
