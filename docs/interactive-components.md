# bytesize — interactive components playbook

The reference catalogue of every widget shape we've shipped, every external primitive integrated, and every DESIGN.md-compliance lesson learned the hard way. Load this before designing or building a new widget.

Cross-reference: [`DESIGN.md`](../DESIGN.md), [`voice-profile.md`](./voice-profile.md).

---

## 1. The widget-shape taxonomy

Every widget we've shipped collapses to one of seven shapes. Pick the shape that matches the teaching claim before picking the widget's visual design.

| Shape | Teaches | Example | Core primitive |
|---|---|---|---|
| **Scripted stepper** | An ordered aha — A happens, then B, then C | `HashLane`, `BloomProbe`, `MemoryPoisonTimeline` | `<Stepper>` + SVG/HTML scenes |
| **Scrubber parameter space** | The shape of a tradeoff — "as X grows, Y does Z" | `FalsePositiveLab`, `FilterCompare` | `<Scrubber>` + live measurement bar |
| **Scenario branch** | "What happens on path X vs path Y" | `FlowDemo` | segmented control + divergent canvases |
| **Time-axis race** | Interleaving / concurrency insight | `SignupRace` | dual-lane timeline + tick controls |
| **Collapse diagram** | Many-to-one normalisation | `NormalisationMap` | SVG with layered arrows |
| **Scan / reveal** | "What the human saw vs what the agent saw" (unmask) | `HostilePageScan`, `ParseVsRender` | transform-based sweep OR segmented toggle |
| **Propagation network** | "One signal becomes many" / contagion | `InfectiousJailbreak` | SVG graph + tick-based state spread |
| **Coverage matrix** | "This defence reaches these stages, not those" | `DefenceCoverage` | CSS grid with intensity-coded cells |

**Rule**: if a proposed widget doesn't fit one of these, ask whether the teaching claim is actually one claim. Most "doesn't fit" widgets are two claims in a trench coat.

## 2. External primitives we've integrated

All three live under [`components/fancy/`](../components/fancy/) and were added in the AI-agent-traps post. Keep this folder small and deliberate — every new primitive is overhead.

### `TextHighlighter` (✅ ubiquitous)

Animated text-background swipe on in-view / hover / auto / ref.

- **Use case**: pacing device inside prose (every load-bearing sentence), and inside widget captions (on verb cues: "Press scan", "Switch sides").
- **Colour binding** (mandatory): `var(--color-accent)` at ~28% via `color-mix(in oklab, var(--color-accent) 28%, transparent)`. Never a competing colour.
- **Trigger picking**:
  - `inView` (with `once: true`, `amount: 0.55`) for prose
  - `auto` for widget-caption imperatives where the caption is already visible on mount
  - `hover` only for term-definitions in prose; never decorative
  - `ref` for controlled replays (rare)
- **Direction**: default `ltr`; never mix multiple directions in one post — that becomes decoration.
- **Density**: ≤ 2 per section. Target 10–17 per article. Beyond ~20 the signal decays; critique skill will flag.
- **Do not** use on pure decorative words. Only on thesis phrases, numbers, or action cues.
- **Alias pattern** (see article `page.tsx`): define a local `HL` helper that injects the standard transition/options so prose stays readable:
  ```tsx
  function HL({ children }: { children: React.ReactNode }) {
    return (
      <TextHighlighter transition={HL_TX} highlightColor={HL_COLOR}
        useInViewOptions={HL_OPTS} className="rounded-[0.2em] px-[1px]">
        {children}
      </TextHighlighter>
    );
  }
  ```

### `DragElements` (⚠️ niche)

Free-drag layout for multiple children, with optional momentum and `initialPositions` per child.

- **Use case**: rare. Consider before using: does editorial-calm register want dragging? Usually no.
- **What we learned**: the article-tarp post first used `<TrapDeck>` as a 6-card drag hero. Reader feedback: *"chaotic"*. Replaced with the `HostilePageScan` scanner-reveal. Lesson: **drag as a primary hero interaction doesn't fit the editorial-calm register**. Keep the primitive for future experiments but don't reach for it first.
- **If you use it**: set `dragMomentum={false}` (no physics in editorial-calm), strip any `shadow-2xl` from the card demos (§12 ban), axis-align (no random tilt), and pass `initialPositions` to distribute children — the default stacks everything at (0,0).

### `MediaBetweenText` (✅ surgical)

Inline text reveal: `<firstText> [media that expands on trigger] <secondText>`.

- **Use case**: one per article max. Inline micro-reveal that teases a widget's claim in prose.
- **Trigger**: `inView` with `once: true, amount: 0.6`. Never `hover` in prose — touch users miss it.
- **Media payload**: a small terracotta chip (not a photo) keeps it editorial. See `DomReveal.tsx`.
- **RSC caveat**: `renderMedia` is a function prop — not serialisable across the RSC boundary. If your page.tsx is RSC (no `"use client"`), wrap the `MediaBetweenText` usage in its own `"use client"` component and import it into the page. We do this with `DomReveal.tsx` exactly because `page.tsx` is RSC.

## 3. Design-system invariants — the non-negotiables

Every widget must clear every bullet. Reviewer's first pass checks these mechanically.

### Motion (DESIGN.md §9)

- [ ] Animate **only `transform` + `opacity`**. Never `top`, `height`, `width`, `margin`, `padding`. Use `translateY`/`translateX`/`scaleY`/`scaleX`.
- [ ] Springs over tweens: `SPRING.snappy` for taps/toggles, `SPRING.smooth` for reveals, `SPRING.gentle` for ambient, `SPRING.dramatic` for hero moments.
- [ ] **Never** `ease-in-out`, `linear`, `bounce`, `elastic` for UI motion.
- [ ] Every widget with timed sequences: gate durations via `useReducedMotion()` so the sequence collapses to instant under reduced motion. `motion.*` will auto-collapse transforms via the project-level `MotionConfig reducedMotion="user"`, but **animation scheduling you control** (e.g. `setTimeout`, `setInterval`) must also respect it.
- [ ] Stagger siblings at 60 ms. Not 100, not 120.

### Decoration bans (DESIGN.md §12)

- [ ] No decorative `box-shadow`. Shadows only for elevation (and even then, subtle `0 1px 2px color-mix(…)`).
- [ ] No `border-left > 1px` as a coloured accent stripe (#1 AI-slop tell).
- [ ] No gradient text.
- [ ] No glassmorphism.
- [ ] No centred-everything layouts.
- [ ] No sparkline decoration.
- [ ] No rounded-rectangle-with-shadow buttons.

### One-accent rule (DESIGN.md §3 + §10)

- [ ] Terracotta (`var(--color-accent)`) is the **only** colour with semantic load. If a widget introduces a second colour (even a "friendly" blue), strip it.
- [ ] State-set = terracotta. Active interactive = terracotta. Focus ring = 2px terracotta.
- [ ] Carve-out: code-block chrome dots (`--code-dot-red/-yellow/-green`) and transient press-pulses. Nothing else.

### Accessibility (DESIGN.md §11)

- [ ] Every interactive element ≥ 44 × 44 CSS px. Expand with transparent padding + negative margin where the visible glyph is smaller.
- [ ] Real `<button>` / `<input type="range">`. Never `<div onClick>`.
- [ ] Focus ring visible — never `outline: none` without a replacement.
- [ ] Information conveyed by colour must also be conveyed by shape/position/label.
- [ ] State-dependent `aria-label`s: if the widget has state 0 and state N, the label should describe the *current* state, not a future outcome.

### State-0 on arrival (earned the hard way)

- [ ] On mount, widgets must sit at state 0 and **wait for user interaction**. Never auto-play a teaching animation before the reader has agency.
- [ ] Captions in state 0 explicitly tell the reader what interaction to perform ("Press scan", "Tap a row", "Step through"). Highlight that verb with `TextHighlighter triggerType="auto"`.
- [ ] Reset returns to state 0, not a "nearly-done" intermediate.

## 4. `WidgetShell` conventions

Every widget wraps in `<WidgetShell>`. Consistent header/canvas/controls/caption grammar across the whole site.

```tsx
<WidgetShell
  title="hostile page · scan"                 // Plex Sans muted
  measurements="3 injections · hidden"        // Plex Mono tabular-nums, right
  captionTone="prominent"                     // "muted" (default) or "prominent"
  caption={<>teacher-voice explanation with <HL>highlighted verb cue</HL>.</>}
  controls={<button>▸ scan</button>}
>
  <svg viewBox="0 0 360 360">…</svg>          {/* canvas */}
</WidgetShell>
```

- **Title** — the widget's name. Keep to 1–4 words. Avoid jargon not introduced in prose.
- **Measurements** — always Plex Mono tabular-nums. Digits not word-numbers (`3 layers · 6 stages`, not `three layers · six stages`).
- **Caption tone**:
  - `muted` (default, pre-existing posts) — Plex Sans small, muted colour. Sidenote voice.
  - `prominent` (introduced in the agent-traps post) — Plex Serif body, full contrast, leading terracotta diamond marker. Teacher voice. Use this when the caption carries the teaching moment. Also embed a `TextHighlighter` on the key phrase for visual pull.
- **Controls** — below the canvas, left-aligned. Minimum 44×44 tap targets. Button glyphs (`▸` play, `↻` reset, `❚❚` pause) are a tactile shorthand, not decoration — use them consistently across widgets.

## 5. Anti-patterns (from actual review feedback)

### Auto-playing on mount
**What happened**: `HostilePageScan` and `InfectiousJailbreak` initially looped their teaching animation on mount. User: *"executed before the user interacts with them."*
**Fix**: state 0, explicit trigger, caption tells the reader what to press.

### Caption muted when teaching
**What happened**: captions used Plex Sans `--text-small` + `--color-text-muted` — readers skimmed past them.
**Fix**: `captionTone="prominent"` prop added to WidgetShell. Body size, full contrast, terracotta marker.

### SVG with decorative `box-shadow` glow
**What happened**: scanline had a 14 px terracotta glow. Looked atmospheric but violated DESIGN §12.
**Fix**: removed the shadow. The 2 px accent bar alone carries the affordance; the progressive gradient wash underneath does the rest.

### Animating `top` or `height`
**What happened**: scanline animated `top: 0 → 100%`, gradient wash animated `height: 0 → 100%`. Both DESIGN §9 bans.
**Fix**: `useLayoutEffect` to measure the parent canvas height into state, then animate `transform: y` (px). For the wash, `scaleY(0 → 1)` with `transformOrigin: "top"`.

### `ease-in-out` on an infinite pulse
**What happened**: `InfectiousJailbreak` seed node used `ease: "easeInOut"` on an infinite scale repeat.
**Fix**: dropped the infinite pulse entirely. The seed-node's terracotta fill + halo already reads as "patient zero"; the pulse was decorative.

### Label/verb mismatch across widget + caption
**What happened**: tab said `agent`, caption cue said "Tap **agent view**". Reader eye has to reconcile.
**Fix**: either rename the tab to match, or (better) rewrite the cue to an intent word — *"Switch sides"* instead of literal "Tap agent view".

### Duration-based tweens where springs belong
**What happened**: Three `duration: 0.2` tween crossfades on caption/centre-text transitions.
**Fix**: `SPRING.snappy` for interactive responses, `SPRING.smooth` for reveals. Tweens read as "not quite right" against the rest of the motion vocabulary.

### The drop-shadow decorative glow trap
**What happened**: whenever a widget wants to signal "something important is happening here", the first instinct is a coloured glow. Banned.
**Fix**: use typography, position, size, or a single transient press-pulse on commit (the §9 carve-out).

## 6. Widget catalogue — lessons from each

Direct links to the widgets we've shipped and what each taught us.

### `HostilePageScan.tsx` ([hero, agent-traps post](../app/posts/the-webpage-that-reads-the-agent/widgets/HostilePageScan.tsx))

- **Shape**: scan/reveal.
- **Teaches**: the parse-vs-render gap that Content Injection exploits. *Before* any prose.
- **Lessons**:
  - Hero widgets must start at state 0 with an affordance.
  - Measure the canvas with `useLayoutEffect` + `ResizeObserver` to animate `transform: y` (px) instead of CSS `top`.
  - `scaleY` from 0 → 1 with `transform-origin: top` replaces `height: 0 → 100%` perfectly.
  - Chip-track layout: CSS grid flips from 1-column to 2-column at `@container widget (min-width: 640px)`. Mobile-first.

### `AgentLoopMap.tsx`

- **Shape**: coverage/taxonomy map (ring).
- **Teaches**: the six-class taxonomy keyed to stages.
- **Lessons**:
  - SVG `viewBox` authored to 360×360 units — scales fluidly with parent.
  - Label anchor (`start`/`middle`/`end`) computed from the angle so labels don't overrun on 360 px phones.
  - Active stage: node radius + fill transition via `SPRING.snappy`. Next-stage edge highlighted via `SPRING.smooth`. Centre caption morphs via `AnimatePresence`.

### `ParseVsRender.tsx`

- **Shape**: scenario branch (human/agent toggle).
- **Teaches**: the same page rendered two ways.
- **Lessons**:
  - Tab labels must match the caption's verb cue verbatim (e.g., cue says "Switch sides" → tabs are `human view`/`agent view`).
  - Row-by-row stagger (60 ms) on the agent view creates legible reveal without feeling decorative.
  - A real HTML comment embedded in the JSX is a straight-faced craft moment — the page is literally doing what the widget teaches. Don't call attention to it; let careful readers discover it.

### `MemoryPoisonTimeline.tsx`

- **Shape**: scripted stepper (3 steps).
- **Teaches**: delayed-tool attack via memory poisoning.
- **Lessons**:
  - Two panels (context + memory) framed with consistent header/separator grammar. Stacked on mobile.
  - Memory state has three phases (empty / waiting / poisoned) animated via springs on chip arrival.
  - Captions embed `TextHighlighter auto` on the commit sentence so the punchline is unmissable.

### `InfectiousJailbreak.tsx`

- **Shape**: propagation network.
- **Teaches**: one-to-many jailbreak spread.
- **Lessons**:
  - 14 nodes, ring + 5 chord edges = readable small-world graph without crowding.
  - Deterministic positions + seeded jitter (via `(i * 13) % 7`) — no random-per-render.
  - Propagation tick is user-triggered. Each tick picks one uninfected neighbour of any infected node. The done-state is reached organically.
  - **State 0 matters** here: on mount, only the seed is infected, paused. Button flips to "reset" once done.

### `DefenceCoverage.tsx`

- **Shape**: coverage matrix.
- **Teaches**: where three defence layers reach on the agent's six stages.
- **Lessons**:
  - The previous SVG-arcs version (`DefenceSurface.tsx`, now deleted) was fragile at mobile widths. A CSS-grid matrix is inherently responsive.
  - Tap-to-isolate instead of hover — works on touch.
  - Tri-state cells (none / partial / strong) via three `color-mix` accent percentages. Shape stays the same.
  - Stage-name column headers shrink on narrow containers via `@container widget (max-width: 560px)`.

### `DomReveal.tsx` (wrapping `MediaBetweenText`)

- **Shape**: inline text reveal.
- **Teaches**: the "dom" glyph surfaces as the reader reads — a micro-echo of ParseVsRender.
- **Lessons**:
  - Must be `"use client"` because `MediaBetweenText` takes a `renderMedia` function prop; the parent page is RSC.
  - Use once per article. Two uses become decoration.

## 7. When to build a new widget

Ship a bespoke widget when:
- The teaching claim is sharp enough to fit one sentence.
- None of the seven shapes in §1 already fits.
- You expect the shape to be reused in a future post (lift to `components/viz/` at that point).

Do NOT ship a widget when:
- The claim can be taught in 2 paragraphs of prose with one code block and one `<HL>`.
- You're building a "dashboard" (multiple measurements without a single teaching insight).
- The widget's caption would be longer than the claim it teaches.

## 8. Placement rules

- **Post-local first**: `app/posts/<slug>/widgets/<Name>.tsx`. Every widget starts here.
- **Lift to `components/viz/`** only when a second post wants the same widget. Confirm with the user before lifting.
- **Shared primitives** (`Block`, `Arrow`, `Scrubber`, `Stepper`, `SvgDefs`, `WidgetShell`) are in `components/viz/`. Don't duplicate.
- **Fancy primitives** (`TextHighlighter`, `DragElements`, `MediaBetweenText`) are in `components/fancy/`. Add new fancy primitives sparingly.
