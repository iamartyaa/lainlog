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
- **Cut to the bone.** Target ≤ 1500 words of `<P>` prose for a 12–15-min post. If a section is over 250 words with no interactive, it's probably too long.

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

### `<TextHighlighter>` (HL) as a pacing device — required on every post

Used for the single load-bearing phrase of its paragraph — 1–2 per section, target ~10–17 across the post. Binds to `var(--color-accent)` at 28% via `color-mix`. Never a second colour, never a second direction. See [`interactive-components.md §2`](./interactive-components.md) for trigger discipline.

**Enforcement rule**: every new post and every polish pass lands an `HL` helper in `page.tsx` (identical signature across the catalogue — copy from `app/posts/the-webpage-that-reads-the-agent/page.tsx:28–52`) and wraps 10–17 load-bearing phrases. A post without TextHighlighter is a post that hasn't gone through Phase E. Candidates: the inversion in the lede, the one-line thesis, mechanism first-appearances, section-closing punches. Never wrap connective tissue; never wrap two adjacent phrases; never wrap the same phrase twice.

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
