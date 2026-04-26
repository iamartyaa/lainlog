# bytesize — voice profile

The reference document for how every bytesize post should *sound* and *feel*. Derived from the author's edits on post #1 ("How Gmail knows your email is taken, instantly") and captured here so future drafts don't drift.

This doc is loaded at Phase E of the `/new-post` workflow. When any rule here conflicts with a one-off kernel.md decision, this doc wins unless the conflict is explicitly resolved at Checkpoint 2 or 3.

---

## 1. The frame

**A bytesize post is a short, playable story about one product moment.** It is not a paper, a lecture, a system-design-interview answer, or an algorithm tutorial.

Every post answers a question the reader has already felt (*"how does X feel so fast?"*, *"what actually happens when I click Y?"*). The answer is delivered through a flow the reader can *play*, not a chain of derivations.

## 2. Framing rules

- **Title is a scene, not a mechanism.** "How Gmail knows your email is taken, instantly" beats "How Bloom filters work" every time. If your working title names an algorithm or data structure, the framing is probably wrong.
- **Opener is second-person, present tense, one short paragraph.** *"You type an email, reach for Tab, and — before your finger lifts — the form says already taken."* No third-person editorial distance; no historical setup.
- **First widget lands within the first 150 words.** The reader earns agency before they earn explanation. See `FlowDemo` at the top of the gmail post.
- **The mechanism is the interior reveal, not the headline.** If the post quietly depends on a Bloom filter, name it on first appearance inline, black-box the details (unless the whole post is about it), and keep moving.

## 3. Prose rules

- **Engineer-story voice, not paper voice.** "Google's published target for Spanner point reads is under 5 ms at the median" is fine; "asymptotically, a k-hash filter achieves (1 − e^(−kn/m))^k" is not. If the sentence would be at home in a journal, cut it.
- **Numbers are felt, not derived.** "Three hundred milliseconds is about a blink" beats "RTT ≈ 3 × 10⁻¹ s." When math appears, introduce it plainly: *"double the memory, the mistake rate drops by about this much."*
- **Rare terms defined in ≤ 8 words.** "Strict serialisability — a promise that, from the outside, it's as if every transaction happened one at a time." Not "for a total order σ consistent with real-time partial order, …"
- **Citations go in `<Aside>`, `<Callout>`, or inline `<A href>` links.** Never `(Bose et al. 2008)`-style parenthetical references in body prose.
- **No cliffhangers, no "next bytesize" teasers.** Every post stands alone. The closer lands on the reader's new capability, not on a pointer forward. Exception: one-sentence "this connects to X" if the connection is genuinely load-bearing.
- **Cut to the bone — but don't cap a section.** Total `<P>` prose runs in a soft band of ~1500–2200 words for a 12–15-min post. **No max length per section** — right-size each one to the concept's cognitive arc. Per user direction (post #46 / #47): *"there shouldn't be any max length limit per section in any of my articles, I am ready to go above and beyond limits if it's necessary to introduce a concept better."* If a section needs 800 words to land its mechanism cleanly, take 800 — landing the concept is the gate. The signal of bloat isn't word count, it's meandering: if the prose has stopped advancing the argument, cut. See §12 for the full pattern.

## 4. Widget rules

- **≥ 50 % of sections carry an interactive.** 3–5 widgets for a typical post. Fewer than 3 widgets in a long-form post is a red flag.
- **One widget, one insight.** If the widget can't collapse to a single sentence of takeaway, it's doing too much. Split it, or cut the secondary payload.
- **Widgets show branching when the topic has branches.** When the flow forks (bloom filter → 2 outcomes; sign-up → race winner/loser), the widget must let the reader *click into each branch* and watch it play out. Branching in prose alone is a miss.
- **"Little details on a mechanism" = a small inline animated view, not a black-box link.** If the reader's question is "wait, how does that work?", give them a ~10-line widget that shows the mechanism's state advancing step by step. Don't punt to someone else's site.
- **Show first, tell after.** The widget's first frame + caption should be enough for the reader to form a guess. Prose that follows refines or corrects that guess, it doesn't pre-load it.
- **Design-bankable patterns** (all compose from `components/viz/` primitives + `WidgetShell`):
  - **Scripted stepper walk-through** for authored-aha moments (HashLane, BloomProbe).
  - **Scrubber-driven parameter space** for "the shape of the tradeoff" (FalsePositiveLab, FilterCompare, FlowDemo scenario selector).
  - **Scenario-branching flow** for "what happens on path X vs path Y" (FlowDemo).
  - **Time-axis with dual controls** for race/interleaving insights (SignupRace).
  - **Collapse-to-canonical diagram** for many-to-one rewrites (NormalisationMap).

## 5. Widget craft (DESIGN.md cross-references)

- **Always `<FullBleed><WidgetShell>...</WidgetShell></FullBleed>` at top level.** Title in Plex Sans muted, measurements top-right in Plex Mono tabular-nums, canvas centred, controls left-aligned below, caption under controls.
- **One accent, terracotta.** Bit-set = filled terracotta; active state = filled or outlined terracotta; focus = 2 px terracotta. Never introduce a second accent for emphasis.
- **Shape + position + label carry every state.** Color is a fourth channel, never the only one. (Circle/triangle/square for hash identity; filled-square vs outlined-X for race winner/loser; shape-based streaming/static badges.)
- **Keyboard-operable by default.** Real `<button>` and `<input type="range">`; no `<div onClick>`. Focus rings via the global `:focus-visible` rule.
- **`SPRING.snappy` for taps and scrubber steps; `SPRING.smooth` for reveals.** Never bounce/elastic. Never animate width/height — only `transform` + `opacity`.
- **Respect `prefers-reduced-motion`.** The `MotionConfigProvider` in `app/layout.tsx` handles this globally for `motion/react` springs. Don't undo it.
- **Audio is a delight beat. Default off.** Wire user-triggered events to one of the eight Tier-1 sounds via `playSound()` from `@/lib/audio`. Never on autonomous animation, hover, or keypress. See [`audio-playbook.md`](./audio-playbook.md).

## 6. Structural patterns

- **Opening scene → flow widget → zoom sections → closing payoff.** The gmail post is the prototype:
  - §1 scene (~80–150 words)
  - §2 flow widget (interactive, covers the whole story at one level)
  - §3–§N zoom sections, each with its own widget that dives on one layer
  - §N+1 closer (~100–200 words, agency handoff)
- **The payoff story closes the loop.** If §3 set up normalisation, the closing pitfall section should cash it in (Netflix dot-scam). Closers that don't connect back feel tangential.
- **Callouts are for "the one rule to remember."** Use `<Callout tone="note">` sparingly — at most 2 per post — to flag the takeaway a reader should carry away. Warn-tone callouts are for genuine security/correctness traps, not general caution.

## 7. What not to write

- **No academic derivations.** If you catch yourself writing "Taking the log of both sides…", the post is drifting. Put the derivation in an Aside or cut it.
- **No Redis-vs-Memcached-vs-etcd comparison essays** as interior detours. Mention the choice honestly ("Google uses Memcache-class, not Redis; Shopify uses Memcached; different names, same job"), then move on.
- **No architecture tours that aren't grounded in the scene.** Every layer the post names must serve a question the scene raised. If the tour would pause to explain something the reader didn't ask about, cut it.
- **No "in conclusion"-style summaries.** The closer reads as *"here's what you can now do"*, not *"here's what we covered"*.
- **No decorative animation.** Every motion must convey state change. If the widget "breathes" for personality with no meaning, delete it (DESIGN.md §9).

## 8. Tone calibration examples

From the gmail post, all intentional:

- ✅ *"You type an email on the Gmail sign-up page, reach for Tab, and — before your finger lifts — the form says already taken. It doesn't feel like a check. It feels like Gmail already knew."*
- ✅ *"The filter can lie about yes, never about no."*
- ✅ *"Both clients saw available while typing; only the database's serial ordering at commit decides who actually got the address."*
- ✅ *"Google knew there was one canonical form; Netflix didn't. That gap is the attack surface."*

From the retired bloom-filters draft, all voice-drift:

- ❌ *"A useful question, for some of the code you write: is this thing in my set?"* (editorial, not scene-first)
- ❌ *"For any m worth caring about is approximately e^(−kn/m)"* (paper voice)
- ❌ *"The corrected formula was itself flawed, derives the correct exact formula using a balls-and-bins model, and provides a numerically stable way to compute it."* (derivation drift)

## 9. Post-style patterns (added after the agent-traps post)

A post where the subject is an abstract framework (vs a concrete product moment) justifies some additional moves. These don't replace §§1–8; they extend them for framework-explaining posts.

### Argument-claim H2s with a numeric eyebrow

For taxonomy/framework posts with numbered classes, replace label-style H2s (*"1 · Content Injection — Perception"*) with argument-claim H2s preceded by a Plex Mono eyebrow carrying the numeric filing tag:

```tsx
<SectionH2 eyebrow="1 · Content Injection" id="content-injection">
  The page the agent reads is not the page you see.
</SectionH2>
```

The eyebrow does the encyclopedic work; the H2 carries the claim. Combined, they outperform a label by a wide margin — a scanner sees *"The page the agent reads is not the page you see."* and reads on; they see *"1 · Content Injection — Perception"* and skim past.

### Lede pattern: inversion first, backstory as contrast

For framework posts, open `§1` on the thesis itself, not on the history that led to it. The recap becomes a contrast clause in paragraph 2, not the opening move.

```
❌  For a decade, attacking a model meant …  [then arrives at the inversion in ¶2]
✅  You don't break the model — you break the page it reads.  [¶1 opens here, already highlighted]
    For a decade the fight was inside the network — gradients, adversarial pixels,
    poisoned weights. That's not what's happening to AI agents on the web.  [¶2 contrast]
```

### Closer pattern: the inversion, alone

Framework posts reward ending on the inversion stated plainly, often borrowing the paper's own closing line. The sibling post ends by correcting its own title in one italic sentence. The agent-traps post ends on *"what our most powerful tools will be made to believe."* followed by a single centred terracotta dot.

Don't recap the sections. The dot-line ornament + the closing `<HL>` carry it.

### `<TextHighlighter>` (HL) as a pacing device — default on every post, applied with judgment

Every post lands an `HL` helper in `page.tsx` (identical signature across the catalogue — copy from `app/posts/the-webpage-that-reads-the-agent/page.tsx:28–52`) and uses TextHighlighter on a small handful of load-bearing phrases. Binds to `var(--color-accent)` at 28% via `color-mix`. Never a second colour, never a second direction. See [`interactive-components.md §2`](./interactive-components.md) for trigger discipline.

**Default cadence**: ~5 highlights for a 12–15-min post. The original target of "10–17" was carpet-bombing in practice — readers stop noticing the wash by the eighth one. Reserve highlights for: the inversion in the lede, mechanism first-appearances, section payoffs, and the closer's payload (when not handled by `VerticalCutReveal`). Never wrap connective tissue; never wrap two adjacent phrases; never wrap the same phrase twice.

**Apply judgment, not a quota**: if a section's payoff is already carried by its widget, don't double up by also highlighting a sentence about it. Less is more — every highlight should feel like the reader noticed something the author wanted them to notice. Carpet-bombing the post desensitises readers to the device; restraint preserves its weight.

### The "every defence is already bypassed" rhythm

When demonstrating that the obvious defence has already failed, a three-item list with named CVEs / incidents hits harder than three chained sentences:

```
Every "obvious" defence a reader in 2023 might propose has been bypassed in a shipped POC:

- **CSP** — bypassed, repeatedly. EchoLeak routed exfil through an open redirect on a Teams subdomain …
- **User confirmation on tool calls** — bypassed (CVE-2025-53773). Copilot wrote …
- **Command allowlists** — bypassed (CVE-2025-55284). Claude Code's allowlisted ping became …
```

## 10. Feedback memory cross-reference

Four memories back this document. If any gets updated, this doc must update too.

- `feedback_post_tone.md` — accessible, not academic.
- `feedback_post_framing.md` — product moment, not data structure.
- `feedback_design_confirmed.md` — widget craft + one-accent visuals are the bar.
- `feedback_widget_density.md` — flows over essays; show branches, don't describe them.

This doc is the shipping version of the feedback. Memories are the raw capture; the doc is the refined rules.

## 11. SEO surface — descriptive title, lyrical subtitle (added after PR #45 + #46)

Both the event-loop post and the hoisting/TDZ post shipped first with poetic-only headings (`"The line that waits its turn"`, `"How JavaScript reads its own future"`). User pushed back on both: *"Improve the title and subtitle for SEO optimisation and the title should be very clear on what the article is all about."* The fix was the same pattern in both cases: descriptive H1, lyrical subtitle, both visible on the page; meta `<title>` mirrors the descriptive H1, not the lyrical phrase.

### The split

```ts
// metadata.ts — canonical pattern
const VISIBLE_HEADING = "JavaScript Event Loop Explained: Microtasks and the Call Stack";
const LYRICAL_TAGLINE = "The line that waits its turn";
const HOOK = "How the JavaScript event loop schedules microtasks before timers, why await feels seamless, and why one runaway Promise can freeze a tab.";

export const subtitle = LYRICAL_TAGLINE;

export const metadata: Metadata = {
  title: `${VISIBLE_HEADING} — bytesize`,           // SEO surface — descriptive
  description: HOOK,                                 // 160-char ceiling
  keywords: [/* 8–10 terms */],                      // helps internal indexing
  alternates: { canonical: `${SITE}/posts/${SLUG}` },
  openGraph: { title: ..., description: ..., type: "article", publishedTime: "..." },
  twitter:   { title: ..., description: ..., card: "summary_large_image" },
};
```

The page renders **both**: the descriptive `<h1>` matches `VISIBLE_HEADING`; the lyrical subtitle sits beneath in muted Plex Mono. SEO surface gets the keyword payload; the reader gets the poetic frame as the eyebrow they'll remember.

### Length discipline

- `metadata.title`: ≤ 70 chars (60 ideal — Google truncates around 60–70 in SERP). Trim the brand suffix if it pushes over.
- `metadata.description`: ≤ 160 chars (Google SERP truncation). Front-load the keyword sentence.
- `keywords`: 8–10 terms, lowercased, including domain phrases (`"javascript event loop"`, `"temporal dead zone"`, `"call stack"`). Helps internal indexing even where Google deprecates it.
- `alternates.canonical`: always set to the post URL. Prevents duplicate-content dilution if the post is ever re-syndicated.
- `openGraph.publishedTime`: include from the `metadata.ts`. Helps article-card renderers and SEO crawlers.

### Why this is a voice file's problem

The split between descriptive and lyrical *is* a voice decision. The lyrical phrase is the part that sounds like bytesize; the descriptive heading is the part that earns the click. Both belong on the page — the lyrical line is what the reader recognises in their browser tab eyebrow, but it's not what the search engine indexes. Don't ship a poetic-only title and call it stylish; the article will not surface for the keywords it actually teaches.

### Phase H validation gate

When validating a post, the SEO sweep is part of the gate (`pipeline-playbook.md §H`):
- title length ≤ 70 chars
- description length ≤ 160 chars
- `keywords` array present
- `alternates.canonical` set
- OG + Twitter mirror title + description
- Visible H1 matches `VISIBLE_HEADING` exactly
- `subtitle` export matches `LYRICAL_TAGLINE`

## §12. Patterns from the two-flagship release (event-loop + hoisting/TDZ)

Two posts shipped back-to-back in late April 2026 — *"JavaScript Event Loop Explained: Microtasks and the Call Stack"* (`the-line-that-waits-its-turn`) and *"JavaScript Hoisting, the TDZ, and the Call Stack Explained"* (`how-javascript-reads-its-own-future`). The user's verbatim direction after the pair landed: *"I am deeply in love with the pedagogy, the tone, the writing manner, the layout, the interactive components of [these two articles]. update our content creation guidelines to follow and adhere to these for voice profiling, layout, preface and overall structure."*

These patterns are additive — they don't replace §§1–11, they extend them for posts that teach a non-obvious order, output, or mechanism.

### §12.1. The premise-quiz opener as the article anchor

**Rule.** Open the post with a hard quiz the reader is expected to fail — a `<PredictTheStart>`-style W0 widget (see [`interactive-components.md §1`](./interactive-components.md), Premise quiz row) that surfaces a snippet, asks for the predicted output / order, and reveals a wrong answer most readers will give. The wrong answer creates demand for the explanation; everything that follows pays the demand back.

**Example** (event-loop opener, `the-line-that-waits-its-turn/page.tsx`):

```tsx
{/* §0 — the quiz hook */}
<P>
  Before we explain anything, try the snippet below. Read it once, then
  guess the order it prints. Most readers get this wrong on the first
  try — and <HL>the gap between your guess and the truth is exactly
  what this post fills</HL>.
</P>

<PredictTheStart />
```

The opener's snippet/scenario stays referenced through the body. §1 names *why* `A`, `F`, `H` print first; §3 names *why* `B` lands last; §4 names *why* `G` doesn't sit next to `F`; §6 (the closer) tells the reader to scroll back and re-run the opener. Every later section reinforces the opener's puzzle.

The hoisting post does the same with a smaller snippet (`console.log(x); var x = 5;`) and walks four sections back to it.

**When not to use.** Posts where the topic is a product moment / system tour rather than a non-obvious mechanism (e.g. the Gmail post). Those still want a flow widget within 150 words (§2), but the opener is a scene, not a quiz. The quiz opener is for posts whose central question is "what does this do, and why?"

### §12.2. Mechanism-first reframe, not feature-first taxonomy

**Rule.** Both flagship articles begin from the *mechanism* — the engine reads ahead; the loop drains microtasks first — and not from a feature taxonomy (`var` vs `let` vs `const`; microtasks vs macrotasks vs the call stack). The taxonomy is a *consequence* of the mechanism, presented after the mechanism is in the reader's hands.

**Example** (hoisting post, §1):

> "The trick isn't that `var` moved anywhere. *Nothing moves. The engine walks the body once before any of it runs.* On that first pass — call it the creation phase — every `var`, every `let`, every function declaration, every parameter gets a binding installed in the function's memory."

§2 then runs the four declaration-kind cases. The taxonomy isn't the lesson; it's a *check* — does the mechanism explain what each kind does at line 1? Yes, and that's the proof.

The TDZ article reframes hoisting + TDZ + call stack as **"one mechanism, not three quirks."** The closer (§5) lands on it: *"Hoisting, the TDZ, functions callable from above — three names for one mechanism."*

**When not to use.** Posts where the topic IS a taxonomy (the agent-traps post, with its four-class framework). Those want argument-claim H2s per class (§9), not a prior mechanism. The mechanism-first reframe is for posts where two or three concepts are usually taught separately *but share a single underlying machine*.

### §12.3. The "many-views-of-one-mechanism" structural device

**Rule.** When teaching a system whose pieces are usually taught separately, present them as multiple views of one mechanism. The closing recap names the mechanism explicitly.

The event-loop post does this with two queues + the call stack — they're not three things, they're three views of "the loop only reaches into its queues when the stack is empty, and the microtask queue drains first."

The hoisting post does it with hoisting + TDZ + execution context — three names for the creation-phase pre-walk.

**Closer formulation:** *"X, Y, and Z — three names for one mechanism."* (or its variant: *"the rule that lets [X feel seamless] is the same rule that lets [Y stall the tab]."*) Then a single italic line restating the mechanism. Then a single centred terracotta dot.

**Example** (event-loop closer):

> "The line that waits its turn is the task queue. The line that *doesn't* is the microtask queue — it gets drained completely, every checkpoint, before anything else moves. One rule explains why `await` works, why `setTimeout(0)` is never zero, and why one runaway Promise stalls your whole tab."

**When not to use.** Single-concept posts (one widget, one insight) — they don't have multiple views to unify. Use this when the article frames itself as resolving an apparent contradiction or merging concepts the reader thinks of separately.

### §12.4. Inline `<Aside>` for engine implementation details

**Rule.** Use `<Aside>` for "if you want to go one level deeper" beats — V8 preparser citations, ECMA-262 §10.2.x references, browser-convergence history, libuv vs HTML-spec divergence, V8 fast-path optimisations. Without the Aside the article would lose technical credibility; with it the main flow stays readable.

The aside is **never** load-bearing for the lesson. A reader who skips every Aside still gets the article. A reader who reads them gets the engine-internals layer that earns the post's authority.

**Example** (hoisting post, §1):

```tsx
<Aside>
  The spec name for this pre-walk is{" "}
  <Code>FunctionDeclarationInstantiation</Code> for function bodies
  and <Code>GlobalDeclarationInstantiation</Code> for the script. See{" "}
  <A href="https://tc39.es/ecma262/multipage/...">ECMA-262 §10.2.11</A>.
  Throughout this post we'll just call it the creation phase.
</Aside>
```

**Cadence.** 1 Aside per major section is plenty; 2 in a 5-section post is the upper bound. More than that and the asides start carrying weight that should be in the prose.

**When not to use.** For a callout that the reader MUST read to understand the next paragraph — that belongs in `<P>`, not `<Aside>`. The Aside is for the reader who wants the next layer down, not for the reader trying to follow the main argument.

### §12.5. `<Term>` for first-introduction of jargon

**Rule.** Both flagship articles `<Term>`-mark new terms on their first appearance and only their first. After that, the term is plain text or `<Code>`. The Term tag tells the reader *this is the spec name; remember it because it'll come back* — and the article rewards the memory.

**Example** (hoisting post): `<Term>creation phase</Term>` on first mention in §1; thereafter just "the creation phase" in plain prose. `<Term>temporal dead zone</Term>` on first mention in §2; thereafter "the TDZ." `<Term>variable environment</Term>`, `<Term>lexical environment</Term>` on first mention in §3.

**When not to use.** Don't `<Term>`-mark a word the reader already knows in the post's domain. (Don't `<Term>`-mark "function" in a hoisting article; the reader knows it.) And don't double-mark — once a term is introduced, it's introduced.

### §12.6. The widget-prose ramp

**Rule.** Every widget sits inside three pieces of prose:

1. **Motivating ramp** (1–2 sentences) that sets up the question the widget answers.
2. **The widget.**
3. **Landing paragraph** (1–2 sentences, often containing an `<HL>`-marked phrase) that names what the widget showed.

The widget is **never standalone**. A widget without a ramp lands in the middle of the page with no prompt; a widget without a landing paragraph leaves the reader to derive the lesson on their own. Both fail.

**Example** (event-loop, around `RuntimeSimulator`):

> *Ramp:* "So the engine is single-threaded, but the runtime around it is doing work in parallel… The widget below walks ten ticks of a small program and shows where every piece sits."
>
> `<RuntimeSimulator />`
>
> *Landing:* "By tick 7 the stack is empty, both queues hold one item, and the loop reaches in. It pulls from the microtask queue first… The microtask jumped the line — `<HL>the rule that let it isn't a quirk; it's the entire model</HL>`."

**When not to use.** The W0 / opener widget can skip the landing paragraph if the *next section* (§1) carries that role — the opener's snippet is referenced through the body, so the landing is distributed across the article. Every other widget needs all three pieces.

### §12.7. No section length cap

**Rule.** **There is no max length per section.** Word counts on individual sections are not a quality signal; cognitive arc completion is. A section is "right-sized" when the concept is fully introduced — even if that takes 800 words.

Per user direction: *"there shouldn't be any max length limit per section in any of my articles, I am ready to go above and beyond limits if it's necessary to introduce a concept better."*

This durably replaces any prior "≤ N words per section" or "if a section is over N words it's too long" heuristic. The flagship event-loop post's §3 (the two queues + microtask checkpoint) and §4 (await desugaring) both run long, and that's correct — those are the sections where the mechanism is introduced and stress-tested across cases. Cutting them to fit a heuristic would have lost the article.

The total post target stays a soft band (~1500–2200 words for a 12–15-min read) but is **not a hard gate**. If landing the mechanism takes 2400 words, take 2400.

**The signal of bloat is not word count** — it's meandering. A section is too long if the prose has stopped advancing the argument. A section is right-sized if every paragraph is doing teaching work, regardless of how many of them there are.

**When this binds.** This rule applies to *body* sections — the ones doing teaching. The opener (§0) and closer remain compact by their nature; the closer especially is allowed to be one paragraph + one italic line + a dot (see §9 closer pattern). Don't read "no length cap" as licence to bloat the opener.

### §12.8. Closer that loops back to the opener

**Rule.** The closer references the opener directly. The reader is invited to re-read the opener with their new mental model and find that the puzzle is no longer a puzzle.

**Example** (event-loop closer):

> "Scroll back up and run the opener again. The order isn't a riddle anymore — it's the sequence the runtime had to take."

**Example** (hoisting closer):

> "Hoisting, the TDZ, functions callable from above — three names for one mechanism. The opening scene wasn't a quirk. It was the mechanism showing through.
>
> *The engine reads your future to run your present.*"

The closer is **still prose**, optionally with one italic line and a centred terracotta dot. **Not `VerticalCutReveal`** — that primitive is banned (see playbook). The pacing comes from `<HL>` and the dot, not from a reveal animation.

**When not to use.** Posts that don't open with a quiz (product-moment posts) loop the closer back to the *scene* instead — the gmail post closes on "the gap between Google and Netflix" because the scene was about that gap. Same shape, different anchor. The rule is "loop back to the opening anchor," whatever the anchor was.

### §12.9. Voice register confirmation (no change, just emphasis)

The two flagship posts confirm — don't change — the §3 prose rules. Engineer-not-paper. Second-person hooks (*"You type two lines into a console…"*, *"Before we explain anything, try the snippet below…"*). Mechanism-first sentences (*"The engine reads your file before it runs line 1."*). Numbers felt, not derived. Aside / Term / Em / Code primitives sprinkled to build texture without bloating the prose. If a future agent finds themselves drifting from that register, re-read these two posts as the canonical exemplars.
