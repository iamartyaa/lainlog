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
- **Breakpoints**: `sm` 480 px, `md` 768 px, `lg` 1024 px (registered as `--breakpoint-*` in `@theme`). No `xl` / `2xl`. Breakpoints are authored mobile-first — everything assumes a 360 px phone until a named tier relaxes upward.
- **Home two-column**: activates at `lg:` (1024 px), not `md:`. At 768 px with a 320 px sidebar the PostList body cell collapses to ~400 px, which starves the 4-column row. Tablet-portrait (~810 px) is explicitly single-column with PostList at full width.

## 3. Tokens (OKLCH, 4pt spacing, semantic aliases)

All color in OKLCH — perceptually uniform. Foundation palette + semantic aliases. Neutrals are **tinted toward the terracotta hue** (28°, chroma ≈ 0.01) so grays subconsciously cohere with the accent. Never pure gray; never pure black/white.

Full canonical values live in [`app/globals.css`](./app/globals.css). Editing tokens there must update this doc.

Spacing scale uses semantic names (`--spacing-sm`, `--spacing-md`), never pixel-named tokens.

**Fluid spacing**: `--spacing-md` through `--spacing-3xl` are fluid via `clamp()`; `--spacing-3xs` through `--spacing-sm` remain literal pixel values. Adjacent tokens stay ≥ 6 px apart at 360 vw so the rhythm holds at phone widths.

**Widget container-query tokens**: `--flip-narrow: 560px` and `--flip-wide: 640px` are the two canonical flip points consumed by `@container widget (…)` rules across every widget. `--widget-width: min(100%, 900px)` is the single source of truth for widget-canvas width.

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

**Weight subset (Path B-lite):** Plex Serif 400/500/600 + 400 italic, Plex Sans 400/500/600, Plex Mono 400/500. Weight 700 is not rendered anywhere in the current UI; the heaviest used weight is 600 (`font-semibold`). Proper Path A (self-hosted variable fonts) is deferred to a follow-up phase once VF glyph coverage is verified against the content corpus.

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
- **Chrome**: terminal-style header bar with three muted dots (`--code-dot-red/-yellow/-green`), optional filename on the left, language badge on the right. Carve-out documented in §12. Chrome bar height is 34 px on desktop, 28 px on phone-width containers (the bar is a container-query consumer so the block adapts whether it's in prose or inside a widget).
- Background: `--color-surface`. Subtle warmer band on the chrome via `color-mix(in oklab, surface 70%, bg)` so the chrome reads as a distinct surface without a heavy border.
- Padding: `--spacing-md` default, `--spacing-sm` below the 560 px container-query breakpoint.
- Font: Plex Mono at `--text-mono`.
- Copy button: always visible, 44 × 44 tap zone, Plex Sans `--text-small`. Hidden for `tone="terminal"` (shell transcripts aren't paste fodder).
- Line numbers: on by default for `tone="default"`; off for `terminal` and `output`. `--color-text-muted` at 50 % opacity, tabular-nums.
- **`tone` prop**: `default | terminal | output`. `terminal` renders a `$` prompt on the first line (accent-coloured); `output` dims the whole body to `--color-text-muted`. The `low-contrast-output-block` audit rule surfaces every `output` block so authors confirm none are teaching code.
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
- **Sliders**: native `<input type="range">` styled — thumb visual is 14 px terracotta square. **Hit target is 44 × 44 px** via transparent `padding` + `background-clip: content-box` on the thumb pseudo-element; the visible square stays 14 px while the draggable region grows to meet the WCAG 44-px minimum.
- **Focus rings**: 2px solid `--color-accent`, 2px offset. Never removed.
- **"State set" color**: always `--color-accent`. Readers learn `terracotta = the algorithm is doing something here.`
- **Press identity**: every interactive surface gets `PRESS` feedback (`whileTap: { scale: 0.96 }` + `SPRING.snappy`). High-frequency controls (Stepper prev/next) add a `.bs-press` ring pulse ≤ 300 ms on commit. Consistent across buttons, toggles, links — so the site speaks one tactile language.
- **Hydration canvas**: every widget SSR-renders a single 6 × 6 terracotta square centred in its canvas container; the real interactive surface fades in on hydrate with `SPRING.smooth`. No spinners, no skeleton shimmer — the dot is the loading state.
- **Orientation flips**: widgets drive layout via `@container widget (…)` queries against `--flip-narrow` / `--flip-wide`, not global viewport breakpoints, so a widget embedded in a narrow column flips for its container rather than waiting for the viewport.

## 8. Home page (hatched-page two-column, nan.fyi-inspired)

The body paints a subtle 135° diagonal-hatch pattern (`repeating-linear-gradient` over `color-mix(text 5%, transparent)`). A centred `CozyFrame` — max-width 1360px, solid `--color-bg` — sits on top, so content "floats" in a flat rectangle bounded by the hatched page. No border, no shadow. Texture contrast is the frame.

Home splits into two columns at ≥ 768px:

```
┌ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ┐
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ■ bytesize                                    [○ theme]      │ │
│ │                                                              │ │
│ │                     2026                                     │ │
│ │   bytesize          ────                                     │ │
│ │                     [ico] how gmail knows …     apr 19       │ │
│ │   one question              the pipeline that …    →         │ │
│ │   per post. ten     ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌       │ │
│ │   minutes of …      [ico]  (next post)                       │ │
│ │                                                              │ │
│ │  Read by 12,483 readers   © 2026                             │ │
│ │                                                              │ │
│ │ bytesize · built by An Anonymous Engineer </>                │ │
│ └──────────────────────────────────────────────────────────────┘ │
└ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ┘
```

- **Left column** (`AboutColumn`, 320px fixed): big Plex Serif wordmark (clamp 3–4.5rem, 0.95 line-height, -0.03em tracking), about paragraph (Plex Serif body, muted, max 26ch), bottom-left meta row (reader count as a terracotta dot-matrix glyph + copyright, both in Plex Mono small). Sticky on md+.
- **Right column** (`PostList`): year heading (small muted Plex Sans caps) + list of rows. Each row is a 4-column grid on md+ (`80px · 1.1fr · 1.2fr · 32px`): square cover tile · title + date stacked · hook description · arrow. On mobile it collapses to `64px · 1fr · 24px` with the hook stacking on a second row spanning all columns. Dashed top-border (`--color-rule`) separates rows; the first row has none.
- Covers are auto-generated at `/cover/[slug]` via `@vercel/og`, per-slug hue-shifted within the terracotta family; optional `coverImage?: string` on `PostMeta` for hand-crafted overrides.
- Row hover: subtle background tint (`color-mix(accent 4%, transparent)`), cover lifts `-2px`, title shifts to `--color-accent`, arrow translates 3px right. All on the same 200ms timing.
- The hook is the one-line description — rewrite ruthlessly.

## 9. Motion rules

- **Entry**: `SPRING.snappy` (`stiffness 500, damping 40`) for taps/toggles; `SPRING.smooth` (`stiffness 260, damping 30`) for reveals.
- **Timing fallback**: `--ease-out` (quartic), 240ms.
- **Never**: bounce/elastic, ease-in-out, linear for UI motion.
- **Animate only** `transform` + `opacity`. No width/height/margin/padding animations.
- **Height transitions**: `grid-template-rows: 0fr → 1fr`, not `max-height`.
- **`prefers-reduced-motion`**: all durations drop to `0.01ms`. Widgets must still function without motion.
- **Stagger**: 60ms between siblings.
- **Page transitions**: route changes use the View Transitions API (`@view-transition { navigation: auto }`). Root fade is 280 ms opacity + 8 px y. Shared-element morphs (PostList cover → post hero tile) ride the same transition via `view-transition-name: cover-{slug}` pairs. Unsupported browsers (Firefox) fall through to instant navigation — no feature detection needed. Under `prefers-reduced-motion: reduce` the animation duration collapses to 1 ms.
- **Theme morph**: dark ↔ light toggles animate color / background-color / border-color over 240 ms via a zero-specificity `:where()` transition. During the morph the accent desaturates through `--color-text-muted` (the `accent-bridge` keyframe) so terracotta becomes the "still point" of the whole-page color flip. The `data-theme-transitioning` attribute is set synchronously in the toggle handler — `useEffect` arrives one render too late.
- **Transient press-pulses** (`.bs-press` ring, ≤ 300 ms) are the one permitted exception to the §12 drop-shadow ban. They are gesture feedback keyed to a tap, not decoration; static decorative box-shadows remain banned.

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
- **Minimum tap target 44 × 44 CSS px** on every interactive element (WCAG 2.5.5). Expand with transparent padding + negative margin where the visible glyph is smaller.
- **Hover is opt-in**: hover-only styling (underline saturation, color shifts) is gated behind `@media (hover: hover)` so touch devices don't inherit stuck-hover state after tap-release.

## 12. Absolute bans

- **No `border-left` > 1px as a colored accent stripe.** #1 AI-slop tell.
- **No gradient text** (`background-clip: text` with a gradient).
- **No pure `#000` or `#fff`.** Always tint toward terracotta hue.
- **No glassmorphism.**
- **No drop shadows as decoration.** Shadows only convey elevation.
- **No card grids** on the home page. (Inline preview images beside list-row text — as specified in §8 — are allowed and are not a card grid.)
- **No centered-everything layouts.**
- **No dashboard "big number, small label, supporting stats" layouts.**
- **No sparkline decoration.**
- **No rounded-rectangle-with-generic-shadow** buttons.

### Carve-outs from §12

1. **Code-block chrome dots.** Three 8-px dots in the `<CodeBlock>` chrome (tokens `--code-dot-red` / `-yellow` / `-green`) are the one permitted exception to the one-accent rule. They're a well-established terminal metaphor, not decoration, and their chromas are ≤ 50 % of a typical OS traffic light so they read as muted against the surface. A reviewer should confirm no decorative use creeps into other surfaces — these tokens exist solely for the code-block chrome.
2. **Transient press-pulses.** Already documented in §9 — `.bs-press` ring pulse ≤ 300 ms on commit-worthy taps is gesture feedback, not decoration.
