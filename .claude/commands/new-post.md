---
description: Research, design, draft, self-critique, validate, and PR a new bytesize post end-to-end.
argument-hint: <topic>
---

# `/new-post` — the bytesize authoring pipeline

You (Claude) are about to author a new bytesize post on the topic: **$ARGUMENTS**.

This command encodes a 10-phase workflow (A → I, with H.5 between H and I) that fires every time the author wants a new post. Read the whole file before acting. The workflow is bounded by **five user checkpoints** — gate hard at each of them. (Phase H.5 adds Checkpoint 4.5 for cover concept approval.)

## Orchestrator mode (when invoked under `/orchestrate`)

If your prompt declares `ORCHESTRATOR_STATE_DIR` and `TASK_ID`, you are running as a `post-author` agent under the orchestrator. **Every user-facing checkpoint below marshals via the mailbox** at `<ORCHESTRATOR_STATE_DIR>/tasks/<TASK_ID>.json` instead of speaking to the user directly. See `.claude/agents/post-author.md` for the full marshalling protocol — read it before Phase A. Outside orchestrator mode (no `ORCHESTRATOR_STATE_DIR` in your prompt), behave exactly as the canonical pipeline below describes.

Checkpoint marshalling (orchestrator mode only):
- At each Checkpoint (1, 2, 3, 4.5, 4), write the proposal/summary into `pending_user_input.prompt`, set `request_id` (a fresh ULID), `asked_at`, leave `response: null`, flip `status` to `awaiting-user`, `phase` to the current letter (use `H.5` for Checkpoint 4.5).
- For Checkpoint 4.5 (cover concept), prefix the mailbox prompt with `cover-concept:` so the orchestrator surfaces it correctly.
- Poll your task JSON every 15 seconds for non-null `pending_user_input.response`. When found: clear `pending_user_input` to `null`, flip status back to `running`, parse the response, continue.
- Max wait 30 minutes; on timeout flip `status` to `failed` with `errors: ["awaiting-user-timeout @ Checkpoint <N>"]`.
- Use `DEV_PORT` (not 3000) for `pnpm dev`.

## Hard rules (inviolable)

1. **Never skip Checkpoints 1, 2, 3, 4.5, 4.** Surface them as explicit user-facing decisions (or mailbox transactions in orchestrator mode).
2. **Never commit or push without explicit "yes, push it" at Checkpoint 4.** No implicit commits.
3. **Never skip Phase H (correctness validation) or Phase H.5 (cover authoring).** A failing check at H blocks H.5 + Checkpoint 4. A failing check at H.5 blocks Checkpoint 4.
4. **Never implement a `DESIGN.md`-banned pattern** even if a design skill suggests it. The bans are authoritative. Reject with reasoning written to the review file.
5. **Always work on `posts/<slug>` branch.** Never commit directly to `main` during the workflow.
6. **Always write phase artifacts to `research/<slug>/`** (gitignored) so the run is resumable.
7. **Read `DESIGN.md`, `content/posts-manifest.ts`, and `components/prose/`, `components/viz/`, `lib/motion/`, `lib/shiki.ts` before drafting code.** These define the vocabulary the post must compose from.
8. **Read `docs/svg-cover-playbook.md` cover-to-cover before Phase H.5.** It is the authority for animated cover work — element budget, motion amplitudes, register calibration, the 12-item author checklist.
9. **No max length per section.** Per user direction: *"there shouldn't be any max length limit per section in any of my articles, I am ready to go above and beyond limits if it's necessary to introduce a concept better."* See `docs/voice-profile.md §12.7`. Total post is a soft band of ~1500–2200 words but the gate is "did the concept land," not the count.

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
3. Synthesize `research/<slug>/outline.md` — numbered sections with: title, intent, widgets used, a *rough advisory* word estimate (no max — see Hard rule #9), pedagogy reference.
4. **For posts teaching a non-obvious order/output/mechanism**, the outline must include a **§0 premise-quiz opener** (a `<PredictTheStart>`-style W0 widget — see [`docs/voice-profile.md §12.1`](../../docs/voice-profile.md) and [`docs/interactive-components.md §1`](../../docs/interactive-components.md)). The opener's snippet/scenario should be referenced through the body, and the closer should loop back to it. This is the canonical anchor pattern from the two-flagship release.
5. For posts that unify concepts usually taught separately, plan a "many-views-of-one-mechanism" structure (`docs/voice-profile.md §12.3`): name the unifying mechanism in the outline; the closer says *"X, Y, Z — three names for one mechanism."*
6. **Checkpoint 3** — user reviews the outline. Last cheap edit point before code. Do not proceed until approved.

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
7. **Read `docs/voice-profile.md` and draft against it** — particularly §12 (the patterns from the two-flagship release: premise-quiz opener, mechanism-first reframe, many-views-of-one-mechanism structure, `<Aside>` for engine internals, `<Term>` for first-jargon, widget-prose ramp, no section length cap, closer-loops-to-opener). The two flagship posts (`app/posts/the-line-that-waits-its-turn/page.tsx` and `app/posts/how-javascript-reads-its-own-future/page.tsx`) are the canonical exemplars — read them end-to-end before writing your first paragraph.

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

Any failing check blocks Phase H.5 + Checkpoint 4.

## Phase H.5 — Animated SVG cover authoring (requires user input at Checkpoint 4.5)

The article body is now stable. Author the animated cover. **Authority: [`docs/svg-cover-playbook.md`](../../docs/svg-cover-playbook.md). Read it cover-to-cover before drawing any paths.** It contains the 64-px-first rule (§1), the element budget ≤ 14 (§2), motion amplitudes (§3), the bold-vs-refined register calibration (§14), and the 12-item author checklist (§10).

1. **Concept lock first (Checkpoint 4.5).** Before any path, surface a one-sentence concept + element list (≤ 14) + register choice (kinetic / contemplative / pedagogical / reveal — see playbook §14). User approves or revises. The v3-failure / v4-success cycle showed that wrong metaphor + drawn paths = wasted PR. **Do not draw before the concept is approved.** In orchestrator mode this is a `cover-concept:` mailbox prompt.
2. **Skill phasing** (per playbook §9):
   - `/clarify` — concept-lock (above).
   - Draft static SVG (JSX paths, no motion). Aim for the §2 element budget.
   - `/animate` — motion design. Layer `motion.path` / `motion.g` with §3 amplitudes and §4 continuous loop discipline.
   - `/delight` — ≤ 1 small joy beat per cover.
   - `/polish` — final pass: tokens, alignment, off-by-one strokes.
   - `/bolder` and `/overdrive` are **opt-in only**. Default to refined (playbook §14); apply `/bolder` only when the static draft genuinely reads as safe and the metaphor is kinetic.
3. **Both exports required.**
   - **Animated default** — `components/covers/<NameOf>Cover.tsx` — uses `motion/react`, hooks, CSS variables, `useId()`, `whileHover`.
   - **Sibling `<Name>CoverStatic`** — pure JSX matching the cover's reduced-motion end-state. **Inline hex palette only.** No `motion.*`, no hooks, no `color-mix`, no CSS vars. Required by the OG share-preview composition (`app/og/[slug]/route.tsx`); CSS vars don't resolve there.
4. **Registry update** — add the slug → component mapping in `components/covers/PostCover.tsx`.
5. **Validation gate** (must all pass):
   - `pnpm exec tsc --noEmit` green.
   - `pnpm build` green.
   - Static-export purity: `grep -E "motion\\.|use[A-Z]|color-mix|var\\(--"` returns clean inside the `<Name>CoverStatic` block.
   - 64-px AND hero-size mental sweep — cover reads at both.
   - Reduced-motion end-state visible (the static frame must carry the metaphor).
   - All 12 items in `docs/svg-cover-playbook.md §10` ticked.
6. **On failure**, refactor against `docs/svg-cover-playbook.md §11` (the diagnostic ladder) — don't tweak.

A failing Phase H.5 blocks Checkpoint 4 (PR approval) until resolved.

## Phase I — PR, preview, merge (requires user input at Checkpoint 4)

1. Stage: `app/posts/<slug>/`, `content/posts-manifest.ts`, any graduated widgets, **the Phase H.5 cover artefacts** (`components/covers/<NameOf>Cover.tsx` + the `components/covers/PostCover.tsx` registry entry), updates to `docs/voice-profile.md`. **Do not** stage `research/<slug>/`. Remove `app/_scratch/<slug>/` if present.
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
| H.5 Animated cover | 30–60 min (concept-lock + draft + animate + polish) |
| I. Commit & merge | 5 min active |
| **Total** | **~2.5–5 hours per post**, across 1–3 sessions |

---

Now: begin Phase A for topic **$ARGUMENTS**.
