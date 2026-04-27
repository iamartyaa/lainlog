# SVG paths — a primer

A working reference for authoring complex SVG paths from scratch. Distilled from Josh Comeau's "Interactive Guide to SVG Paths" plus our own production scars.

## 1. The coordinate system

An SVG canvas has its origin `(0, 0)` at the **top-left**. X grows to the right, Y grows **downward** — the inverse of school graph paper. The `viewBox` decides what slice of that space is visible.

A path's `d` attribute is a string of single-letter commands followed by arguments. Whitespace and commas are mostly cosmetic — `M10,20L30,40` and `M 10 20 L 30 40` parse identically. Use the spaced form; future-you reads this at midnight.

## 2. Absolute vs relative

Every command has two cases:

- **Uppercase** = absolute. Numbers are coordinates in the SVG's own space.
- **Lowercase** = relative. Numbers are deltas from wherever the previous command ended.

`M 10 10 l 20 0` moves to `(10, 10)`, then ends 20 units right of there — at `(30, 10)`. Relative is great for shapes you might translate later; absolute keeps geometry anchored.

## 3. Move and line — the bones

`M` opens every path. There is no implicit starting point.

```svg
<svg viewBox="0 0 100 60">
  <path d="M 10 30 L 90 30" stroke="black" fill="none" />
</svg>
```

`L` (line-to) draws a straight segment from the current point to its argument. `H` and `V` are shorthands — `H` takes one X coordinate and holds Y constant; `V` takes one Y and holds X constant. They are the right tool for grid-aligned strokes.

```svg
<svg viewBox="0 0 100 60">
  <path d="M 10 10 H 90 V 50 H 10 Z" stroke="black" fill="none" />
</svg>
```

`Z` closes a sub-path by drawing a line back to the most recent `M`. It does not take arguments; it just *ends* things tidily.

## 4. Cubic Beziers — the workhorse

`C x1 y1, x2 y2, x y` draws a cubic Bezier curve. The current point is the start, `(x, y)` is the end, and the two intermediate pairs are **control points** that pull the curve toward themselves like invisible magnets. The first control point steers the tangent leaving the start; the second steers the tangent arriving at the end.

```svg
<svg viewBox="0 0 120 80">
  <path d="M 10 70 C 10 10, 110 10, 110 70" stroke="black" fill="none" />
</svg>
```

That's a clean arch — both control points sit high above the canvas, so the curve bows up between them.

`S x2 y2, x y` is the smooth cubic shorthand. It assumes the first control point is the **reflection** of the previous segment's second control point through the current anchor — guaranteeing a kink-free join. This is how you chain S-curves without doing reflection math by hand.

```svg
<svg viewBox="0 0 200 80">
  <path d="M 10 40 C 40 0, 70 80, 100 40 S 160 0, 190 40"
        stroke="black" fill="none" />
</svg>
```

## 5. Quadratic Beziers — the cheaper cousin

`Q cx cy, x y` draws a quadratic with a **single** control point. Less expressive than cubic but enough for most one-hump curves.

```svg
<svg viewBox="0 0 100 80">
  <path d="M 10 70 Q 50 0, 90 70" stroke="black" fill="none" />
</svg>
```

`T x y` is the smooth quadratic — like `S`, it reflects the previous control point through the current anchor and only takes the new endpoint. Use it for ribbons of waves where every hump mirrors the last.

```svg
<svg viewBox="0 0 200 80">
  <path d="M 10 40 Q 40 0, 70 40 T 130 40 T 190 40"
        stroke="black" fill="none" />
</svg>
```

## 6. Arcs — the foreign language

`A rx ry rotation large-arc-flag sweep-flag x y` is its own beast. It draws a piece of an ellipse from the current point to `(x, y)`, where:

- `rx`, `ry` are the ellipse's radii.
- `rotation` rotates the ellipse around its centre, in degrees.
- `large-arc-flag` chooses the **shorter** (`0`) or **longer** (`1`) of the two possible arcs.
- `sweep-flag` chooses the arc that sweeps **counter-clockwise** (`0`) or **clockwise** (`1`).

Two binary flags = four possible arcs for any pair of endpoints and radii. If your radii are too small to span the gap, the browser silently scales the ellipse up while preserving the `rx:ry` ratio.

```svg
<svg viewBox="0 0 100 80">
  <path d="M 20 60 A 30 30 0 0 1 80 60" stroke="black" fill="none" />
</svg>
```

That's a half-circle bulging upward. Flip `sweep-flag` to `0` and it bulges down. Flip `large-arc-flag` to `1` and it goes the long way around.

## 7. Control points and curve smoothness

The shape of a Bezier is dictated entirely by where its control points live relative to the anchors. Useful intuitions:

- **Pull farther → curve bulges harder.** If a cubic's control points are tucked against the start and end anchors, the curve degenerates to a near-straight line. Drag them outward and the curve inflates.
- **Tangent direction = direction from anchor to its control point.** That's why smooth joins (`S`, `T`) work — by reflecting the prior control point, the new tangent enters at the same angle the old one left, so no visible corner.
- **Symmetric control points around the midpoint = symmetric curve.** Asymmetric placement skews the apex one way.

For 90° turns at the end of a row (we use these in the snake-and-ladders board), place the two cubic control points such that the first leaves horizontally and the second arrives vertically:

```svg
<svg viewBox="0 0 100 80">
  <path d="M 20 30 C 70 30, 80 40, 80 70"
        stroke="black" fill="none" />
</svg>
```

## 8. Debugging path problems

Paths fail silently. The browser draws *something*, just not what you wanted. A few moves recover sanity:

1. **Visualize control points.** While iterating, scatter tiny `<circle>` markers at every coordinate in your `d` string. The shape of the resulting constellation tells you instantly whether a control point is in the wrong quadrant, or whether you forgot to negate a Y delta.

2. **Watch out for arc flags.** The two flags are unlabelled `0` or `1` digits — easy to swap. If your arc bulges the wrong way or takes the long way around, flip one flag at a time. There are exactly four states; bisect.

3. **Mismatched anchor counts.** A `C` consumes six numbers; a `Q` consumes four; an `A` consumes seven. Off-by-one means the parser silently re-roles your numbers and the path collapses. When debugging, reformat the `d` string with one command per line and count arguments by eye.

4. **Relative-vs-absolute drift.** A lowercase command sneaking into an absolute sequence will translate the rest of the path to the current pen position. If a path renders fine but jumps to the wrong place, scan the case of every letter.

5. **Round small numbers.** Paths with 8-decimal coordinates render fine but defeat human review. Round to one or two decimals before committing — diffs become readable, and the visual difference is invisible.

6. **`getPointAtLength` is your truth-source.** When you need to place a marker exactly on a path, query the path with `getPointAtLength(fraction * getTotalLength())` from JS. Eyeballing positions over a curve never works the second time the geometry changes.

7. **Acute angles bevel.** Sharp joins clip under the default `stroke-miterlimit`. Bump it (`stroke-miterlimit="100"`) or switch to `stroke-linejoin="round"` if the corner reads chunky-bevelled instead of crisp.

The path syntax rewards small-DSL discipline: name sub-paths in comments, keep one command per line while drafting, and never trust a curve until you've seen it rendered.
