# bytesize — animated SVG cover playbook

Codified lessons from the v1 → v3 → v4 cover work (PR #44, merged 2026-04-25). Read this before authoring or revising any animated cover (`components/covers/*Cover.tsx`). Pairs with `interactive-components.md` (widget shapes) and `../DESIGN.md` (motion + visual bans).

The covers exist in two render contexts:
- **Home-list thumbnail** at 64×64 px (mobile) / 80×80 px (lg) — `components/nav/PostList.tsx`.
- **Hero tile** on the post page at a larger render — `components/prose/HeroTile.tsx`.

Both surfaces render `<PostCover slug size />` from `components/covers/PostCover.tsx`. The OG / social-share fallback (`/cover/<slug>` raster route) is unaffected — those Twitter/LinkedIn previews can't animate, so the static typographic tile is correct there.

---

## §1. The single rule that decides everything

**A cover is read at 64 px first.** If the user can't tell what's animating at thumbnail size, the cover is wrong — no matter how clever the close-up looks at 200 px.

That one rule generates every other constraint in this doc. Internalise it before you touch a path.

---

## §2. The element-budget rule (the v3 → v4 lesson)

The v3 covers shipped with **50–70 elements per SVG** — packed compositions that read beautifully at 200 px and were illegible at 64 px. The user's verbatim feedback: *"You created too many little components in the animated SVG that it is difficult to view them."*

The v4 covers shipped at **8–14 load-bearing elements per SVG**. Same readability at 200 px, dramatically better at 64 px. The lesson:

| Cover style | Element count | Verdict |
|---|---|---|
| 50+ micro-elements | "scene with extras" | ❌ — illegible at thumbnail; motion drowns in noise |
| 8–14 large-element editorial poster | "one hero idea" | ✅ — legible at 64 px AND hero size |

**Default: aim for 10–14 elements per cover.** A "load-bearing element" is anything that contributes to the visual story: shapes, paths, labels. Decorative dots / specks count.

A useful gut check: pick the single most important shape in the composition and ask "if a reader saw ONLY this shape at 64 px, would they recognise the post?" If yes, you have a hero. The rest is supporting cast.

---

## §3. Motion amplitude must survive 4× downscale

A 64 px thumbnail is the 200 px viewBox scaled to ~32%. A `translate: 4px` looks like a 1.3-px nudge — invisible. A 0.96→1 scale on a small element is invisible. The reader's brain reads the cover as static.

**Use large amplitudes deliberately:**

| Property | Useful range at 200×200 viewBox | Reads at 64 px? |
|---|---|---|
| `translateX` / `translateY` | ≥ 30 (15% of viewBox) | ✅ |
| `translateX` / `translateY` | < 10 | ❌ |
| `scale` | ≥ 1.2× peak (or 0.8× trough) | ✅ |
| `scale` | 1.04–1.08 (subtle pulse) | ❌ at thumb, ✅ on a HERO element only |
| `pathLength: 0 → 1` (full draw) | full | ✅ |
| `opacity: 0 → 1` (full reveal) | full | ✅ on a key shape |
| `rotate` on a small dot | any | ❌ unreadable; pick scale or translate instead |

**One bold gesture > five subtle ones.** v3 covers had multiple subtle pulses on micro-elements — each motion was below the noise floor. v4 covers have one large gesture per cover (comet glides 60% of the viewBox; bit-array cells flip terracotta in sequence; outer scope fades visibly while inner stays solid).

---

## §4. Continuous motion, not phase-stagger

v3 covers used phase-stagger sequences ("at 0–1s element A pulses, at 1–2s element B pulses, at 2–3s element C…"). The result: most of the time, the reader is staring at a still cover. By the time they look at the home page, the action is on a different element. *"Blink and you miss it."*

**v4 covers loop continuously**, with the action sustained. The motion is happening NOW, not in 1.4 seconds.

- **Loop period 4–5 seconds** (was longer in v3, with idle gaps).
- **No idle gap** between iterations — when the loop ends, the next one starts immediately. (Reduced-motion users get the static end-state, which is the correct trade-off.)
- **Hover amplifies the same motion** — don't replace the idle motion with a different motion on hover. Push the amplitude harder; speed up the period; brighten the colour. Same gesture, more committed.

The exception: a multi-phase narrative is fine if EACH phase has a visible bold gesture (e.g. HowGmail v4: pulse → arcs draw → cells flip → tick spark — every phase has motion the reader can see at 64 px).

---

## §5. ViewBox sizing: settle on 200×200

v1 used 100×100. v3 doubled to 200×200 — gives more room for legible strokes, larger amplitudes, less per-pixel work. **Use 200×200 unless you have a specific reason to deviate.** All v4 covers are 200×200; the `_CoverFrame.tsx` helper enforces this.

Stroke-widths: at 200×200, a `strokeWidth: 1.5` reads at 64 px as ~0.5 px (anti-aliased). For load-bearing strokes use `strokeWidth: 2.0–3.0`. For chrome/background lines, `1.0–1.5` is fine because it's not what the reader is looking for.

---

## §6. The motion-property allow-list (R6 frame-stability)

**Animate only:** `transform` (translate / scale / rotate), `opacity`, `pathLength`, `strokeDashoffset`. These are GPU-cheap and don't trigger layout.

**Never animate:** `width`, `height`, `viewBox`, `x`, `y`, `cx`, `cy`, `rx`, `ry`, geometric attributes that would invalidate layout. The 200×200 outer container is fixed for the entire animation lifecycle — this is the R6 frame-stability rule, applied to covers.

---

## §7. Tokens-only colour. No exceptions.

Use CSS variables only:

- `var(--color-accent)` — terracotta, the one accent
- `var(--color-text)` — body text
- `var(--color-text-muted)` — secondary, chrome
- `var(--color-rule)` — borders, dividers
- `var(--color-surface)` — backgrounds

**Banned in covers** (per `../DESIGN.md` §3 / §12):
- Raw hex
- Gradients of any kind (`linearGradient`, `radialGradient`)
- Drop-shadows / `filter: drop-shadow(...)`
- Multiple terracotta shades — one accent, used at varying opacities only
- Border-left stripes (a §12 ban that has bitten polishes; not relevant to SVG covers but listed for completeness)

If a cover seems to need a gradient or a shadow to feel alive, you have an element-count or motion-amplitude problem hiding behind a treatment band-aid. Fix the structure, not the surface.

---

## §8. Performance: useInView pause + reduced-motion end-state

Both are MANDATORY. They live in `_CoverFrame.tsx`:

- **`useInView`** from `motion/react` — covers scrolled off-screen suspend their animations. Critical on the home list where 5+ covers are mounted.
- **`useReducedMotion`** branch — under reduced-motion, render the **meaningful end-state**, not the start. Examples:
  - HowGmail: bit-array fully lit + verdict tick visible.
  - WhyFetchFails: comet bounced back, echo-rings visible.
  - BrowserStoppedAsking: beam visible with packets at midpoint.
  - FunctionRemembered: tether visible, outer faded.

A reduced-motion user must still understand the cover's metaphor from the still frame. If the still frame doesn't carry the meaning, the metaphor is wrong.

---

## §9. The cover-author workflow (skill-mapped)

Inherit from the `feedback_use_design_skills_in_feature_work.md` rule: never carpet-bomb skills, pick the 2–3 most relevant per phase. For covers, the canonical phasing is:

1. **`/clarify` — concept-lock.** Before any path: write the cover as one sentence ("a comet hits a CORS wall and bounces"). If you can't say it in one sentence, the cover is wrong. **Lock concepts in the task JSON `agent_notes` before drawing.**
2. **Draft the static SVG** — JSX paths, no motion yet. Aim for the element budget from §2.
3. **`/bolder` — between static and motion.** Read the static draft and ask: "is this safe / generic? where can the central gesture be larger or more committed?" Apply during draft, not after.
4. **`/animate` — motion design.** Once shapes are static-correct, layer `motion.path` / `motion.g` with the amplitudes from §3 and the loop discipline from §4.
5. **`/delight` — at iteration time.** ≤ 1 small joy beat per cover (e.g. a verdict-tick spark). Cap **3–4 across a 5-cover set**.
6. **`/overdrive` — opt-in only.** Reserve for explicit hero covers (the user's named hero example for v4 was the bloom-filter HowGmail cover). **Do not apply by default.** Ambitious motion is opt-in, not the baseline.
7. **`/polish` — final pass.** Token compliance, alignment, off-by-one strokes. Right before push.

**Order matters: build simplest first, hero last.** Builds judgement and lets you apply lessons forward through the set.

---

## §10. The author's checklist (run before push)

For every cover changed:

- [ ] Element count ≤ 14 (§2)
- [ ] One identifiable hero shape that reads at 64 px (§1)
- [ ] Motion amplitudes from the §3 allow-list; no sub-noise-floor pulses
- [ ] Continuous loop, no phase-stagger gaps (§4)
- [ ] viewBox 200×200; only `transform`/`opacity`/`pathLength`/`strokeDashoffset` animated (§5, §6)
- [ ] Tokens only, no hex / gradient / shadow (§7)
- [ ] `useInView` paused off-screen (inherited from `_CoverFrame`)
- [ ] `useReducedMotion` → meaningful end-state (§8)
- [ ] Hover amplifies idle motion (doesn't replace it)
- [ ] `useId()` on any per-instance `<defs>` ids (SSR/CSR collision prevention)
- [ ] Visually verified at 64 px AND hero size

If you can't tick all 11, don't push.

---

## §11. The diagnostic when a cover lands wrong

If the user comes back and says some variant of *"I can't see what's happening"* or *"animation isn't visible"*:

1. **First diagnosis: element count.** Run a quick read of the file. If you see > 25 elements in the SVG, that's almost always the bug — refactor toward §2.
2. **Second diagnosis: motion amplitude.** Look at the variants. Any `scale: 1.04`, `translate: < 10`, or `opacity: 0.8 → 1` on a small element is invisible at thumbnail. Push to §3 thresholds.
3. **Third diagnosis: phase-stagger gaps.** If the loop has a > 1.5s pause between gestures, fix to §4 continuous.
4. **Fourth: hover doesn't amplify.** If hover replaces motion (e.g. starts a different animation), fix to §4 amplification model.

Don't just tweak — refactor against this checklist. v3 → v4 was a refactor, not tweaks; that's why it succeeded.

---

## §12. Files involved

- `components/covers/PostCover.tsx` — slug → component registry. Add new posts here.
- `components/covers/_CoverFrame.tsx` — shared 200×200 frame, view-transition wiring, `useInView` + `useReducedMotion` gate. **Do not duplicate this logic in individual covers.**
- `components/covers/<Name>Cover.tsx` — one per post. Single hero idea, animated.
- `components/covers/index.ts` — re-export.
- `app/cover/[slug]/route.ts` — OG/social raster fallback (unrelated to in-app animated covers; kept untouched).

When adding a new post: register in `PostCover.tsx`, author the new `<Name>Cover.tsx` against this playbook, no other plumbing required.

---

## §13. Concept-bundle gate (for orchestrated work)

When a cover task is dispatched through `/orchestrate`, the agent MUST surface a concept bundle (one sentence + element list per cover) for user approval BEFORE drawing any paths. The v3 failure was caught at user-review; the v4 success was structured around concept-lock first. Build this gate into every cover task brief: *concepts approved → draw → motion → polish*, not *"hand me a finished bundle."*

---

This doc graduates after every cover-set ships. If a future cover refactor finds a new failure mode, append a numbered diagnostic to §11 and update §10 accordingly.
