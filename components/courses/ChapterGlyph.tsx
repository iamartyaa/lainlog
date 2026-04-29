import { pickGlyphs, RENDERERS } from "./glyph-primitives";

/**
 * ChapterGlyph — a deterministic per-chapter mark.
 *
 * Hashes the chapter slug to pick three of six geometric primitives
 * (dash · dot · arc · square · triangle · line), then arranges them in a
 * 2-column compact stack within a single 32×32 viewbox.
 *
 * Same slug → same glyph, both on the server and in the browser. See
 * `glyph-primitives.tsx` for the FNV-1a hash and renderer dictionary.
 *
 * Decorative — `aria-hidden`. Not a button, never a link target.
 */
export function ChapterGlyph({
  slug,
  size = 32,
  stroke,
  strokeWidth,
}: {
  slug: string;
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const triple = pickGlyphs(slug, 3);

  // 2-column stack: first two side-by-side at the top, third centred below.
  // Each "cell" is 16×16 within the 32×32 viewbox; the third sits centred
  // along the bottom row. We render each primitive translated into its slot.
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden
      focusable={false}
      style={{ display: "block", overflow: "visible" }}
    >
      <g transform="translate(-8 -4) scale(0.6)">
        {RENDERERS[triple[0]]({ stroke, strokeWidth })}
      </g>
      <g transform="translate(8 -4) scale(0.6)">
        {RENDERERS[triple[1]]({ stroke, strokeWidth })}
      </g>
      <g transform="translate(0 6) scale(0.6)">
        {RENDERERS[triple[2]]({ stroke, strokeWidth })}
      </g>
    </svg>
  );
}
