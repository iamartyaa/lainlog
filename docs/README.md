# bytesize — documentation index

The canonical reference set for authoring, reviewing, and shipping bytesize posts. Load these before writing or revising any article.

## Start here

1. **[`voice-profile.md`](./voice-profile.md)** — how posts should *sound* and *feel*. Tone, framing, prose rules, widget rules, tone-calibration examples. The taste file.
2. **[`interactive-components.md`](./interactive-components.md)** — widget-shape taxonomy (§1), external primitives we've integrated (§2: `TextHighlighter`, `DragElements`, `MediaBetweenText`), the full Fancy-library curation with fit ratings for every upstream component (§2.5), DESIGN.md compliance invariants, anti-patterns from actual review feedback, widget catalogue with per-widget lessons.
3. **[`pipeline-playbook.md`](./pipeline-playbook.md)** — the nine-phase authoring pipeline, per-phase lessons, session-resumption rules, checkpoint crib sheet, and per-skill lessons from Phase F design-review orchestration.
4. **[`svg-cover-playbook.md`](./svg-cover-playbook.md)** — animated SVG cover authoring rules. Element budget, motion amplitudes, mobile-thumbnail legibility, the v3→v4 refactor lessons. Read before touching any `components/covers/*Cover.tsx`.
5. **[`audio-playbook.md`](./audio-playbook.md)** — opt-in audio system. Eight Tier-1 sounds, anchor principles, per-sound gain calibration, throttle/decay rules, vendoring audit, new-widget checklist. Read before wiring sound to any new widget.

## Secondary references

- **[`mobile-first-verification.md`](./mobile-first-verification.md)** — the mobile-first migration trace. Useful for container-query rules.
- **[`../DESIGN.md`](../DESIGN.md)** — the design-system spec. Tokens, motion, type, absolute bans.
- **[`../AGENTS.md`](../AGENTS.md)** — Next.js 16 breaking-changes notice.

## Commands

- **[`../.claude/commands/new-post.md`](../.claude/commands/new-post.md)** — `/new-post`: the full nine-phase authoring pipeline for a fresh article.
- **[`../.claude/commands/improve-an-article.md`](../.claude/commands/improve-an-article.md)** — `/improve-an-article`: iterate on an existing post using the accumulated playbook and Phase F/G discipline.
- **[`../.claude/commands/orchestrate.md`](../.claude/commands/orchestrate.md)** — `/orchestrate`: long-running orchestrator. Dispatches multiple agents (`post-author`, `article-polisher`, `bug-fixer`, `feature-builder`, `brainstormer`) across worktrees so you can run several tasks in parallel and talk to the orchestrator any time. See `.claude/agents/` for each role's protocol.

## When to reach for which doc

| You are about to… | Load |
|---|---|
| Start a new article | `voice-profile.md` → `pipeline-playbook.md` → run `/new-post` |
| Improve an existing article | `voice-profile.md` → `interactive-components.md` → `pipeline-playbook.md §5` → run `/improve-an-article <slug>` |
| Design a new widget | `interactive-components.md §1` (shapes) → `../DESIGN.md §7` → `§6` (catalogue lessons) |
| Author an animated SVG cover | `svg-cover-playbook.md` (entire doc — short and prescriptive) |
| Run a single design-review skill | `pipeline-playbook.md §5` for the brief template |
| Write a callout, aside, or microcopy | `voice-profile.md §3` |
| Audit code for DESIGN.md compliance | `interactive-components.md §3` (the invariants checklist) |
| Evaluate a Fancy component before installing | `interactive-components.md §2.5` (full upstream curation + promotion criteria) |

## Keeping these docs honest

After a post ships, update the playbook:

1. **Any new widget shape** → add to `interactive-components.md §1` with a canonical example.
2. **Any new external primitive** → add to `interactive-components.md §2` with use-cases and anti-use-cases; also update the corresponding row in §2.5 from `🔸 candidate` to `✅ shipped`.
3. **Any new anti-pattern discovered during review** → add to `interactive-components.md §5`.
4. **Any voice-drift the user corrected** → add to `voice-profile.md §9` (or the appropriate earlier section).
5. **Any pipeline lesson learned** → add to `pipeline-playbook.md §2` for the phase or `§6` for common pitfalls.
6. **Any new skill-review insight** → add to `pipeline-playbook.md §5`.
7. **Any new SVG-cover failure mode** → append a numbered diagnostic to `svg-cover-playbook.md §11` and update §10's checklist.

The playbook is the shipping version of what we learned. Memories are the raw capture; these docs are the refined rules. If they go out of sync, the docs win.
