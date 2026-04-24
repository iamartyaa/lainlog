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

Five live under [`components/fancy/`](../components/fancy/). First four landed in the AI-agent-traps post; `ScrambleIn` landed in the gmail polish pass. Keep this folder small and deliberate — every new primitive is overhead.

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

### `VerticalCutReveal` (✅ climax-only)

Character-level reveal: each letter slides up from a clipped baseline, staggered across the line. Shipped in the fetch-polish run (PR #27) for the post's load-bearing thesis sentence.

- **Use case**: one-shot climax moments. *The* sentence the whole post exists for. Not paragraphs. Not decoration.
- **Trigger**: `inView`, `once: true`, `amount: 0.55+`. The reveal is a payoff, not a pacing device — wait until most of the line is visible.
- **Character stagger**: 35 ms is the default for prose-length lines. DESIGN.md §9 prescribes 60 ms between *siblings*, but a sentence is sub-word units composed into one gesture — 35 ms reads as a single settle rather than a march. Do not go above 60.
- **Transform + opacity only** — the component uses `translateY` + `opacity` (DESIGN.md §9). No height or top animations.
- **Reduced motion**: auto via project-level `MotionConfig reducedMotion="user"` — transforms collapse to instant. Screen readers get the full text via `.sr-only`; per-letter spans are `aria-hidden`.
- **Layout**: renders `inline-block` with `overflow: hidden` on each word-span. Don't wrap it in flex containers that would stretch the baseline.
- **Budget**: one use per post, absolute max. Two is decoration.
- **Caveat**: the staggered reveal *is* the meaning — save it for sentences whose *pacing* carries the argument. In fetch-polish it landed *"CORS does not block the request. [beat] It blocks the response."* — request-vs-response is exactly what the character-stagger dramatises.

### `ScrambleIn` (✅ decode-moment)

Progressive character reveal with a brief scrambled tail — text assembles left-to-right while the trailing 2 characters flicker through a random alphabet until settling. Shipped in the gmail polish pass (PR for #posts/how-gmail-knows-your-email-is-taken-polish) on `NormalisationMap`'s canonical chip — every time the reader picks a new typed row, the canonical form re-scrambles and settles.

- **Use case**: a stable token that is *decoded* in place. Canonical forms (normalisation), de-obfuscated strings (steganography), hash outputs, post-decryption reveals. Not a generic "typewriter" replacement.
- **Trigger**: re-key on the upstream source value (e.g. `key={\`sc-${step}\`}`) so the component re-mounts on each change; `autoStart={true}` then scrambles on mount. For hand-controlled replays, use the `ref.start()` imperative.
- **Reduced motion**: local `useReducedMotion()` guard renders `text` directly — no intervals, no scrambled tail. Screen readers get the full value via `.sr-only` regardless.
- **Cadence**: `scrambleSpeed={60}` matches the §9 60 ms stagger grid. Defaults to 60. Do not go below 40 — characters blur together.
- **Alphabet**: scoped per-article. For email/identifier reveals, use `characters="abcdefghijklmnopqrstuvwxyz0123456789.@+"` (this is the local file's default). Never a glyph-soup alphabet with symbols that can't legally appear in the target string.
- **Budget**: one per article max — twice reads as decoration. Must teach "decode" or "normalise"; if the payload is a literal that the reader didn't type and doesn't know, don't use this primitive.

## 2.5. The full Fancy library — curation for bytesize

`fancycomponents.dev` ships 38 components. Only three are worth shipping by default; the rest land on a spectrum from *"wait for the right article"* to *"never in this register."* Consult this table before installing anything from upstream.

Ratings:
- ✅ **shipped** — already in [`components/fancy/`](../components/fancy/).
- 🔸 **candidate** — register-compatible, would earn its place on the right article. Install on demand.
- 🔹 **niche** — one very specific use-case only. Requires strong teaching justification.
- ❌ **skip** — wrong register for bytesize, or collides with a DESIGN.md ban. Don't install.

Every rating is against bytesize's editorial-calm voice (DESIGN.md §1: *precise, warm, uncompromising*) and the §9 rule that *every animation teaches*. "Skip" doesn't mean "bad component" — it means *wrong home*.

### Text components (18)

| Component | Fit | Note |
|---|---|---|
| **Text Highlighter** | ✅ shipped | Ubiquitous pacing device. See §2.1. |
| **Typewriter** | 🔸 candidate | Progressive reveal of code or a definition. Tempo teaches. Use with `once: true` and avoid cursor-blink decoration that violates §9. |
| **Vertical Cut Reveal** | ✅ shipped | One-shot climax-sentence reveal. Shipped for the thesis in the fetch-polish post (PR #27). See §2 for use. |
| **Scramble In** | ✅ shipped | Decode-moment reveal. Landed in the gmail polish pass on `NormalisationMap`'s canonical chip — the chip re-scrambles each time the reader picks a new typed row, teaching "the server rewrote this." See §2. |
| **Basic Number Ticker** | 🔸 candidate | Animated stat reveal on scroll. The agent-traps post stacks numbers (15–29%, 80%+, 23.6% → 11.2%); on a future post where numbers are the argument, animate them in. |
| **Underline Animation** | 🔸 candidate | Subtler emphasis than `TextHighlighter`. Could carry link-hover states in prose. |
| **Underline To Background** | 🔸 candidate | Essentially what `TextHighlighter` does in `ltr` direction. Install only if we decide to switch vocabulary — two components for one job is overkill. |
| **Text Rotate** | 🔹 niche | "This has many names: X / Y / Z." Useful for a glossary beat. Never as ambient cycling decoration. |
| **Letter Swap** / **Random Letter Swap** | 🔹 niche | Hover-only. Could swap letters on a defined `<Term>` to signal interactivity, but the `H2` hover-anchor already occupies that gesture space. Rarely the right reach. |
| **Scramble Hover** | 🔹 niche | Hover-scramble. Could work on a term that deliberately obfuscates — a self-referential moment about encoding. Otherwise decoration. |
| **Scroll and Swap Text** | 🔹 niche | Scroll-linked letter swap. High distraction budget. Use once, on the lede, or not at all. |
| **Text Along Path** | ❌ skip | Decorative unless the path is itself the teaching object (rare — e.g. a data-flow article). |
| **Breathing Text** | ❌ skip | Infinite ambient motion. Violates *every animation teaches* (§9). |
| **Letter 3D Swap** | ❌ skip | 3D + playful. Register mismatch. |
| **Text Cursor Proximity** | ❌ skip | Cursor decoration. No teaching payload. |
| **Variable Font And Cursor** | ❌ skip | Decorative cursor-driven font weight. |
| **Variable Font Cursor Proximity** | ❌ skip | Same. |
| **Variable Font Hover By Letter** | ❌ skip | Decorative per-letter hover. |
| **Variable Font Hover By Random Letter** | ❌ skip | Decorative. |

### Block / layout components (11)

| Component | Fit | Note |
|---|---|---|
| **Media Between Text** | ✅ shipped | Surgical use only — one per article. See §2.3. |
| **Drag Elements** | ⚠️ installed, niche | Not a good hero interaction. See §2.2 for constraints. |
| **Stacking Cards** | 🔹 niche | bytesize isn't a card-grid site (DESIGN.md §12 bans card grids on home), but for *within* a post this could work for a "peel through six traps" reveal. Reader has to scroll to advance — teaches pacing. Still tentative. |
| **Marquee Along SVG Path** | 🔹 niche | The path can be the teaching object: e.g. HTTP request/response flow along a path. Rare but powerful when it fits. |
| **Float** | 🔹 niche | Subtle ambient float on a single element. 90% decorative; 10% of the time it hints at "untethered / drifting" (e.g. an agent exploring). Use the 10%. |
| **Simple Marquee** | 🔹 niche | Scrolling headline crawl. Almost never the right reach for editorial-calm. Exception: a literal ticker of shipped CVEs or incidents. |
| **Sticky Footer** | 🔹 niche | Layout concern, not a teaching primitive. If we want one site-wide, install once; don't per-article. |
| **3D CSS Box** | ❌ skip | 3D + playful. Register mismatch. |
| **Box Carousel** | ❌ skip | 3D carousel. Playful + §12 "no card grids" grey area. |
| **Circling Elements** | ❌ skip | Infinite ambient circling. §9 violation. |
| **Screensaver** | ❌ skip | Literal screensaver bounce. Register mismatch. |

### Background components (2)

| Component | Fit | Note |
|---|---|---|
| **Animated Gradient With SVG** | ❌ skip | Decorative gradient animation. §12 one-accent + §9 every-motion-teaches. |
| **Pixel Trail** | ❌ skip | Cursor-driven pixel decoration. §9 violation. |

### Filter components (2)

| Component | Fit | Note |
|---|---|---|
| **Pixelate SVG Filter** | 🔹 niche | **The** component to reach for in a post about image steganography / LSB / pixel-level encoding — the agent-traps post discussed LSB steganography; a follow-up on adversarial images could use this to literally pixelate a sample image as the reader scrubs a bit-depth slider. Safari unsupported — check the audience. |
| **Gooey SVG Filter** | 🔹 niche | Could teach a "merging entities" concept (two nodes becoming one). Safari limited. Mostly decoration. |

### Image components (2)

| Component | Fit | Note |
|---|---|---|
| **Image Trail** | ❌ skip | Cursor-followed image trail. Pure decoration. |
| **Parallax Floating** | ❌ skip | Parallax on cursor. §9 violation. |

### Physics components (3)

| Component | Fit | Note |
|---|---|---|
| **Elastic Line** | 🔹 niche | A "tension" visual — could teach stress/constraint in a rare article. Mostly decorative. |
| **Cursor Attractor & Gravity** | ❌ skip | Playful physics toy. Register mismatch. |
| **Gravity** | ❌ skip | Same. |

### Installation discipline

- Install a Fancy component only when a specific article needs it. Don't stock the `components/fancy/` folder "for later."
- When installing, open a small PR that adds the component file only, explains which upcoming article needs it, and registers it in this doc's §2 with a real use-case entry.
- If a component turns out to be shipped-and-unused across two consecutive article ideas, remove it. The folder should never grow to look like a library shrine.
- Upstream URL convention: append `.md` to any `fancycomponents.dev/docs/...` URL to get an LLM-friendly markdown version. Useful when evaluating a component before installing it.

### Promotion criteria (🔸 → ✅)

A 🔸 candidate graduates to ✅ shipped when:
1. An article identifies a teaching moment the component uniquely serves, AND
2. The implementation clears all bans in §3, AND
3. Its caption / interaction cue can be written in one sentence, AND
4. The post ships with it.

No "just in case" installs. The Fancy library is big; bytesize stays small.

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

### Fixed outer window (mobile-first)

Added after the gmail-polish pass. The widget's outer frame — the `WidgetShell` card — must not change size while the reader interacts with it. Content inside the frame can animate, appear, disappear, rearrange; the frame stays still. When the frame reflows under a thumb, reading position jumps and focus breaks.

- [ ] **Mobile-first SVG authoring**: widget canvas widths target ~360 units as the authored width. The canvas scales *up* fluidly on desktop via `width: 100%` + `viewBox`. Never author 680-wide "desktop" canvases and bolt on `.bs-widget-scroll-at-narrow` as the mobile fallback — that's a layout leak we migrated away from.
- [ ] **Caption min-height**: `WidgetShell.tsx` caption slot reserves `min-height: 5.25em` so state-dependent caption length changes don't reflow the card. If your caption needs more than 3–4 prose lines at body size, shorten the caption — don't grow the slot.
- [ ] **Measurements-string min-width**: `WidgetShell.tsx` measurements span reserves `min-width: 8ch` and is `shrink-0`. State-dependent digit-count or label changes no longer shift the title column.
- [ ] **Stepper-total stability**: if the stepper's `total` varies between states, wrap the controls row in a `min-height` so the chips row can't collapse from two lines to one.
- [ ] **No outside-SVG widgets that appear conditionally**: if your widget wants a tie-state note, a "congratulations" message, or a "that was wrong" callout, render it *inside* the SVG with `animate={{ opacity }}`, not as an `AnimatePresence` sibling below the canvas. Otherwise the card grows and shrinks under the reader's thumb.
- [ ] **Title string must be static-shape**: pin the word count. Don't let a widget render `title={\`HashLane · ${kind} ${key}\`}` where `kind` flips between *insert* / *query* / *remove* — the title length shifts, the measurements column shifts, everything jitters. Build a stable template (e.g. `bloom · ${kind} "${key}"` where `kind` is always non-empty and one word).

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

### Hover-only cues on a touch-first brief
**What happened**: the fetch-polish review caught the shipped post directing readers to *"Hover any row below to see which part differs."* on a page whose own brief said "mobile-first." The widget itself already handled `onFocus` and `onMouseEnter`; only the prose was stranded. The same cue was triplicated — prose, widget `title`, caption — so the mismatch compounded.

**Why it slips through**: the widget works; only the *verb cue* is wrong. Authors on a desktop mouse never feel the bug. Reviewers catch it only when the brief explicitly names touch/mobile, so it can persist silently in older posts.

**Fix**:
- Verb the cue around intent, not gesture: *"Switch sides"*, *"Step through"*, *"Tap a row"* — not *"hover"*.
- If the widget supports focus/tap, add *"(or tab to)"* as the one-phrase second-best: *"Tap (or tab to) any row."*
- One cue, one location. Caption owns the verb. Title names the widget, not the interaction. Prose mentions the *mechanism*, not the affordance.
- Grep new posts for `\bhover\b` before Checkpoint 3. Any match is a candidate for review.

### Widget titles leaking CamelCase component names
**What happened**: the fetch-polish review caught `"RequestJourney · same network, different outcomes"` and `"RequestClassifier · will this preflight?"` as `WidgetShell` titles. The CamelCase identifier was reader-facing.

**Fix**: title the widget, not the component. Lowercase Plex-Sans-muted per `§4`. Strip the component name. E.g. `"request journey · same wire, different verdict"`. Add a grep for `/[A-Z][a-z]+[A-Z]/` inside `title=` props to catch this.

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
