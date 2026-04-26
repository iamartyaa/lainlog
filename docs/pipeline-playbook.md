# bytesize — authoring pipeline playbook

The pipeline for shipping a bytesize post, derived from the first four posts and hardened on the AI-agent-traps post. Load this before starting a new article or running `/new-post`. Skill-review lessons from Phase F live in §5.

Cross-reference: [`voice-profile.md`](./voice-profile.md), [`interactive-components.md`](./interactive-components.md), [`.claude/commands/new-post.md`](../.claude/commands/new-post.md).

---

## 1. Pipeline overview — ten phases, five checkpoints

```
A    Intake                       → Checkpoint 1 (slug + title + pitch)
B    Research                     → Checkpoint 2 (kernel + angle)
C    Interactive design
D    Pedagogy analysis            → Checkpoint 3 (outline)
E    Draft
F    Design review (skills)
G    Iteration on action items
H    Correctness validation
H.5  Animated SVG cover authoring → Checkpoint 4.5 (cover concept lock)
I    PR + preview                 → Checkpoint 4 (merge or revise)
```

Phase H.5 is new (added 2026-04-26 after the two-flagship release). It runs after the article body validates and before the PR opens — the cover metaphor inherits a stable hook + mechanism + angle from the validated body. Authority for cover work is [`svg-cover-playbook.md`](./svg-cover-playbook.md); read it cover-to-cover before authoring. See §2 → Phase H.5 for the in-pipeline brief.

### Length discipline (applies across the pipeline)

**No max length per section.** Right-size each section to the concept's cognitive arc — sections may run long when the concept demands it. Per user direction: *"there shouldn't be any max length limit per section in any of my articles, I am ready to go above and beyond limits if it's necessary to introduce a concept better."* Total article word count remains a soft target (around 1500–2200 words for a 12–15-min read) but is **not a hard gate**; landing the concept is the gate. The `outline.md` file at Phase D may carry rough word estimates as a planning aid, but those estimates are advisory — landing the mechanism cleanly takes priority over hitting them. See [`voice-profile.md §12.7`](./voice-profile.md).

Hard rules (never skip):
- Gate the four checkpoints. Never proceed without explicit user approval.
- Never commit or push without explicit "yes push it" at Checkpoint 4.
- Research, design, and validation artefacts live in `research/<slug>/` (gitignored). The run is resumable across sessions because every decision is on disk.
- Never implement a DESIGN.md-banned pattern even if a design skill suggests it — reject with the ban cited in the review file.

## 1.5 Running the pipeline under `/orchestrate`

When the pipeline runs as a `post-author` or `article-polisher` agent under `/orchestrate`, the four checkpoints become **mailbox transactions**, not direct user conversations. The agent never speaks to the user; it writes a prompt into `.orchestrator/tasks/<TASK_ID>.json` (`pending_user_input` field), flips status to `awaiting-user`, then polls every 15s for a response. The orchestrator session — a separate, long-running Claude Code session — surfaces the prompt to the user and writes the response back into the JSON. The agent reads the response on its next poll and continues.

Detection: if the agent's prompt declares `ORCHESTRATOR_STATE_DIR` and `TASK_ID`, it's in orchestrator mode. Absent → behave exactly as the canonical pipeline above. This is a purely additive shim — same checkpoints, same quality bars, just a different transport for the user response.

Status updates: write your task JSON at every phase boundary (`phase` letter from A–I, `status` from the lifecycle enum). Append a one-line entry to `.orchestrator/log.md` per status change. See `.claude/agents/post-author.md` and `.claude/agents/article-polisher.md` for the full marshalling protocol per checkpoint.

Other orchestrator-mode constraints:
- Use `DEV_PORT` (passed in your prompt) for `pnpm dev`, never `3000`. Two parallel posts on the default port collide.
- Slug reservation: `registry.json` tracks reserved slugs across in-flight tasks. If you change the slug at Checkpoint 1, release the old reservation and reserve the new one atomically.
- Shared-primitive lifts (e.g. promoting a widget to `components/viz/`) go through the orchestrator (mailbox prompt prefixed `primitive-lift:`), not directly to the user. The orchestrator coordinates against other in-flight tasks.

## 2. Phase-by-phase lessons

### Phase A — Intake
- Pattern that works: slug matches existing post-title grammar (*"The X that Y"*, *"How X does Y"*). Lyrical observations beat literal labels.
- Propose 3 slugs, a working title, a one-line pitch. Let the user pick.
- Record in `research/<slug>/intake.md` including a stated goal (*"teach X to a confident Y in Z minutes"*) and author notes. The goal makes Phase C choices easier.

### Phase B — Research
- Launch 2–3 parallel agents with scoped briefs (primary sources / teaching explainers / misconceptions & incidents).
- **Verify `WebFetch` permission before launching**. If denied, agents fail fast and waste time. Suggest `/permissions` or `update-config` skill early.
- When a source document is in hand (e.g. a PDF), extract it yourself; don't ask a sub-agent to re-derive material you already have.
- The kernel file (`kernel.md`) distils: the one-sentence "aha", the 3–5 supporting facts, and what to leave out.
- Seek **differentiation** — don't re-write Simon Willison's essay. Ask what angle, framing, or interactive nobody else has used.

### Phase C — Interactive design
- Enumerate 4–6 candidate widgets against the seven widget shapes in [`interactive-components.md §1`](./interactive-components.md).
- Rank on impact × cost; pick 2–3 to build.
- Write `widgets.md` with prop sketches and the single teaching claim each serves.
- **Lesson from the agent-traps post**: don't over-commit before the user has seen the outline. Widgets can be reshuffled in Phase D.

### Phase D — Pedagogy analysis
- Read one reference post from each inspiration site (nan.fyi, ivov.dev/notes, blog.maximeheckel.com) to calibrate pacing.
- Write `outline.md` — numbered sections with widget placement, a rough word estimate (advisory only — see Length discipline in §1), and pedagogy reference per section.
- **For posts teaching a non-obvious order/output/mechanism**: the outline must include a §0 premise-quiz opener (a `<PredictTheStart>`-style W0 widget). See [`voice-profile.md §12.1`](./voice-profile.md). The opener's snippet/scenario should be referenced through the body so every later section reinforces it, and the closer (final section) should loop back to it.
- For posts teaching a mechanism that's usually presented as multiple separate concepts: name the unifying mechanism in the outline, and plan a closer that says *"X, Y, Z — three names for one mechanism."* See [`voice-profile.md §12.3`](./voice-profile.md).
- This is the last cheap edit point before code. User gets Checkpoint 3 here.

### Phase E — Draft
- Order: scaffold `metadata.ts` + post entry first, then widgets, then narrative TSX.
- **Build widgets in isolation**: create a dev-only scratch page at `app/_scratch/<slug>/<Name>/page.tsx` for each, remove before Checkpoint 4.
- RSC caveat: `page.tsx` is server-rendered. Any client-only interaction (drag, refs, function props) must live in a `"use client"` wrapper. We discovered this at build time when `MediaBetweenText`'s `renderMedia` function couldn't cross the RSC boundary — fixed by introducing `DomReveal.tsx` as a `"use client"` component.
- Shiki language grammar: verify `lib/shiki.ts` has the language you want to `<CodeBlock>` with. Adding `html` to the grammar list cost us one build.
- `cn` utility: the fancy primitives imported from `@/lib/utils/cn`. That file didn't exist in the project — add a 3-line helper if missing before importing components that depend on it.
- Run `pnpm exec tsc --noEmit` + `pnpm build` before Phase F. Every non-trivial issue surfaces at build time.
- Audit prose: `node scripts/audit-prose.mjs`. Fix `em-abuse` errors. Bulk-fix fragile-space-after-italic with the one-liner:
  ```python
  # apply to any .tsx with Em/Term tags
  re.sub(r'</(Em|Term)>(\s+)([^\s<{])', lambda m: f'</{m.group(1)}>{{" "}}{m.group(3)}', src)
  ```

### Phase F — Design review via skill orchestration
- Launch six sub-agents in parallel. Each reads the post + DESIGN.md through its lens and writes a review file. See §5 for per-skill briefs.
- Sub-agents are better than direct Skill-tool invocation because: (a) agents stay bounded to a tight brief and don't bloat main context, (b) agent output is a review file we control, (c) parallel execution finishes in ~10 min vs sequential in ~45.
- Budget each agent to ≤ 20 WebFetches, ≤ 15 minutes, and ≤ 400 words of summary back to main context.

### Phase G — Iteration
- Aggregate reviews into `action-items.md` with P0/P1/P2 priority, deduplicated, with source attribution per item.
- Work P0 → P1 → P2 in that order. Skip P2 if time is scarce.
- Mechanical fixes first (motion compliance, microcopy, a11y). They unblock the review pass and clear the ground for prose work.
- Prose restructuring second (lede, closer, section titles, class expansions).
- Citation trim last — it's hard to know what's load-bearing until the rest has settled.
- Re-run `pnpm build` + audit after each batch.

### Phase H — Validation
- Write `validation.md` with six checks:
  1. Technical correctness — every numeric claim traces to `facts-primary.md` / `facts-incidents.md`
  2. Code correctness — every runnable snippet typechecks and runs
  3. A11y — keyboard nav, reduced-motion, focus visibility, colour-only-info
  4. Build + Lighthouse targets ≥ 95
  5. Reading-sanity — end-to-end read for voice drift, undefined terms, flow breaks
  6. **SEO sweep** — title ≤ 70 chars (60 ideal), description ≤ 160 chars, `keywords[]` present (8–10 terms), `alternates.canonical` set, OG + Twitter mirror title + description, `openGraph.type === "article"`, `openGraph.publishedTime` set, visible H1 matches `VISIBLE_HEADING`, `subtitle` export matches `LYRICAL_TAGLINE`. See `voice-profile.md §11`.
  7. **Audio sweep** — only Tier-1 sounds play; default-off respected; `prefers-reduced-motion` honoured; tab-hidden silent; no autoplay-on-mount. See [`audio-playbook.md`](./audio-playbook.md).
- Any failing check blocks Checkpoint 4 until resolved.

### Phase H.5 — Animated SVG cover authoring

Runs **after** Phase H validation passes on the article body and **before** the PR is opened in Phase I. The cover metaphor is shaped by the article's mechanism — author it after the body is stable, not before. (See §6 pitfall: *"Cover authored before the article validates."*)

**Authority.** [`svg-cover-playbook.md`](./svg-cover-playbook.md) is the single source of truth for cover work. **Read it cover-to-cover before authoring.** It contains:
- The 64-px-first rule (§1) — covers are read at thumbnail size first.
- Element budget ≤ 14 (§2) — the v3 → v4 lesson.
- Motion amplitude rules (§3) — what reads at a 4× downscale.
- Continuous motion, not phase-stagger (§4).
- The bold-vs-refined calibration (§14) — the *register* the cover should land in. Default to refined for chrome; the hero element gets the punctuation.
- The 12-item author checklist (§10) — must tick all 12 before push.

**What this phase produces.**
1. `components/covers/<NameOf>Cover.tsx` — the per-post bespoke cover component (animated default; uses `motion/react`, hooks, CSS variables, `useId`, `whileHover`).
2. A registry update in `components/covers/PostCover.tsx` — slug → component.
3. **A sibling `<Name>CoverStatic` export** — pure JSX matching the cover's reduced-motion end-state — for the OG share-preview composition (`app/og/[slug]/route.tsx`). The static export must use **inline hex palette only** (no `motion.*`, no hooks, no `color-mix`, no CSS vars) because it renders inside Next's OG image route, where CSS variables don't resolve.

Both exports are required. Static-export purity is verified in the validation step below.

**Concept-lock gate (Checkpoint 4.5).** Before drawing any paths, surface a one-sentence concept + element list to the user for approval. The v3-failure / v4-success / v7-revamp cycle (`svg-cover-playbook.md §13`) showed that wrong metaphor + drawn paths = wasted PR. Lock the concept first. In orchestrator mode this is a mailbox prompt prefixed `cover-concept:`; out of orchestrator mode it's a direct ask.

**Skill phasing** (per `svg-cover-playbook.md §9` and §14):
- `/clarify` — concept-lock. Write the cover as one sentence ("a comet hits a CORS wall and bounces"); if you can't say it in one sentence, the cover is wrong.
- Draft static SVG — JSX paths only, no motion yet. Aim for the §2 element budget.
- `/animate` — motion design. Layer `motion.path` / `motion.g` with §3 amplitudes and §4 loop discipline.
- `/delight` — ≤ 1 small joy beat per cover.
- `/polish` — final pass: token compliance, alignment, off-by-one strokes.

`/bolder` and `/overdrive` are **opt-in only**. Many covers don't want them. Default to refined; apply `/bolder` only when the static draft genuinely reads as safe and the metaphor is kinetic. See `svg-cover-playbook.md §14` for per-cover register guidance (kinetic / contemplative / pedagogical / reveal).

**Validation gate** (must all pass before push):
- `pnpm exec tsc --noEmit` green.
- `pnpm build` green.
- Static-export purity grep on `<Name>CoverStatic`: `grep -E "motion\\.|use[A-Z]|color-mix|var\\(--"` returns clean (no matches inside the static export). The OG route can't resolve CSS vars or call hooks.
- 64-px AND hero-size mental sweep — the cover reads at both.
- Reduced-motion end-state visible (the static frame must carry the metaphor on its own).
- All 12 items in `svg-cover-playbook.md §10` ticked.

**On failure.** If the cover doesn't read at 64 px, refactor against `svg-cover-playbook.md §11` (the diagnostic ladder). Don't tweak — refactor. v3 → v4 was a refactor, not tweaks; that's why it succeeded.

### Phase I — PR + preview
- Stage only post-scoped files. **Never `git add -A`** — other in-progress work on the branch may not be yours.
- Stage Phase H.5 cover artefacts: `components/covers/<NameOf>Cover.tsx` and the `components/covers/PostCover.tsx` registry update.
- Research dir stays gitignored. Confirm with `git status` before committing.
- Remove `app/_scratch/<slug>/` if present.
- Commit on the feature branch. Push with `-u`. `gh pr create` with a full body: summary, widgets shipped, P0 action resolution table, test plan, cliffhanger.
- Wait for the Vercel preview URL. Surface to user with test cues. Only merge on explicit "yes push it" / approval.
- After merge: archive `research/<slug>/` → `research/archive/<slug>/`. Delete the local branch. Distill user edits into `voice-profile.md` if substantial.

## 3. Session-resumption rules

Every run is resumable because everything important lives in `research/<slug>/`:

```
research/<slug>/
  intake.md          # Phase A
  source-pdf.txt     # primary source extract
  sources-*.md       # tiered URL lists from research agents
  facts-*.md         # extracted claims with citations
  kernel.md          # the aha + load-bearing facts
  questions.md       # unresolved items for checkpoints
  widgets.md         # Phase C output
  outline.md         # Phase D output
  review-clarify.md  # Phase F outputs (×6)
  review-layout.md
  review-critique.md
  review-animate.md
  review-delight.md
  review-bolder.md
  action-items.md    # Phase G aggregator
  validation.md      # Phase H output
```

When a new Claude session picks up an in-flight article, it should read these in order and know exactly where we left off.

## 4. Checkpoint crib sheet

### Checkpoint 1 — Intake approval
Surface: 3 slug options + working title + pitch + date + reading target. User picks one or edits.

### Checkpoint 2 — Kernel + angle approval
Surface: `kernel.md` (1 aha + 5 facts + differentiation notes) and `questions.md` (open items). User confirms the angle and answers blockers.

### Checkpoint 3 — Outline approval
Surface: `outline.md` — section-by-section, widget placement, word targets. Last cheap edit point.

### Checkpoint 4.5 — Cover concept approval (Phase H.5)
Surface: a one-sentence cover concept + an element list (≤ 14) + the chosen register (kinetic / contemplative / pedagogical / reveal — see `svg-cover-playbook.md §14`). User approves or revises **before** any paths are drawn. The v3-failure / v4-success cycle showed concept-lock saves a wasted PR. In orchestrator mode this is a `cover-concept:` mailbox prompt.

### Checkpoint 4 — PR approval
Surface: `validation.md`, a preview URL, and explicit asks for widget/theme/kb testing. Block on explicit "yes push it" before merge.

## 5. Skill-review lessons (Phase F)

Each of the six design-review skills targets a specific quality axis. Run all six in parallel; aggregate into `action-items.md`. Every rejected suggestion must cite the specific DESIGN.md ban.

### `/clarify` — microcopy, labels, aria, button text
**Finds**: verb/label mismatches (tab says "agent", caption says "Tap agent view"); un-introduced jargon in titles; state-dependent aria-labels that describe the wrong state; tone drift (word-numbers vs digits).
**Does not find**: anything outside microcopy scope. Keep its brief narrow.
**Best items per article**: 10–15 specific (file:line + proposed fix).

### `/layout` — spacing, rhythm, widget-prose ratio, DESIGN.md compliance
**Finds**: missing `<Dots />` ornaments; prose-only sections between widget-heavy ones ("skim cliffs"); fixed pixel dimensions that break at 360 px; undersized labels; hover-only styling leaking onto touch.
**Does not find**: pedagogical problems or prose quality.
**Best items per article**: 15–20 total (3–5 P0).

### `/critique` — pedagogy, UX, hierarchy, cognitive load
**Finds**: citation parades; tell-don't-show; mismatched widget weight vs evidentiary weight; cognitive-load spikes; HL inflation; unmotivated jargon; unearned Terms.
**Does not find**: motion / layout / microcopy details.
**Scoring**: always asks for an X/10 verdict — useful for accountability.

### `/animate` — motion purpose + DESIGN §9 compliance
**Finds**: banned properties (`top`/`height`/`width`/`margin`); `ease-in-out` / `linear` on UI motion; tweens where springs belong; reduced-motion gaps; stagger inconsistencies.
**Also audits**: `TextHighlighter` density and trigger-type correctness.
**Pass rates**: expect a per-widget "pass / partial / fail" table.

### `/delight` — understated joy within editorial-calm register
**Finds**: small typographic flourishes, micro-interactions, completion beats.
**Hard constraint**: every proposal must cite a DESIGN.md rule it respects. Every rejection must cite the specific ban.
**Rejects**: confetti, emoji, brighter accents, drop-shadows, border-stripes, gradient text — always cited.
**Best items**: 8–12 proposals, half rejected-by-design.

### `/bolder` — amplify safe choices without violating bans
**Finds**: hedged ledes, filing-cabinet section titles, buried highlights, trailing-off closers.
**Key discipline**: boldness = fewer words, emptier space, one sentence landing alone. Not brighter, not louder.
**Proposed patterns**:
- Lede: lead with the thesis, not the backstory.
- Section titles: argument-claims, not labels. Numerals as Plex Mono eyebrows.
- Closers: cut the recap; end on the inversion.

### Aggregation discipline
- Deduplicate cross-agent overlaps (e.g. /layout and /animate both catching the scanline drop-shadow).
- Promote convergent findings (two reviewers flagging the same issue) to P0 regardless of individual priority.
- Reject-with-ban-cited for any DESIGN.md violation. Note in `action-items.md`.
- Apply P0 → P1 in order. P2 usually deferred unless cheap.

## 6. Common pitfalls (accumulated from shipped posts)

- **Skipping `<Dots />`** between sections — breaks the rhythm DESIGN.md §2 specifies.
- **Animating CSS properties** instead of transforms.
- **Un-measured container for transform-based sweeps** — use `useLayoutEffect` + `ResizeObserver`.
- **RSC boundary with function props** — wrap in a `"use client"` component.
- **Missing languages in `lib/shiki.ts`** — add before using a new language in `<CodeBlock>`.
- **`cn` utility not present** — add `lib/utils/cn.ts` with a 3-line helper.
- **Fragile `</Em> word` spacing** — audit flags these; bulk-fix with the regex above.
- **Citation parade** — ≥ 3 attributed studies in consecutive sentences; critique will flag.
- **HL inflation** — > 2 per section dilutes the signal.
- **Auto-playing widgets on mount** — always require user interaction.
- **Muted captions when they're teaching** — use `captionTone="prominent"`.
- **Under-represented persona hyperstition / speculative-class content** — treat it at the weight its weirdness deserves, not the weight its evidence does.
- **Poetic-only title** — descriptive H1 is the SEO surface; lyrical phrase is the subtitle. See `voice-profile.md §11`.
- **Simulating real performance hazards in teaching widgets** — state-machine simulation, not real recursion / timer-flooding / rAF consumption. See `interactive-components.md §5`.
- **DragElements for sequenced/structured concepts** — use static layout + springs + `<AnimatePresence>` instead. Drag is for "you decide where these go" affordances only.
- **Clanky scripted-stepper transitions** — use `<LayoutGroup>` + `layoutId` for shared elements that move (program-counter, active-frame indicator), `<AnimatePresence>` for items that enter/exit (queue chips, stack frames), and springs (not duration tweens) for transitions.
- **Cover authored before the article validates.** The cover metaphor is shaped by the article's mechanism, not the other way around. Author the cover **after** the article body's Phase H validation passes — the cover then has a stable hook, mechanism, and angle to inherit from. Authoring earlier risks a metaphor mismatch when the article shifts during iteration. (Phase H.5 enforces this ordering.)
- **Capping a section to a word target.** No max length per section. Right-size each section to the concept's cognitive arc. Per user direction: *"there shouldn't be any max length limit per section in any of my articles, I am ready to go above and beyond limits if it's necessary to introduce a concept better."* The signal of bloat is meandering, not word count. See [`voice-profile.md §12.7`](./voice-profile.md).

## 6.5 Redesign-vs-iterate signal

When the user pushes back on a widget, the response is sometimes a tweak and sometimes a full rebuild. The signal:

- **First time the user says "I don't understand this widget"** → tweak. Maybe the caption is unclear, maybe a label is wrong. Reword and re-validate.
- **Second time the user says it about the same widget** → redesign. The metaphor is wrong. Don't keep polishing the surface; throw the widget out and pick a different metaphor.

PR #45's MicrotaskStarvation went through this: round-2 was a click-me freeze test the user rejected ("doesn't make sense, feels like a memory leak"). Round-3 replaced it entirely with Queue Race — different mechanic, different shape, same article slot. **Redesigns are cheaper than two more polish rounds on a wrong metaphor.**

PR #46's CallStackECs went through it too: round-2 used `DragElements`, round-3 replaced with a static stack + arrow annotations. The user explicitly directed the round-2 attempt — even direct-from-user widget choices can fail in execution and need a redesign rather than a tweak. Trust the *second* signal over the first instruction.

## 7. Reference reading order for a new Claude session

1. This file (`pipeline-playbook.md`) — the pipeline + lessons.
2. [`voice-profile.md`](./voice-profile.md) — tone, prose rules, widget rules. **§12 captures the patterns from the two-flagship release** (event-loop + hoisting/TDZ) — read it before drafting.
3. [`interactive-components.md`](./interactive-components.md) — widget shapes and primitive catalogue.
4. [`svg-cover-playbook.md`](./svg-cover-playbook.md) — animated cover authoring (Phase H.5 authority).
5. [`../DESIGN.md`](../DESIGN.md) — the design system (tokens, motion, bans).
6. A recent shipped post pair — `app/posts/the-line-that-waits-its-turn/page.tsx` and `app/posts/how-javascript-reads-its-own-future/page.tsx` — the canonical exemplars for voice + structure as of 2026-04.
7. The `/new-post` command at `.claude/commands/new-post.md` — the canonical workflow definition.
