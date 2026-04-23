# `/improve-an-article` — iterate an existing post with the full playbook

Apply the latest voice, widget, pipeline, and skill-review knowledge to an existing bytesize post. Use this when:

- A post shipped before a playbook doc existed and is due a refresh.
- A new widget shape or pedagogy lesson has been added to the playbook and would strengthen an older article.
- The user flags specific feedback and wants a proper multi-lens review rather than an ad-hoc edit.

Arguments:
- **Required**: a post slug or path (e.g. `the-function-that-remembered` or `app/posts/the-function-that-remembered/`).
- **Optional**: a short brief of what the user thinks is off. If absent, fire the full Phase F audit.

## Hard rules (inviolable)

1. **Never skip the user checkpoints** (Checkpoint 0, 2, 3 below). Gate on each.
2. **Never commit or push without explicit "yes push it"** at the closing checkpoint.
3. **Never silently rewrite voice.** Every tone-altering change is a decision the user confirms. Prose restructuring surfaces as a diff, not a fait accompli.
4. **Never implement a DESIGN.md-banned pattern** even if a review skill suggests it. Reject with the ban cited.
5. **Work on a new branch** `posts/<slug>-polish` off `main`. Never modify a shipped post on `main` directly.
6. **Never touch other posts' code** unless fixing a shared primitive (`components/viz/*`, `components/fancy/*`, `lib/*`). If a shared-primitive change is needed, surface it and require explicit approval.

## Bail-out rules

- If the post is in a branch that isn't merged to `main`, stop and check with the user — they may have in-flight edits.
- If the audit's combined P0s would require rewriting > 30% of the prose, stop at Checkpoint 2 and propose a narrower scope (or recommend `/new-post` for a full rewrite).
- If validation fails after iteration, do not advance to the closing checkpoint. Report back with specifics.

---

## Phase 0 — Load context

Before any audit, load:

1. [`docs/voice-profile.md`](../../docs/voice-profile.md)
2. [`docs/interactive-components.md`](../../docs/interactive-components.md)
3. [`docs/pipeline-playbook.md`](../../docs/pipeline-playbook.md)
4. [`DESIGN.md`](../../DESIGN.md)
5. The target post directory (`page.tsx`, `metadata.ts`, `widgets/*`, `widgets/index.ts`).
6. The post's manifest entry in [`content/posts-manifest.ts`](../../content/posts-manifest.ts).
7. Optional user brief from command args.

Write `research/<slug>-polish/context.md` with:
- Post slug, current reading-minutes, shipped date, current widget inventory.
- User-supplied brief (if any).
- First-pass skim findings: things the playbook now forbids that appear in the post. (Not a full review — just the obvious.)

## Phase 1 — Scope proposal (Checkpoint 1)

Given context, propose a scope:

- **Minor polish** — tighten microcopy, fix any DESIGN.md violations, update 1–2 widgets. ~2h.
- **Medium revision** — also restructure the lede/closer, trim citations, adopt argument-claim H2s if appropriate. ~4h.
- **Major revision** — above + replace or add widgets, rework structural spine. ~8h. May warrant `/new-post` instead.

Surface at **Checkpoint 1**: scope choice + named changes. Wait for user. If scope > "minor" and the user's brief implies "minor," clarify before proceeding.

## Phase 2 — Design review via skill orchestration

Same six parallel agents as `/new-post` Phase F, but briefs now reference the playbook directly. Each agent reads `docs/voice-profile.md`, `docs/interactive-components.md`, `DESIGN.md`, and the post. Each writes `research/<slug>-polish/review-<skill>.md`.

Agent briefs are canonical templates — adjust the "what to review" list if the user brief narrows scope.

1. **clarify** — microcopy, labels, aria, button text. P0/P1/P2 with `file:line` and proposed text.
2. **layout** — spacing rhythm, widget-prose ratio, mobile-first fidelity, DESIGN.md §2/§7/§12 compliance.
3. **critique** — pedagogy, IA, cognitive load, citation density, widget-weight vs evidentiary-weight balance. X/10 score.
4. **animate** — DESIGN.md §9 compliance. Motion inventory with spring choice + reduced-motion pass per widget.
5. **delight** — ≤ 12 proposals; every proposal cites a DESIGN.md rule; every rejection cites a specific ban.
6. **bolder** — amplifications without ban violations. Section titles, ledes, closers, buried highlights.

Budget per agent: ≤ 20 WebFetches, ≤ 15 min, ≤ 400-word summary.

## Phase 3 — Aggregation + user approval (Checkpoint 2)

Aggregate into `research/<slug>-polish/action-items.md` with:
- Deduplicated P0/P1/P2 items, source-attributed (`[c]`/`[l]`/`[t]`/`[a]`/`[d]`/`[b]`).
- Convergent findings (≥ 2 reviewers flagging the same issue) promoted to P0.
- Rejected-with-ban-cited section for any DESIGN.md violation.
- Plan of attack: mechanical (motion/a11y/microcopy) → prose restructure → citation trim → delight polish.

Surface at **Checkpoint 2**: user reviews `action-items.md` and confirms priorities. They may strike items, add their own, or flip P1→P0.

## Phase 4 — Iteration

Work the approved list in priority order:

1. **Mechanical fixes** — motion compliance, microcopy parity, aria-labels, missing `<Dots />`. Do these in a single batch, re-run `pnpm exec tsc --noEmit` + `pnpm build`.
2. **Prose restructure** — lede, closer, section titles, class expansions, paragraph promotions. Before any large prose change, diff the old vs new paragraph-by-paragraph in the chat for user eyes.
3. **Citation + density trim** — only after the structural moves settle.
4. **Delight polish** — the small moments. Skip if time-constrained.

After each batch: `pnpm exec tsc --noEmit`, `pnpm build`, `node scripts/audit-prose.mjs`. Tick items in `action-items.md`.

## Phase 5 — Validation

Write `research/<slug>-polish/validation.md`:

1. Technical correctness — every numeric claim traces to a citation.
2. Code correctness — tsc + build pass.
3. A11y — keyboard, focus, reduced-motion, colour-only-info.
4. Build + Lighthouse (if preview available) ≥ 95.
5. Reading-sanity — end-to-end read for voice drift.

Also update `docs/` if anything new was learned (new anti-pattern, new widget shape, new voice rule).

## Phase 6 — PR + preview (Checkpoint 3)

1. Stage only post-scoped + shared-primitive files. Never `git add -A`.
2. Commit on branch `posts/<slug>-polish` with a descriptive message:
   - What changed structurally.
   - Which P0s resolved.
   - Any new DESIGN.md-ban-enforcement actions.
3. Push the branch. `gh pr create` with title `polish: <original post title> — <one-line summary>` and body covering: summary, resolved-item table, new playbook learnings, test plan.
4. Wait for Vercel preview URL. Surface to user with test cues per widget.
5. **Checkpoint 3**: user reviews preview. On explicit "yes push it": `gh pr merge --squash`. Otherwise iterate per their feedback.
6. After merge: archive `research/<slug>-polish/` → `research/archive/<slug>-polish/`. Delete the local branch. Update `docs/` with any new learnings.

---

## Time budget (for user expectations)

| Phase | Time |
|---|---|
| 0. Load context | 5 min |
| 1. Scope proposal | 5 min active |
| 2. Design review | 15 min (parallel) |
| 3. Aggregation | 10 min active |
| 4. Iteration | 30 min – 2h depending on scope |
| 5. Validation | 15 min |
| 6. PR + preview | 5 min active |
| **Total** | **~1–3 hours**, most of it in Phase 4 |

## Parallel runs

Two `/improve-an-article` invocations with different slugs are supported — each has its own `research/<slug>-polish/` dir and its own `posts/<slug>-polish` branch. Switch branches carefully between sessions.
