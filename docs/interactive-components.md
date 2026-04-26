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
| **Premise quiz** | "Predict X — most readers fail, here's why" | `PredictTheStart` (event-loop post) | `<Quiz>` (see §2) wrapping the snippet + options |

**Rule**: if a proposed widget doesn't fit one of these, ask whether the teaching claim is actually one claim. Most "doesn't fit" widgets are two claims in a trench coat.

### Premise quiz — the article-anchor opener (added after PR #45)

When a post explains a non-obvious *order*, *outcome*, or *output* — event-loop firing order, hoisting trace, type-coercion result — open with a quiz the reader is *expected* to fail. The wrong answer is the article's reason to exist; the verdict copy steers them in.

**Shape**: a hard code snippet (or scenario), 4 multiple-choice options, a verdict that flips on click. The 4 options model real wrong mental models, not random distractors.

```tsx
// PredictTheStart.tsx pattern
<WidgetShell title="predict the output" caption="…">
  <CodeBlock>{HARD_SNIPPET}</CodeBlock>
  <OptionGrid options={FOUR_PLAUSIBLE} onSelect={onPick} />
  <Verdict
    state={pickState}
    wrong="Most readers miss this. Now we'll learn how this output emerges."
    right="You've seen this before. Let's see why it produces this output."
  />
</WidgetShell>
```

**Why it works as an opener**:
- The reader's wrong answer creates demand for the explanation. They came for entertainment; now they have a question.
- A single, specific snippet anchors the article. The narrative can reference *the snippet's letters / lines / ECs* rather than abstract examples — every section reinforces the opener.
- A reader who answers correctly still gets a verdict ("let's see why") that carries them in.

**Discipline**:
- **Aim for ~80% fail rate**. Not a trick, not a typo trap — a genuinely hard order/output question. If a reader who hasn't read the article would get it right by intuition, the snippet is too easy.
- **Distractors must be plausible** — each option is a real mental model. (Sync-first, microtasks-before-macros, FIFO across all queues, etc.)
- **One quiz per article**, at the very top. Two is a shape collision.
- **Reference the snippet through the article**, but with restraint — 3-4 callbacks is enough; don't shoehorn it into every paragraph.
- **Reveal-answer escape hatch**: a small "Reveal answer" link routes to the same "we'll learn how" verdict. Don't punish readers who'd rather not guess.
- **Frame-stable**: reserve vertical space for the verdict before any answer is given (use `min-h-*` or similar). The container size never changes after click.

The closer should refer back to the opener: *"Run the opener again. The order isn't a riddle anymore — it's the sequence the runtime had to take."* This closes the loop and lets the reader retry with their new mental model.

## 2. External primitives we've integrated

Five ship in articles (`TextHighlighter`, `MediaBetweenText`, `VerticalCutReveal`, `DragElements`, `Stack`). One — `ScrambleIn` — is installed but doesn't yet have a real article home; it landed during the gmail polish pass on a `NormalisationMap` that turned out not to need it (the rewritten widget shows transformations explicitly, which teaches more than a scramble dramatising "something happened"). The primitive stays in the folder waiting for a post that's genuinely *about* decoding. Keep this folder small and deliberate — every new primitive is overhead, and a primitive in search of a use is the worst kind of overhead.

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

### `DragElements` (⚠️ niche — almost always the wrong primitive)

Free-drag layout for multiple children, with optional momentum and `initialPositions` per child.

- **Use case**: rare. Consider before using: does editorial-calm register want dragging? Usually no.
- **What we learned (round 1)**: the agent-traps post first used `<TrapDeck>` as a 6-card drag hero. Reader feedback: *"chaotic"*. Replaced with the `HostilePageScan` scanner-reveal. **Drag as a primary hero interaction doesn't fit the editorial-calm register.**
- **What we learned (round 2 — the harder lesson)**: the hoisting/TDZ post (PR #46) tried `DragElements` for a call-stack visualization on user request. Round-2 shipped it; user reviewed and reversed: *"draggable feels overdone here. Instead a simple call stack and execution context interface could be used with arrows pointing to what is happening and where and how."* Round-3 replaced it with a static stack + animated push/pop springs + an SVG arrow connecting the active code line to the active EC. **Drag is wrong for any *sequenced* or *structured* concept (stacks, queues, ordered traces). Position carries meaning in those mechanics — letting the user move cards arbitrarily destroys the metaphor.**
- **The decision rule**: only reach for `DragElements` when the affordance *teaches* — sorting unrelated items into bins, organising ambiguously-positioned things, or any scenario where the *point* is "you decide where these go." For anything where the runtime decides position (a call stack pushes; a queue dequeues from the front), use static layout + motion springs + `<AnimatePresence>` instead. Try the static-with-arrow-annotations approach first.
- **If you do use it**: set `dragMomentum={false}` (no physics in editorial-calm), strip any `shadow-2xl` from the card demos (§12 ban), axis-align (no random tilt), and pass `initialPositions` to distribute children — the default stacks everything at (0,0).

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

### `ScrambleIn` (🔸 installed, awaiting the right article)

Progressive character reveal with a brief scrambled tail — text assembles left-to-right while the trailing 2 characters flicker through a random alphabet until settling.

It was first slotted into the gmail post's normalisation widget. That widget was then rewritten as `NormalisePipeline` (transformations shown one stage at a time), which teaches the mechanism explicitly and obviates the scramble. Lesson: ScrambleIn dramatises "something is happening" without teaching what; reach for it only when *decoding* is itself the subject — never as a generic typewriter alternative.

- **Use case**: a stable token that is *decoded* in place. Canonical forms via opaque hashing (not staged transformations), de-obfuscated strings (steganography), post-decryption reveals where the cipher operation isn't itself worth showing. Not a generic "typewriter" replacement.
- **Trigger**: re-key on the upstream source value (e.g. `key={\`sc-${step}\`}`) so the component re-mounts on each change; `autoStart={true}` then scrambles on mount. For hand-controlled replays, use the `ref.start()` imperative.
- **Reduced motion**: local `useReducedMotion()` guard renders `text` directly — no intervals, no scrambled tail. Screen readers get the full value via `.sr-only` regardless.
- **Cadence**: `scrambleSpeed={60}` matches the §9 60 ms stagger grid. Defaults to 60. Do not go below 40 — characters blur together.
- **Alphabet**: scoped per-article. For email/identifier reveals, use `characters="abcdefghijklmnopqrstuvwxyz0123456789.@+"` (this is the local file's default). Never a glyph-soup alphabet with symbols that can't legally appear in the target string.
- **Budget**: one per article max — twice reads as decoration. Must teach "decode" or "normalise"; if the payload is a literal that the reader didn't type and doesn't know, don't use this primitive.

### `Quiz` (✅ shipped — premise-quiz wrapper)

`components/widgets/Quiz.tsx`. Reusable wrapper for any *predict / pick the right answer* widget. Renders the question (prose, code, anything), a randomised option list, and a verdict that flips on pick. Replaces the bespoke "code snippet + multiple-choice + verdict" assemblage from `PredictTheStart` with one primitive that any future quiz can lean on.

- **API**: `question`, `options: { id, label }[]`, `correctId`, `onAnswered?(correct, chosenId)`, `randomize` (default `true`), `rightVerdict`, `wrongVerdict`, `revealable` (default `true`). The caller owns the question content — the wrapper does not impose a code-block layout.
- **When to use**: the *Premise quiz* shape from §1. Open an article whose teaching is a non-obvious *order*, *outcome*, or *output*, and you want the reader's wrong intuition to create demand for the explanation.
- **Anti-uses**: *not* a comprehension check at the end of an article (interrupts reading flow), *not* a poll (no right answer), *not* a tutorial step gate.
- **Randomisation**: Fisher–Yates on mount via lazy `useState`. Order is stable across re-renders; only re-shuffles on a fresh page load. The `id` is preserved across the shuffle so correctness checks survive.
- **Right path**: chosen option pulses (`scale 1 → 1.04 → 1`, ~250 ms) and emits a small terracotta spark burst via `<ClickSpark>` wrapped around the correct option. Border + background highlight to terracotta. `rightVerdict` reveals beneath.
- **Wrong path**: chosen option does a one-shot keyframe nod (`x: [0, -6, 6, -4, 4, 0]`, ~350 ms) and gets a desaturated muted-grey border + slight `filter: saturate(0.4)`. The CORRECT option *also* highlights so the reader still leaves with the answer. `wrongVerdict` reveals beneath.
- **Reveal-answer escape hatch**: a `reveal answer` text-button below the options routes to the wrong-path verdict (no shake) and highlights the correct option. Disable with `revealable={false}` for cases where guessing is the whole point.
- **One-accent discipline**: terracotta is the only colour with semantic load. *Wrong* reads via desaturation + the nod + verdict copy — never a red. *Right* reads via the highlight + pulse + sparks — never a green. (DESIGN.md §3 / §10.)
- **Frame-stability**: the verdict slot reserves `min-height: 2.5em` before any answer is given so the container does not reflow on pick. R6 from `docs/svg-cover-playbook.md` applies to widgets too.
- **Reduced motion**: nod + pulse collapse to opacity-only feedback; `<ClickSpark>` becomes a pure pass-through (no canvas, no rAF). Verdict still reveals.
- **Mobile-first**: options stack as a 1-col grid on narrow widths, flip to 2-col at `@container quiz (min-width: 480px)`. Tap targets ≥ 44 px.
- **Accessibility**: `role="radiogroup"`, each option `role="radio"` with `aria-checked`. Roving `tabindex`. ArrowDown / ArrowRight → next, ArrowUp / ArrowLeft → prev. Enter / Space invokes the button. Verdict region is `aria-live="polite"`.
- **Migration note**: `PredictTheStart` is **not** migrated to `<Quiz>` yet. The wrapper is intentionally a separate primitive first; the migration is a future pass.

### `Stack` (✅ shipped — used in `CallStackECs`)

`components/fancy/stack-cards.tsx`. Vendored from [React Bits](https://reactbits.dev/components/stack). An absolutely-positioned card pile with z-ordering — each card sits on top of the previous via `transformOrigin: '90% 90%'` plus a `rotateZ` and `scale` derived from depth. Optional drag-to-reorder, optional autoplay rotation. Used in `CallStackECs` to visualise the JS execution-context pile where the *runtime* owns push/pop order, not the user.

- **Use case**: any "stack with depth that the runtime owns" mechanic — call stacks, undo/redo states, layered modal contexts. The teaching moment is *"a thing pushes onto the top of a pile, the pile is taller now"*; Stack lets the pile grow without the *outer container* growing.
- **Frame-stability win**: the Stack's outer `<div>` is a fixed-size relative box; every card is `absolute inset-0`. Push two more cards or pop them — the bounding box is identical. Perfect for widgets where dynamic depth would otherwise force sibling regions to reflow.
- **Bytesize-specific overrides**:
  - `disableDrag` prop added — when `true`, cards never receive drag handlers. The runtime owns push/pop in CallStackECs; the user shouldn't move cards arbitrarily (cf. the `DragElements` lesson — drag destroys position-as-meaning).
  - `mode?: "messy" | "tidy"` prop added — picks the layout grammar for the pile. `"messy"` (default) preserves upstream behaviour: cards rotate around `transformOrigin: 90% 90%` and scale per depth; reads as a casually tossed pile. `"tidy"` zeroes rotation and offsets each card behind the top *upward* by `depth * 12 px` with `transformOrigin: top center`, so the top edge of every lower card peeks above the active one — a deck of cards on a desk. Pick **tidy** when depth identity matters to the reader (call stacks: "is there a frame underneath multiply?"); pick **messy** when only the top is the question. The Stack primitive owns position + rotation + scale; depth-aware borders/backgrounds are a caller concern (`CallStackECs` paints a terracotta border-saturation gradient on each card body to amplify the depth read without drop-shadows).
  - `useReducedMotion()` branch — under reduced motion, cards mount in their final stacked layout with zero rotation, zero stagger and unit scale; springs collapse to instant. (DESIGN.md §9.)
  - CSS inlined — no separate `Stack.css` import. Tailwind utility classes plus inline `style={{ perspective: 600 }}`.
  - Default `cards = []` — upstream defaults to four Unsplash placeholder images; we drop them so the bundle has no network image dependency.
- **Anti-uses**: not for sequenced concepts where order matters and the reader reads the order linearly (queues, traces, ordered tracks). Stack obscures every card except the top one — that's a feature for "show me what's on top" but a bug for "show me the whole sequence." Use static layout + `<AnimatePresence>` for those (cf. the `DragElements` anti-use note above; the same logic applies in reverse here — Stack is the right reach when the *top frame* is the question, the wrong reach when the *whole order* is the question).
- **Caller contract**: pass `cards: ReactNode[]` with bottom-of-stack first, top-of-stack last. The last card in the array is visually on top. The Stack handles z-ordering, rotation, and scale; the caller owns each card's body styling.

### `ClickSpark` (✅ shipped — internal to `<Quiz>`)

`components/fancy/click-spark.tsx`. Vendored from [React Bits](https://reactbits.dev/animations/click-spark). Canvas-based radial spark burst on click — N short lines fan out from the click point, each travelling `sparkRadius` px before fading.

- **Use case**: correct-answer celebration inside `<Quiz>`. Not for general decoration. Don't sprinkle this on buttons across the site.
- **Bytesize override**: default `sparkColor` is `var(--color-accent)` (terracotta) instead of upstream `'#fff'`. Bytesize is dark-canvas-default and the accent is the only semantic colour.
- **Reduced motion**: renders as a no-op (children only, no canvas, no rAF, no click hook). DESIGN.md §9.
- **Layering**: the wrapper is a `position: relative; display: inline-block; width: 100%` span; the canvas overlays at `inset: 0` with `pointer-events: none` so it doesn't intercept clicks on the wrapped subtree.
- **Don't reach for it directly**. If you need a celebration that isn't a quiz answer, write the moment from primitives (a one-shot scale + a `TextHighlighter` + a verdict line) before reaching for sparks. Sparks-as-decoration violates §9.

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
| **Scramble In** | 🔸 installed | Tried in the gmail polish but ejected when the better widget made it unnecessary. Stays in `components/fancy/` waiting for a post about *decoding*. See §2. |
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
| **Stack** | ✅ shipped | Vendored as `components/fancy/stack-cards.tsx` for `CallStackECs` (hoisting/TDZ post). Used to visualise an EC pile whose *outer container size is invariant* regardless of depth — the absolute-positioned cards rotate + scale per depth instead of consuming layout space. See §2 entry. |
| **Stacking Cards** | 🔹 niche | Distinct from the shipped `Stack` above — this is the scroll-to-peel variant. For *within* a post this could work for a "peel through six traps" reveal. Reader has to scroll to advance — teaches pacing. Still tentative. |
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
  captionTone="prominent"                     // "prominent" by default for teaching captions
  caption={<>teacher-voice explanation with <HL>highlighted verb cue</HL>.</>}
  controls={<WidgetNav value={step} total={N} onChange={setStep} />}
>
  <svg viewBox="0 0 360 360">…</svg>          {/* canvas */}
</WidgetShell>
```

- **Title** — the widget's name. Keep to 1–4 words. Avoid jargon not introduced in prose.
- **Measurements** — always Plex Mono tabular-nums. Digits not word-numbers (`3 layers · 6 stages`, not `three layers · six stages`). **Never** put `step n/N` here — `WidgetNav` owns the step counter so duplicating it confuses the reader's eye.
- **Caption tone**:
  - `prominent` is the **default** whenever the caption is a complete sentence the reader will read for the teaching. Plex Serif body, full contrast, leading terracotta diamond marker. Teacher voice. Embed a `TextHighlighter` on the key verb cue for visual pull.
  - `muted` is for sub-sentence sidenotes only — measurement labels, "tap to step" verb cues without supporting prose, parenthetical remarks. Plex Sans small, muted colour.
  - The shape test: if the caption explains *what state the widget is in right now*, it's prominent. If the caption labels *what to do*, it's muted.
- **Controls** — below the canvas, centred (the controls slot is `flex flex-wrap items-center justify-center mx-auto`). Minimum 44×44 tap targets. Step controls use `<WidgetNav>` exclusively (see §4.5).
- **One verb per widget shell**: a single widget's controls slot should ask for one decision from the reader — step through, scrub a value, toggle a mode. When you find yourself stacking a stepper + a mode toggle + a side-action button, split the widget. The earned exception is `RequestClassifier` (the post's primary teaching beat is *the five-dial decision space*); document any other carve-out you propose.

### 4.5 `WidgetNav` — the canonical step-controls primitive

`components/viz/WidgetNav.tsx` (since the widget-overhaul PR). One morphing-pill nav bar that absorbs prev / play / next + the single step counter for the whole widget. Replaces the legacy `<Stepper>`, which is now a thin shim.

- **When to reach for it**: any widget whose teaching is a *sequence of steps*. If the reader's question is "what comes next?", the answer is `<WidgetNav>`.
- **Frame stability**: the bar's height is invariant across state. The indicator pill animates `transform` (translate + scale), not `width`/`height`, so the surrounding caption and canvas never reflow.
- **Goo filter**: scoped per-instance via `useId()` — every nav has its own `<filter>` with a unique id. No document-root coordination required. Reduced motion drops the filter and teleports the pill.
- **Auto-play discipline**: the IntersectionObserver pauses autoplay when the nav scrolls off-screen — battery-life requirement on mobile when many widgets share a page. Reduced-motion users get a 1800 ms cadence instead of the default 900 ms so each step reads as an instant rather than a flicker-reel.
- **Accessibility**: `aria-current="step"` on the active button; the counter `aria-live` toggles to `off` while autoplay is running so screen readers don't get flooded; `counterNoun` overrides the announced noun (`"tick"` instead of `"step"` for `RenderLoom`).
- **Props you'll actually pass**: `value`, `total`, `onChange`, optionally `playable={false}` (for non-autoplay widgets), `playInterval` (custom cadence), `counterNoun` (when "step" reads wrong), `ariaLabel`.
- **Stepper deprecation**: `<Stepper>` is preserved as a shim that forwards to `WidgetNav` for one release, so external imports survive. Migrate your callsite to `<WidgetNav>` directly when you touch the widget.

### 4.7 Mobile-first widget building (v2 — added after the queue-race + call-stack-ECs redesigns)

The two widgets in [`MicrotaskStarvation`](../app/posts/the-line-that-waits-its-turn/widgets/MicrotaskStarvation.tsx) and [`CallStackECs`](../app/posts/how-javascript-reads-its-own-future/widgets/CallStackECs.tsx) shipped first as desktop-shaped layouts that broke on mobile and changed the shell's outer size during interaction. The user's note was clear: *"for mobile devices we are able to render it nicely on the entire screen and the layout or the size of the overall component doesn't change on interactions."* These guidelines codify the rebuild so future widgets start mobile-first by default.

**1. The 360 px first rule.** Every widget is designed for a 360 px viewport before any larger breakpoint. Ergonomic minimums:
- Tap target ≥ 44 × 44 CSS px on every interactive element (`min-h-[44px]` plus padding sized for the glyph).
- Body / chip / line font size ≥ 11 px; UI-control font size ≥ 12 px.
- No element is clipped at 360 px. Buttons may use icon + short label (e.g. `↻ self-sched`) instead of full sentences so the controls row stays single-line.
- Horizontal scroll is permitted **inside** a bounded region (e.g. `overflow-x-auto` on a queue strip when chips exceed viewport width) but **never** on the widget shell itself.

**2. R6 frame-stability rule for widgets.** The shell's `width × height` MUST NOT change during interaction. Every region whose contents grow or shrink (queues filling, console writing, EC stack pushing, verdict revealing) reserves a fixed `min-height` so growth happens *inside* the reserved space, not by pushing siblings around. Variable content beyond the reservation scrolls **internally** (e.g. console pane scrolls past 6 lines without growing). Concrete pattern from `MicrotaskStarvation`:

```css
.bs-qrace-strip { min-height: 168px; overflow-x: auto; }   /* micro queue */
.bs-qrace-console { min-height: 148px; max-height: 192px; overflow-y: auto; }
```

Forbidden: animating `width`, `height`, `top`, `left`, `viewBox`, or any geometric SVG attribute on the shell or any region container. Use `transform`, `opacity`, and `motion.div` `layout` only.

**3. Container queries over viewport breakpoints.** Widgets sit inside articles whose container width is narrower than the viewport. Drive layout flips off the *render context*, not the device:

```css
@container widget (min-width: 720px) { … }   /* not @media (min-width: 1024px) */
```

`WidgetShell` already declares `container-type: inline-size`. The 720 px breakpoint is the canonical "ok, we have room for two columns" threshold — same as `CallStackECs` and `MicrotaskStarvation`.

**4. Vertical-stack-on-mobile, side-by-side-on-desktop pattern.** Author the mobile shape first; promote to two columns at the container breakpoint. The mobile-only down-glyph (`↓` between code and stack panes in `CallStackECs`) is *always rendered* and toggled visible / hidden via CSS so `:nth-child` indices stay stable across both layouts.

```
mobile (< 720 px)            desktop (≥ 720 px)
┌───────────────┐            ┌──────────┬──────────┐
│ controls      │            │ controls (full row)  │
├───────────────┤            ├──────────┼──────────┤
│ region A      │            │ region A │ region B │
├───────────────┤            ├──────────┤ (spans)  │
│   ↓ glyph     │            │ region C │          │
├───────────────┤            └──────────┴──────────┘
│ region B      │
├───────────────┤
│ region C      │
└───────────────┘
```

**5. Code rendering inside widgets — the RSC + `codeSlot` pattern.** Use [`<CodeBlock>`](../components/code/CodeBlock.tsx) for any syntax-highlighted snippet. CodeBlock is a server component (async); widgets are typically `"use client"`. The pattern: `page.tsx` (RSC) renders the `<CodeBlock>` and passes it to the widget as a `codeSlot: ReactNode` prop. The widget overlays interactive layers (e.g. an active-line wash) on top with absolute positioning + `useLayoutEffect` + `ResizeObserver` to measure the rendered Shiki `span.line` rows. Never re-implement Shiki client-side; never animate the Shiki HTML itself.

```tsx
// page.tsx (RSC)
<CallStackECs codeSlot={<CodeBlock code={SNIPPET} lang="javascript" />} />

// widget.tsx ("use client")
type Props = { codeSlot?: ReactNode };
// in JSX:
<div ref={codeSlotRef} className="codeslot">
  <ActiveLineWash rect={washRect} />
  {codeSlot}
</div>
```

Languages registered in [`lib/shiki.ts`](../lib/shiki.ts): `typescript`, `tsx`, `javascript`, `jsx`, `bash`, `python`, `json`, `http`, `html`. Anything else: add it there in a separate PR before using.

**Caveat — snippet exports must NOT live in the client widget file.** Next wraps every export from a `"use client"` module as a client reference, including string constants. Importing `CALL_STACK_SNIPPET` from the client widget into the RSC page hands `<CodeBlock code={...}>` a *function* instead of a string, which prerender catches as `TypeError: a.replace is not a function`. Put the snippet in its own `*.ts` file alongside the widget (e.g. `CallStackSnippet.ts`, no `"use client"`) and import it from both sides. See `app/posts/how-javascript-reads-its-own-future/widgets/CallStackSnippet.ts` for the working example.

**6. Reduced-motion contract for widgets.** Every widget MUST branch on `useReducedMotion()`. The reduced path collapses to: opacity-only crossfades; `pathLength` reveals teleport to 1; `layoutId` indicators appear in their final position rather than gliding. Pattern:

```tsx
const reduce = useReducedMotion();
<motion.div
  initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={reduce ? { duration: 0 } : SPRING.smooth}
/>
```

`setTimeout` / `setInterval` cadences should also gate on `reduce` — auto-step cadences double, fire-delay falls to 0, console-caret blink stops.

**7. Accessibility minimums.**
- `aria-live="polite"` on regions that announce state changes — tick counter, current EC, console pane, queue length.
- `role="group"` + `aria-label` on every controls strip.
- `role="radiogroup"` / `role="radio"` for option groups (premise quiz, scenario tabs).
- Focus rings preserved (no `outline: none` without a replacement). Tap targets ≥ 44 × 44 px (rule 1).
- Keyboard nav: arrow keys + Enter for ordered controls; Tab to focus and Enter / Space to fire for buttons.
- State-dependent `aria-label`s name the *current* state, never a future outcome.

**8. Frame-stability checklist (run before push).**
- [ ] Every variable-content region has a fixed `min-height`.
- [ ] No element animates `width` / `height` / `viewBox` / `top` / `left` / geometric SVG attributes. Only `transform`, `opacity`, `pathLength`, motion-derived `cx` / `x1`.
- [ ] Outer shell renders identically at 360 px and at the lg breakpoint between idle / mid-step / post-step. (Open dev-tools, set viewport to 360 × 800, screenshot at idle, click through, screenshot again — outer rect identical.)
- [ ] No horizontal overflow on the widget shell at 360 px.
- [ ] Reduced-motion path verified: animation collapses without breaking layout.
- [ ] Tap targets all ≥ 44 px high — including the small icon-only buttons.
- [ ] Container queries (not viewport `@media`) drive every layout flip.

This sub-section is the doc anchor future widget tasks will cite. Cross-reference: [`mobile-first-verification.md`](./mobile-first-verification.md) for the project-wide mobile audit script.

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

### Simulating a real performance hazard inside a teaching widget
**What happened**: the event-loop post (PR #45) round-2 shipped a `MicrotaskStarvation` widget with a real self-rescheduling `Promise.resolve().then(loop)` (capped at 500 hops / 1000 ms) and a click-me button that genuinely stopped responding while the loop ran. User feedback: *"I still don't understand the point of this. Also it feels like leaking memory of least optimised."* The honest mechanism (real recursion) read as a bug, not a lesson — readers can't tell a deliberate freeze from a broken page.

**Fix**: replace real-hazard simulations with **state-machine simulations**. Round-3 rebuilt the widget as Queue Race: a deterministic state machine with a self-scheduling-microtask button capped at 6 hops, no real timers, no real Promise chain, no rAF consumption. Same teaching outcome; the reader sees the rule, doesn't experience a real freeze. **A teaching widget should never make the reader's tab actually unresponsive — even briefly, even safely-capped.** If the mechanism in the article is performance-fragile, abstract it into pure state.

### DragElements for sequenced or structured concepts
**What happened**: PR #46 round-2 used `DragElements` for a call-stack visualization. User pushed back: *"draggable feels overdone here. Instead a simple call stack and execution context interface could be used with arrows pointing to what is happening and where and how."*

**Fix**: see the updated `DragElements` entry in §2 — drag destroys the metaphor for any concept where position is the runtime's, not the user's. For stacks, queues, traces, and ordered mechanisms: static layout + motion springs + `<AnimatePresence>` for enter/exit + an SVG arrow overlay (desktop) or matched-highlight pair (mobile) for cross-pane "thread of execution" annotation. The PR #46 round-3 `CallStackECs` is the canonical example.

### Clanky transitions when stepping through scripted content
**What happened**: the event-loop post's `RuntimeSimulator` shipped with raw style updates between Next/Prev steps — call-stack frames remounted, queue chips popped in/out, the program-counter highlight teleported. User: *"the animation feels clanky a bit when the next and prev buttons are clicked. Make the animation smooth."*

**Fix** — three patterns make scripted-stepper widgets glide:
1. **Shared element transitions** for indicators that move between fixed positions — wrap the parent in `<LayoutGroup id="...">` and give the moving indicator a `motion.<el> layoutId="..."`. The program-counter highlight that walks code lines, the active EC card outline that moves up/down the stack — these need `layoutId`, not remount-fades.
2. **`<AnimatePresence>` for items that enter/exit** — queue chips, stack frames, EC cards. `motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={SPRING.smooth}`. Without `<AnimatePresence>`, exiting items pop instantly because React unmounted them before motion could animate exit.
3. **Spring transitions everywhere movement happens** — never raw `style.top` / `style.transform`. Use `motion.<el> animate={{ y: targetY }} transition={SPRING.smooth}`. The canonical "smooth" spring for this codebase: `{ type: "spring", stiffness: 240, damping: 28, mass: 0.8 }`. Use `SPRING.snappy` for press feedback, `SPRING.smooth` for traversal.

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

## 9. Animated cover components

Every post on the home list and post-page hero tile renders a bespoke
React SVG component instead of the auto-generated raster from
`/cover/<slug>`. The route still serves the deterministic typographic PNG
for OG / social-share embeds (Twitter, LinkedIn, Slack previews — animation
is impossible there); in-app rendering bypasses it.

**Entry point**: `<PostCover slug={…} size="thumb" | "hero" />` in
`components/covers/PostCover.tsx`. Internally it switches on slug, picks
the matching component from a registry, and mounts it inside a shared
`<CoverFrame>` that owns:

- Sizing (64×64 base, 80×80 from `lg`).
- The `view-transition-name: cover-<slug>` pairing on the outer wrapper —
  not on the animated SVG inside, so the morph runs on a still snapshot
  and ambient animation continues underneath.
- The `useInView` gate. Off-screen → cover renders the static end-state
  and never schedules a rAF. The `inView` boolean reaches per-cover
  components via `useCoverInView()` (a React context).

### Adding a cover for a new post

1. Create `components/covers/<Name>Cover.tsx`, exporting a function that
   returns a `<g>` of paths/rects/circles. The wrapper supplies the
   `<motion.svg viewBox="0 0 100 100">` — your component fills it.
2. Register the slug → component in
   `components/covers/PostCover.tsx`'s `REGISTRY`.
3. Read `useCoverInView()` and `useReducedMotion()` to gate animation;
   when either says no, render the static end-state.

### Animation budget per cover (hard rules)

- **One animation primitive per cover.** Either one element pulses, or
  one path draws, or one element drifts — not all three. A derived
  signal (a `useTransform` of a single motion value) counts as the same
  primitive, not a second one.
- **Loop period ≥ 6 seconds** (active phase + idle gap). The home list
  must feel calm at rest.
- **Phase offsets**: stagger `delay` across the home-list set (0s, 1.4s,
  2.8s, 4.2s, 5.6s for the current 5 covers). Goal: no two covers peak
  at the same instant.
- **Viewport-paused**: `inView === false` → no animation, render the
  static end-state.
- **Reduced-motion** → render the static end-state, which is always the
  *teaching frame* (the meaningful moment — e.g. the arrow at the wall,
  the magnifier over the glyph, the closure's outer scope dimmed), never
  the animation's start or terminus.
- **Tokens-only**: `var(--color-accent)` and `var(--color-text-muted)`.
  No hex, no gradient, no drop-shadow (DESIGN.md §3, §12).
- **Frame-stability hard rule R6**: the wrapping `<motion.svg>`
  dimensions never change. Animate `transform`, `opacity`, `pathLength`,
  or motion-value-derived attributes (`cx`, `x1`). Never animate
  `width` or `height` on the container.
- **Thumbnail readability**: design at 100×100 viewBox; verify at
  ~64×64 px (4× downscale). Use
  `vector-effect="non-scaling-stroke"` so 1.5px strokes survive the
  downscale. Bump dot/glyph radii if they approach single-pixel collapse.

### When to bypass the system (rare)

Only one escape hatch: `coverImage?` on `PostMeta` is preserved as a
deprecated emergency override path. It is not consumed by `<PostCover>`
today; if a future post needs a hand-cropped raster, wire it through
the registry by adding a static-image cover component instead of
re-introducing the field.
