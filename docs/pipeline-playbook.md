# bytesize — authoring pipeline playbook

The pipeline for shipping a bytesize post, derived from the first four posts and hardened on the AI-agent-traps post. Load this before starting a new article or running `/new-post`. Skill-review lessons from Phase F live in §5.

Cross-reference: [`voice-profile.md`](./voice-profile.md), [`interactive-components.md`](./interactive-components.md), [`.claude/commands/new-post.md`](../.claude/commands/new-post.md).

---

## 1. Pipeline overview — nine phases, four checkpoints

```
A  Intake                   → Checkpoint 1 (slug + title + pitch)
B  Research                 → Checkpoint 2 (kernel + angle)
C  Interactive design
D  Pedagogy analysis        → Checkpoint 3 (outline)
E  Draft
F  Design review (skills)
G  Iteration on action items
H  Correctness validation
I  PR + preview             → Checkpoint 4 (merge or revise)
```

Hard rules (never skip):
- Gate the four checkpoints. Never proceed without explicit user approval.
- Never commit or push without explicit "yes push it" at Checkpoint 4.
- Research, design, and validation artefacts live in `research/<slug>/` (gitignored). The run is resumable across sessions because every decision is on disk.
- Never implement a DESIGN.md-banned pattern even if a design skill suggests it — reject with the ban cited in the review file.

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
- Write `outline.md` — numbered sections with widget placement, word count estimate, and pedagogy reference per section.
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
- Write `validation.md` with five checks:
  1. Technical correctness — every numeric claim traces to `facts-primary.md` / `facts-incidents.md`
  2. Code correctness — every runnable snippet typechecks and runs
  3. A11y — keyboard nav, reduced-motion, focus visibility, colour-only-info
  4. Build + Lighthouse targets ≥ 95
  5. Reading-sanity — end-to-end read for voice drift, undefined terms, flow breaks
- Any failing check blocks Checkpoint 4 until resolved.

### Phase I — PR + preview
- Stage only post-scoped files. **Never `git add -A`** — other in-progress work on the branch may not be yours.
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

## 7. Reference reading order for a new Claude session

1. This file (`pipeline-playbook.md`) — the pipeline + lessons.
2. [`voice-profile.md`](./voice-profile.md) — tone, prose rules, widget rules.
3. [`interactive-components.md`](./interactive-components.md) — widget shapes and primitive catalogue.
4. [`../DESIGN.md`](../DESIGN.md) — the design system (tokens, motion, bans).
5. A recent shipped post (e.g. `app/posts/the-webpage-that-reads-the-agent/page.tsx`) — how it all composes.
6. The `/new-post` command at `.claude/commands/new-post.md` — the canonical workflow definition.
