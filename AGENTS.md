<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:playbook-pointer -->
# Before touching articles

Every Claude session that touches a post, widget, or design primitive must load the playbook first:

- **[`docs/README.md`](./docs/README.md)** — the index. Points at everything else.
- **[`docs/voice-profile.md`](./docs/voice-profile.md)** — the taste file. Tone, framing, prose rules, widget rules, calibration examples.
- **[`docs/interactive-components.md`](./docs/interactive-components.md)** — widget-shape taxonomy, external primitives catalogue, DESIGN.md compliance invariants, per-widget lessons.
- **[`docs/pipeline-playbook.md`](./docs/pipeline-playbook.md)** — the nine-phase authoring pipeline, per-phase lessons, per-skill lessons from Phase F design reviews.
- **[`DESIGN.md`](./DESIGN.md)** — the design-system spec (tokens, motion, type, absolute bans).

Commands for the two authoring workflows:
- `/new-post` — full nine-phase pipeline for a brand-new article. Definition: [`.claude/commands/new-post.md`](./.claude/commands/new-post.md).
- `/improve-an-article` — iterate an existing post with the full playbook. Definition: [`.claude/commands/improve-an-article.md`](./.claude/commands/improve-an-article.md).

After a post ships, update the playbook with any new lesson learned — see `docs/README.md` §"Keeping these docs honest" for the update protocol.
<!-- END:playbook-pointer -->
