# bytesize — Design System Spec

> The single source of truth for every UI decision in this codebase. All components must reference this doc; deviation requires updating the spec first.

## 1. Design Context

**Users.** Software and AI engineers (junior-to-senior) reading long-form technical explainers to understand a concept deeply. Primary context: evening/late-night reading on a laptop, occasionally mobile. They are skimmers first, careful readers second — visual hierarchy and widgets must survive a skim and reward a read.

**Brand personality (3 words):** _precise, warm, uncompromising._ Not "clean" (too neutral), not "friendly" (too soft), not "technical" (too cold).

**Aesthetic direction:** editorial-calm with one terracotta pulse. Nan.fyi reading rhythm × Maxime Heckel widget craft × a single unmistakable accent that doubles as the teaching signal ("bit is set" = terracotta everywhere).

**Anti-references:** Linear/Vercel/Stripe docs (too product-app). react.gg (too playful). Medium (too generic). Any dev blog with a card grid on the home page. Any page with a border-left accent stripe on a callout.

**Design principles:**

1. **Widgets are the subject, prose is the frame.**
2. **One accent, never two.** Terracotta is the only color with semantic load.
3. **Vary spacing for hierarchy.** Same-padding-everywhere = dead page.
4. **Typography over decoration.** When in doubt, let Plex carry it.
5. **Every animation teaches.** Motion that doesn't convey state is deleted.

## 2. Layout architecture (nan.fyi-coded)

```
┌────────────────────────────────────────────────────────────┐
│  bytesize                           [○ theme] [rss]        │  ← 64px static header
├────────────────────────────────────────────────────────────┤
│                                                            │
│          ╔═══════════════════════════════════╗            │
│          ║   H1 (Plex Sans, 3rem, -0.02em)   ║            │
│          ║   04 Apr 2026 · 14 min read       ║            │   Prose column:
│          ║   First paragraph in Plex Serif,  ║            │   max-width 65ch
│          ║   18px, 1.7 line-height.          ║            │   (≈ 640px @ 18px)
│          ╚═══════════════════════════════════╝            │
│                                                            │
│   ┌────────────────────────────────────────────────┐      │   Widget full-bleed:
│   │  [BitArray]                      m=16  set=5   │      │   max-width 900px,
│   │  ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐           │      │   breaks out of
│   │  │ │●│ │●│●│ │ │●│ │ │●│ │ │ │ │ │           │      │   prose column
│   │  └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘           │      │
│   │  [← prev]  [play ▸]  [next →]                 │      │   controls below
│   └────────────────────────────────────────────────┘      │
│                                                            │
│  · · · · · · · · · · · · · · · · · · · · · · · · · ·       │   Dot ornament
│                                                            │   (not <hr>)
│          ╔═══════════════════════════════════╗            │
│          ║   ## H2 (Plex Sans, 1.75rem)      ║            │
│          ╚═══════════════════════════════════╝            │
└────────────────────────────────────────────────────────────┘
```

**Measured values:**

- **Prose column**: `max-width: 65ch` (≈ 640px at Plex Serif 18px), centered.
- **Widget full-bleed**: `max-width: 900px`, centered, via `<FullBleed>`.
- **Header height**: 64px, static (not sticky — nan.fyi is static, we follow).
- **Vertical rhythm**:
  - paragraph → paragraph: `margin-block-start: 1.25em` on `<P>`
  - paragraph → H2: `margin-block-start: 2.75em`
  - H2 → paragraph: `margin-block-start: 0.8em`
  - paragraph → widget: `margin-block: 2em`
  - section ornament: `margin-block: 3.5em`
- **No TOC**, **no reading-progress bar** for MVP.

## 3. Tokens (OKLCH, 4pt spacing, semantic aliases)

All color in OKLCH — perceptually uniform. Foundation palette + semantic aliases. Neutrals are **tinted toward the terracotta hue** (28°, chroma ≈ 0.01) so grays subconsciously cohere with the accent. Never pure gray; never pure black/white.

Full canonical values live in [`app/globals.css`](./app/globals.css). Editing tokens there must update this doc.

Spacing scale uses semantic names (`--spacing-sm`, `--spacing-md`), never pixel-named tokens.

## 4. Type ramp (Plex family, 1.25 ratio)

| Token          | Size                                 | Family     | Tracking | Line-height |
| -------------- | ------------------------------------ | ---------- | -------- | ----------- |
| `--text-h1`    | `clamp(2.25rem, 1.8rem + 2vw, 3rem)` | Plex Sans  | −0.02em  | 1.05        |
| `--text-h2`    | `clamp(1.5rem, …, 1.75rem)`          | Plex Sans  | −0.01em  | 1.15        |
| `--text-h3`    | `1.25rem`                            | Plex Sans  | 0em      | 1.25        |
| `--text-body`  | `1.125rem` (18px)                    | Plex Serif | 0em      | 1.7         |
| `--text-ui`    | `0.9375rem`                          | Plex Sans  | 0em      | 1.4         |
| `--text-mono`  | `0.9375rem`                          | Plex Mono  | 0em      | 1.5         |
| `--text-small` | `0.8125rem`                          | Plex Sans  | 0em      | 1.4         |

Body is **Plex Serif at 18px, 1.7 line-height** — this is the load-bearing choice for editorial-calm.

## 5. Prose components (explicit, typed, semantic HTML)

Every piece of text inside a post is a typed JSX element. No regex classifiers, no auto-magic. Refactor-safe, a11y-correct.

| Component                             | Renders                         | Key style notes                                                                                                  |
| ------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `<Prose>`                             | `<article>`                     | `max-w-[65ch] mx-auto`                                                                                           |
| `<H1>`                                | `<h1>`                          | Plex Sans, `--text-h1`, −0.02em                                                                                  |
| `<H2>`                                | `<h2>` + hover-anchor `<a>`     | Hash `#` slides in from left in terracotta, 160ms                                                                |
| `<H3>`                                | `<h3>`                          | No anchor                                                                                                        |
| `<P>`                                 | `<p>`                           | `--text-body`, `margin-block-start: 1.25em`                                                                      |
| `<Code>`                              | `<code>`                        | Plex Mono, 0.92em, `--color-surface` bg, `2px 6px` padding, `--radius-sm`                                        |
| `<Kbd>`                               | `<kbd>`                         | Plex Mono, 1px border `--color-rule`, `1px 5px` padding                                                          |
| `<Term>`                              | `<dfn>`                         | Italic Plex Serif                                                                                                |
| `<Em>`                                | `<em>`                          | Italic Plex Serif                                                                                                |
| `<A>`                                 | `<a>`                           | `--color-accent`, underline color-mixed to `40%`, saturates on hover                                             |
| `<Callout tone="note" \| "warn">`     | `<aside>`                       | `--color-surface` bg, `--spacing-md` padding. **No border-left stripe.** Label prefix in Plex Sans small caps in `--color-accent` |
| `<Aside>` (sidenote)                  | `<aside>`                       | `--text-small`, muted, sits in prose column                                                                      |
| `<FullBleed>`                         | `<figure>`                      | Breaks prose column to `max-w-[900px]`, `margin-block: --spacing-xl`                                             |

## 6. Code blocks

- Shiki dual-theme: **`github-dark-dimmed`** (dark) + **`github-light`** (light). Single DOM, CSS-variable switched.
- Background: `--color-surface`. No distinct code-block color — stay in palette.
- Padding: `--spacing-md`.
- Font: Plex Mono at `--text-mono`.
- Copy button: top-right on hover only, Plex Sans `--text-small`.
- Line numbers: auto for blocks ≥ 10 lines. `--color-text-muted`, tabular-nums.
- Filename header: optional `<CodeBlock filename="…">`. Plex Mono `--text-small`.
- `<CodeTrace>` active line: background tint on whole line, **not** a left stripe.
- `<CodeMorph>`: shiki-magic-move wrapper for step-linked reveals.

## 7. Widget design rules

Every custom widget follows this skeleton. This is what "uniform UI" means.

```
<FullBleed>
  <Figure>
    <Header>                    ← optional
      <Title>BitArray</Title>
      <Measurements>m=16 · set=5 · FPR=2.1%</Measurements>
    </Header>
    <Canvas>…</Canvas>           ← SVG or HTML viz
    <Controls>                   ← always below, left-aligned
      <StepperBar /> <Slider />
    </Controls>
  </Figure>
</FullBleed>
```

- **Canvas** has no visible border. If a background is needed, `--color-surface` at 40%.
- **Measurement labels**: top-right of header, Plex Mono tabular-nums, `--text-small`, separated by `·`.
- **Step buttons**: Plex Sans `--text-ui`, weight 500, `8px 16px` padding, `--radius-sm`, hover text → `--color-accent`.
- **Sliders**: native `<input type="range">` styled — thumb is a 14px terracotta square.
- **Focus rings**: 2px solid `--color-accent`, 2px offset. Never removed.
- **"State set" color**: always `--color-accent`. Readers learn `terracotta = the algorithm is doing something here.`

## 8. Home page (chronological, no cards)

```
bytesize                                       [○ theme]
────────────────────────────────────────────────────────

  explainers in software and ai engineering,
  with widgets that teach.

  2026
  ───────────────────────────────────────────────
  how bloom filters work              apr 04, 2026
  a probabilistic set, in three hash lanes.

  ────
  bytesize · built by amartya · rss
```

- Year groupings as small muted Plex Sans headings.
- Post entry = title (Plex Sans, `--text-h3`) + date (Plex Mono, `--text-small`, right-aligned, tabular-nums) + one-line description (Plex Serif, `--text-body`, muted).
- **No thumbnails, no cards, no grid.** Just a list.
- The one-line description is the hook — rewrite ruthlessly.

## 9. Motion rules

- **Entry**: `SPRING.snappy` (`stiffness 500, damping 40`) for taps/toggles; `SPRING.smooth` (`stiffness 260, damping 30`) for reveals.
- **Timing fallback**: `--ease-out` (quartic), 240ms.
- **Never**: bounce/elastic, ease-in-out, linear for UI motion.
- **Animate only** `transform` + `opacity`. No width/height/margin/padding animations.
- **Height transitions**: `grid-template-rows: 0fr → 1fr`, not `max-height`.
- **`prefers-reduced-motion`**: all durations drop to `0.01ms`. Widgets must still function without motion.
- **Stagger**: 60ms between siblings.

## 10. Distinctive moves (why this isn't generic)

1. **Dot-line section ornament** (not `<hr>`): row of 20 small `·` chars in Plex Mono at 40% opacity, centered. Replaces horizontal rules.
2. **Anchor hash slides in on H2 hover**: `#` translates `-12px → 0`, fades in, terracotta, 160ms.
3. **Wordmark in Plex Mono** (not Plex Sans): header `bytesize` in Plex Mono 0.9375rem, `letter-spacing: 0.02em`.
4. **OG images**: typography-first, no stock shapes. Plex Sans title 72px, Plex Mono metadata, single 16×16 terracotta swatch.
5. **Widget "bit set" = terracotta** = link color = semantic teaching signal. Unifies brand and pedagogy.

## 11. Accessibility (inviolable)

- Body text ≥ 4.5:1 contrast; UI ≥ 3:1.
- All interactive widgets keyboard-operable. Real `<button>`, real `<input type="range">`. Never `<div onClick>`.
- Focus visible. 2px terracotta ring, 2px offset. Never `outline: none` without replacement.
- Animations respect `prefers-reduced-motion`.
- Semantic tags: `<dfn>`, `<kbd>`, `<code>`, `<time>`.
- Information conveyed via color must also be conveyed via shape/position/label.

## 12. Absolute bans

- **No `border-left` > 1px as a colored accent stripe.** #1 AI-slop tell.
- **No gradient text** (`background-clip: text` with a gradient).
- **No pure `#000` or `#fff`.** Always tint toward terracotta hue.
- **No glassmorphism.**
- **No drop shadows as decoration.** Shadows only convey elevation.
- **No card grids** on the home page.
- **No centered-everything layouts.**
- **No dashboard "big number, small label, supporting stats" layouts.**
- **No sparkline decoration.**
- **No rounded-rectangle-with-generic-shadow** buttons.
