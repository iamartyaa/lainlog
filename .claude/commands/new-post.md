---
description: Research, design, draft, self-critique, validate, and PR a new bytesize post end-to-end.
argument-hint: <topic>
---

# `/new-post` — the bytesize authoring pipeline

You (Claude) are about to author a new bytesize post on the topic: **$ARGUMENTS**.

This command encodes a 9-phase workflow that fires every time Amartya wants a new post. Read the whole file before acting. The workflow is bounded by four user checkpoints — gate hard at each of them.

## Hard rules (inviolable)

1. **Never skip Checkpoints 1–4.** Surface them as explicit user-facing decisions.
2. **Never commit or push without explicit "yes, push it" at Checkpoint 4.** No implicit commits.
3. **Never skip Phase H (correctness validation).** A failing check blocks Checkpoint 4.
4. **Never implement a `DESIGN.md`-banned pattern** even if a design skill suggests it. The bans are authoritative. Reject with reasoning written to the review file.
5. **Always work on `posts/<slug>` branch.** Never commit directly to `main` during the workflow.
6. **Always write phase artifacts to `research/<slug>/`** (gitignored) so the run is resumable.
7. **Read `DESIGN.md`, `content/posts-manifest.ts`, and `components/prose/`, `components/viz/`, `lib/motion/`, `lib/shiki.ts` before drafting code.** These define the vocabulary the post must compose from.

## Bail-out rules

- If Phase B reveals the topic is too broad for one post → stop, propose scoping, wait for user.
- If Phase D reveals the topic has been definitively covered by an inspiration site already → stop, propose a differentiating angle.
- If Phase H's correctness pass fails → block Checkpoint 4 until resolved. Fix and re-validate.

## Rollback

At any checkpoint, the user may give free-form feedback ("redo the outline, swap sections 3 and 4"). Interpret the scope, re-enter the correct phase, overwrite the affected state files, and re-surface the relevant checkpoint.

---

## Phase A — Intake (requires user input at Checkpoint 1)

1. Propose 3 slug options (kebab-case, ≤ 40 chars), a working title, and a one-line pitch for `$ARGUMENTS`.
2. User picks a slug.
3. Create `bytesize/research/<slug>/intake.md` with: topic, slug, title, pitch, date (ISO), stated goal ("teach X to a confident Y in Z minutes"), author notes.
4. Verify `research/` is in `.gitignore`; if not, add it. (This should already be true if setup ran.)
5. Create the feature branch: `git checkout -b posts/<slug>` from `main`.
6. **Checkpoint 1** — confirm slug/title/pitch. Do not proceed until user approves.

## Phase B — Research (autonomous, parallel agents, capped)

1. Launch 2–3 `general-purpose` subagents **in parallel** with scoped briefs:
   - **Agent 1** — authoritative primary sources (official docs, original papers/RFCs, inventor's own writings). Brief: "find the canonical sources for $TOPIC."
   - **Agent 2** — best existing teaching explanations (blog posts, lectures, StackOverflow canonical answers, YouTube transcripts). Brief: "find the most lucid existing explainers for $TOPIC and note what makes each one effective."
   - **Agent 3** — misconceptions, pitfalls, real-world failure modes, recent nuances. Brief: "find what people get wrong about $TOPIC, and where it breaks in production."
2. Each agent budget: **max 20 WebFetches, max 15 min**. If an agent hits the cap, it stops, writes an interim report, and surfaces a continue/stop decision to the user.
3. Each agent writes to:
   - `research/<slug>/sources-<n>.md` — credibility-tiered URL list (tier-1: primary; tier-2: respected secondary; tier-3: other).
   - `research/<slug>/facts-<n>.md` — extracted claims, each with a source citation.
4. Distill into `research/<slug>/kernel.md`:
   - **The one-sentence "aha"** the post must deliver.
   - The 3–5 supporting facts that make the aha land.
   - Everything else is context, not load-bearing content.
5. Collect unresolved items in `research/<slug>/questions.md`.
6. **Checkpoint 2** — user reviews `kernel.md` + `questions.md`, confirms angle, answers blockers. Do not proceed until approved.

## Phase C — Interactive Design Research (autonomous)

1. Search for existing visualizations/interactive demos of the topic (Observable, Bret Victor essays, prior interactive explainers, academic visualizations).
2. Enumerate 4–6 candidate widgets. For each: what it teaches, interaction verb (scrub/toggle/drag/click-step), build cost (S/M/L), reuse of existing primitives (`Block`, `Arrow`, `Scrubber`, `Stepper`, `CodeTrace`, `CodeMorph`).
3. Rank on impact × cost; select 2–3 to build.
4. Write `research/<slug>/widgets.md` with prop-shape sketches, the pedagogical moment each serves, and primitives composed from.

## Phase D — Pedagogy Analysis (autonomous → Checkpoint 3)

1. WebFetch 1 reference post per inspiration site matched to topic depth:
   - `nan.fyi/<closest>` — interactive-essay pacing.
   - `ivov.dev/notes/<closest>` — annotated-notes density.
   - `blog.maximeheckel.com/<closest>` — widget-centric teaching.
2. Per reference, extract: opening-hook style, abstraction ladder (concrete→abstract or reverse), widget-to-prose ratio, first-revelation placement, code-to-diagram ratio, ending style.
3. Synthesize `research/<slug>/outline.md` — numbered sections with: title, intent, widgets used, approximate word count, pedagogy reference.
4. **Checkpoint 3** — user reviews the outline. Last cheap edit point before code. Do not proceed until approved.

## Phase E — Draft Generation (autonomous)

1. Scaffold `app/posts/<slug>/`:
   - `page.tsx` — post component, imports Prose kit + local widgets.
   - `metadata.ts` — title, hook, date, OG image wiring.
   - `widgets/<Name>.tsx` — one file per widget selected in Phase C.
2. Implement widgets first; test each in isolation via a dev-only scratch page at `app/_scratch/<slug>/<Name>/page.tsx` (remove before Checkpoint 4).
3. Write TSX narrative following `outline.md`. Use **explicit Prose components** only — no regex classifier, no magic. Inline styling via `<Code>`, `<Kbd>`, `<Term>`, etc.
4. Add entry to `content/posts-manifest.ts` (newest-first via POSTS_NEWEST_FIRST helper).
5. Run `pnpm exec tsc --noEmit` + `pnpm build`. Fix any errors before proceeding.
6. Local smoke — ask user to start `pnpm dev` if server isn't running; click through the post, interact with every widget.
7. If this is post #2 or later: read `docs/voice-profile.md` (or memory's voice profile) and draft against it.

## Phase F — Design Review via skill orchestration (autonomous)

Run the six skills sequentially. Each reads the post directory + `DESIGN.md` and writes its review file.

1. `/clarify` → `research/<slug>/review-clarify.md` — tighten microcopy, labels, callouts, button text.
2. `/layout` → `research/<slug>/review-layout.md` — spacing rhythm, section breaks, widget-prose ratio.
3. `/critique` → `research/<slug>/review-critique.md` — holistic UX, pedagogy anti-patterns, hierarchy.
4. `/animate` → `research/<slug>/review-animate.md` — purposeful motion, reduced-motion behavior.
5. `/delight` → `research/<slug>/review-delight.md` — small joy moments within editorial-calm.
6. `/bolder` → `research/<slug>/review-bolder.md` — amplify any safe/boring choices within DESIGN.md bans.

Aggregate into `research/<slug>/action-items.md` — deduplicated, prioritized P0/P1/P2, each with a `[ ]` checkbox. **Reject any suggestion that violates a DESIGN.md ban**; note rejections + reasoning.

## Phase G — Iteration on Action Items (autonomous)

1. Work P0 → P1 → P2. Skip P2 if near-ship and time is scarce.
2. After each batch: re-run `tsc --noEmit` + smoke-test affected widgets.
3. Tick items in `action-items.md`.

## Phase H — Correctness Validation (autonomous, unattended)

All 5 checks run unattended; results aggregate to `research/<slug>/validation.md` with pass/fail per check.

1. **Technical correctness** — cross-check every factual claim in the post against `facts-<n>.md`. Any uncited claim gets cited or rewritten.
2. **Code correctness** — extract every runnable snippet; typecheck and execute each. Fix discrepancies. Note: every snippet marked runnable must actually run.
3. **A11y** — keyboard-only nav, `prefers-reduced-motion` simulation, focus-ring visibility, color-only-info check (widgets that convey state via color must also convey it via shape/position/label).
4. **Build + Lighthouse** — `pnpm build` must pass; Lighthouse on the post page targets ≥ 95 perf/a11y/SEO.
5. **Reading-sanity** — read end-to-end at normal pace; note voice drift, undefined terms, flow-breaking widgets. Flag these; do not silently fix voice issues.

Any failing check blocks Checkpoint 4.

## Phase I — PR, preview, merge (requires user input at Checkpoint 4)

1. Stage: `app/posts/<slug>/`, `content/posts-manifest.ts`, any graduated widgets, updates to `docs/voice-profile.md`. **Do not** stage `research/<slug>/`. Remove `app/_scratch/<slug>/` if present.
2. Commit on branch `posts/<slug>` with a descriptive message: what shipped (widget count, section count, reading minutes) + a cliffhanger for the next post.
3. Push the branch. `gh pr create` with title = post title, body = summary covering:
   - widgets shipped + which primitives composed from
   - action items resolved / deferred (link to `action-items.md` content inline)
   - validation.md highlights
   - open questions (if any)
   - cliffhanger
4. Wait for Vercel's preview URL comment on the PR; surface the URL to the user.
5. **Checkpoint 4** — user reviews:
   - Read `validation.md`
   - Click the preview URL; exercise every widget; toggle theme; test keyboard nav
   - Approve, request changes, or reject
6. On explicit user approval: `gh pr merge --squash` (or user merges manually). Vercel auto-deploys production from `main`.
7. After merge: move `research/<slug>/` → `research/archive/<slug>/`. Delete local branch.
8. If this was post #1 OR user edits were substantial: distill their edits into `docs/voice-profile.md` (create if missing) + update the memory-system voice profile. Commit this doc directly to `main` in a follow-up housekeeping commit.

## Widget placement rule

- Default: post-local at `app/posts/<slug>/widgets/<Name>.tsx`.
- On a second post needing the same widget: propose lifting to `components/viz/` (do not lift unilaterally — confirm with user).
- Foundational primitives (`Block`, `Arrow`, `Scrubber`, `Stepper`, `SvgDefs`) are already shared and live in `components/viz/` — don't duplicate those.

## Parallel runs

Two `/new-post` invocations with different slugs are supported — each has its own `research/<slug>/` dir and its own `posts/<slug>` branch. Switch branches carefully when context-switching between drafts.

## Time budget (for user expectations)

| Phase | Time |
|---|---|
| A. Intake | 5 min |
| B. Research | 10–30 min |
| C. Interactive design | 10–20 min |
| D. Pedagogy | 10 min |
| E. Draft | 20–60 min |
| F. Design review | 15–30 min |
| G. Iteration | 15–60 min |
| H. Validation | 15 min |
| I. Commit & merge | 5 min active |
| **Total** | **~2–4 hours per post**, across 1–3 sessions |

---

Now: begin Phase A for topic **$ARGUMENTS**.
