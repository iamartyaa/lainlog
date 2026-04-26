# bytesize — audio playbook

The reference document for how the lainlog audio system sounds and feels. Authority for any sound-related decision in the codebase.

Audio is a delight beat — the same register as `ClickSpark`, `TextHighlighter`, or a one-shot SVG-cover loop. It is **opt-in**, **default off**, and has only **eight** sounds in its vocabulary. New widgets pick one of those eight or stay silent; we do not invent new sounds for new widgets.

This doc is loaded at Phase E of `/new-post` and during any feature build that touches an interactive widget. When any rule here conflicts with a one-off design decision, this doc wins unless the conflict is explicitly resolved with the user.

---

## 1. Anchor principles

Seven non-negotiables. If a proposal violates any of these, the proposal loses.

1. **Audio is OPT-IN, default OFF.** State persists in `localStorage["lainlog:audio"] = "on" | "off"`. The Header speaker icon is the only way to flip it.
2. **`prefers-reduced-motion: reduce` → audio off automatically.** No user override in v1. If the OS preference says quiet, we listen.
3. **Sound is never the sole feedback channel.** Every wire-site already has a visual cue — sound layers onto an existing affordance, never replaces one.
4. **Same action = same sound everywhere.** A button-press click sounds identical in every widget. Consistency over novelty.
5. **Volume default subtle (~30–40% of upstream library).** Per-sound gain multipliers documented in §6. Calibrated by ear, refined in dogfooding.
6. **Pause when tab is hidden.** `document.visibilityState !== "visible"` → skip. Background tabs stay silent.
7. **User-triggered only.** Autonomous animations (cover loops, off-screen widget motion, queue-drain hops, EC pop animations) do NOT play sounds.

## 2. Tier-1 — the 8 sounds we use

| `SoundName`  | Patch source       | Use site |
|---|---|---|
| `Copy`       | `minimal.copy`     | `<CopyButton>` after `navigator.clipboard.writeText` resolves. |
| `Success`    | `minimal.success`  | `<Quiz>` on correct-answer reveal. |
| `Error`      | `minimal.error`    | `<Quiz>` on wrong-answer reveal AND on "reveal answer" escape hatch. |
| `Click`      | `minimal.click`    | `<WidgetNav>` (prev / play-pause / next). `<Quiz>` option-press. `MicrotaskStarvation` per-button presses (`+ micro`, `+ macro`, `+ self-sched`, `reset`). `CallStackECs` Step / Back / Run / Reset. |
| `Pop`        | `minimal.pop`      | `CallStackECs` on EC push (stack length grows step-over-step). Also: first toggle-ON preview (iOS AudioContext unlock). |
| `Slide`      | `minimal.slide`    | `MicrotaskStarvation` on user Run-click. ONE shot per click — internal queue-drain hops stay silent. |
| `Toggle-On`  | `minimal.toggle-on`| Segmented controls — both directions of the binary toggle (no `Toggle-Off`). `DeclarationStates`, `WhyTwoPasses`, `RequestClassifier`, `PredictTheOutput` variant chooser. |
| `Swoosh`     | `minimal.swoosh`   | `PredictTheStart` verdict reveal. Capped at one shot per page-load via a ref. |

**Total vocabulary = 8.** This is the cap. Adding a 9th sound requires shipping a new section here and surviving a `/grill-me` defending why an existing sound can't carry the meaning.

## 3. Tier-2 — deferred (revisit after dogfooding)

These sounds exist in the upstream Minimal patch but are not wired in v1. We may add them after 2–4 weeks of real reading sessions reveal a clear delight gap.

| Sound | Possible use | Criteria for revisit |
|---|---|---|
| `Page-Enter` | Post navigation | If readers report the click → article-loaded transition feels abrupt and the Header micro-bar isn't enough. |
| `Page-Exit`  | Post navigation | Mirrors Page-Enter; only ship as a pair. |

If you want to revisit, write the case in a PR description and tag the user. Do not unilaterally enable.

## 4. Tier-3 — do not use

The following sounds are **banned**. Reason cards sit next to each so future contributors can't accidentally re-litigate.

| Sound | Why banned |
|---|---|
| `Hover` | Hover sounds train aversion. They fire on every micro-cursor twitch and never carry information the visual hover state doesn't already give. |
| `Key-Press` | Keypress audio implies typing-as-feedback, which lainlog never does — readers don't author content here. |
| `Tap` | Visually equivalent to `Click` in the Minimal patch, but lower gain and weaker punch. We use `Click` for tactile presses and let `Pop` carry the bigger "something landed" beat. |
| `Toggle-Off` | We use `Toggle-On` for both directions of a binary switch. Two sounds for one toggle doubles the audio surface area without adding meaning. |
| `Notification`, `Info`, `Warning` | lainlog has no inbox, no toasts, no alerts. These belong to apps that interrupt. |
| `Send`, `Delete`, `Undo`, `Tab-Switch`, `Checkbox`, `Select`, `Deselect`, `Collapse`, `Expand` | App-grammar sounds for chat / form / file-tree UIs. We're a reading site; we don't have these affordances. |
| `Page-Enter`, `Page-Exit` | Tier-2 — see §3. Not banned, just deferred. |

## 5. Implementation contract

```ts
// lib/audio.ts
export type SoundName =
  | "Copy" | "Success" | "Error" | "Click"
  | "Pop"  | "Slide"   | "Toggle-On" | "Swoosh";

export function playSound(name: SoundName): void;
```

`playSound` is a fire-and-forget no-op unless every gate passes:

1. Browser env (`typeof window !== "undefined"`).
2. `localStorage["lainlog:audio"] === "on"`.
3. `window.matchMedia("(prefers-reduced-motion: reduce)").matches === false`.
4. `document.visibilityState === "visible"`.
5. In dev mode: `localStorage["lainlog:audio:dev"] === "on"` (keeps the dev loop silent by default — a one-time `localStorage.setItem("lainlog:audio:dev", "on")` in DevTools turns it on for that machine).

Once gates pass, the throttle / decay rules in §7 apply, then the underlying `defineSound` voice fires through a lazily-created `AudioContext`.

## 6. Per-sound gain multipliers

These multiply the patch's own `gain` value at play time. Calibrated subtle: most fire below 50% of upstream Minimal, on top of an already-quiet patch (gains 0.05–0.12). Refine in dogfooding.

| Sound | Multiplier | Why |
|---|---|---|
| `Copy`       | 0.9  | Already quiet (0.07–0.08) — just shave. |
| `Success`    | 0.85 | C5+G5 chord — present but not celebratory. |
| `Error`      | 0.7  | Low-300Hz pair reads heavy; soften. |
| `Click`      | 0.7  | Fires on every nav button — extra subtle. |
| `Pop`        | 0.75 | EC push fires repeatedly through a multi-step trace. |
| `Slide`      | 1.0  | Already 0.05; let it breathe. |
| `Toggle-On`  | 0.85 | Segmented controls. |
| `Swoosh`     | 1.1  | Verdict reveal, once per page-load — earn the lift. |

If you change a multiplier, update both `lib/audio.ts:GAIN_MULTIPLIER` and this table in the same commit.

## 7. Throttle + decay

To keep rapid repeats from stacking into a noise wall:

- **Throttle** — same sound within **100 ms** of the previous play is silently dropped. (Covers React strict-mode double-fires and key-repeat.)
- **Decay** — same sound replayed within **3000 ms** of the previous play attenuates by **0.08** per repeat, capped at **0.4** floor.
  - Play 1 = 100% (× per-sound multiplier).
  - Play 2 = 92%.
  - Play 3 = 84%.
  - Play 4 = 76%. Etc.
  - After 3000 ms of silence on that sound, the streak resets.

The decay is per-sound — Click decay does not affect Pop decay.

## 8. SSR safety + hydration model

`lib/audio.ts` is import-safe in any environment. Every `window` / `document` / `localStorage` access is guarded.

`useAudioPreference()` initialises with `enabled: false`, then hydrates from `localStorage` in a post-mount `useEffect`. This avoids hydration mismatch — the first server-rendered HTML always shows the muted icon, and the client briefly re-renders to the user's stored preference.

`<AudioToggle>` follows the same pre-mount placeholder trick as `<ThemeToggle>`: render an invisible 24×24 spacer until `mounted === true`, then swap in the real button. Layout doesn't shift.

The shared `AudioContext` is created lazily inside `defineSound`'s first invocation that survives all gates. We never instantiate it on import, so the module is safe to pull into RSC trees.

## 9. iOS Safari AudioContext unlock

iOS Safari refuses to start an `AudioContext` outside of a real user gesture. The first time the user toggles audio ON, `useAudioPreference.setEnabled(true)` synchronously calls `playSound("Pop")` from inside the click handler. That click is a user gesture, so the AudioContext resumes immediately.

Without this preview, the first non-toggle sound (e.g. a `<CopyButton>` press a few minutes later) would silently fail to fire on iOS until another gesture happened.

The preview is also a deliberate confirmation — the user hears the system come alive at the moment they opted in.

## 10. Vendoring audit notes

**Source.** [`raphaelsalaja/audio`](https://github.com/raphaelsalaja/audio) @ `main` · 2026-04-26.

**License.** MIT (Raphael Salaja, 2026). Verified at `.web-kits/minimal.ts` header.

**Runtime.** `@web-kits/audio@0.1.0` (npm). Pure Web Audio synth. No analytics. No autoplay. Two `fetch` calls in the dist exist solely for sample-source URLs and convolver impulse-response URLs — neither code path fires for any Tier-1 sound (all are pure sine layers with envelopes; no `type: "sample"`, no `ConvolverEffect`).

**CLI bypass.** The upstream `npx @web-kits/audio add` CLI requires a TTY and triggers a `registerPatch()` POST to `audio.raphaelsalaja.com/api/patches` for telemetry. We bypassed the CLI: the patch JSON was downloaded directly from the repo and converted to the same `.web-kits/minimal.ts` shape the CLI's `generateModule()` produces. **Tier-2 / Tier-3 sounds were physically excluded from the file** — bundle weight is 8 `SoundDefinition` objects (~0.5 kB gz) instead of the upstream patch's 26.

**No patch updates without re-audit.** If you bump `@web-kits/audio` or refresh the patch JSON, re-run §10's audit checklist:
- License unchanged (MIT).
- No new top-level `fetch` / `XMLHttpRequest` outside the existing sample / IR loaders.
- No analytics injection.
- No autoplay-on-mount changes in `context.ts`.

## 11. Session sound budget

A reading session shouldn't exceed **~100 sounds in 5 minutes**. If a future widget would push over that, the widget needs redesign — not a quieter sound.

The throttle + decay rules already make a session inside this budget feel pleasant. The budget exists to flag widgets that are wiring sound to autonomous animation.

## 12. New-widget checklist

When authoring an interactive widget, before opening the PR:

- [ ] Decide which Tier-1 sound (if any) applies. Match by *user action*, not visual register: a "step forward" button is `Click` whether it's in `WidgetNav` or a bespoke control row.
- [ ] Wire `playSound()` at the **user-trigger** event handler. Not in a `useEffect` watching state. Not in an animation completion callback.
- [ ] Confirm autonomous motion is silent — auto-advance steppers, queue-drain hops, cover-loop ticks.
- [ ] If your widget has both push and pop semantics (cards in / cards out), only the user-pushed direction plays sound. Pops ride the visual exit animation.
- [ ] Verify the widget's existing visual cue still carries the meaning if audio is off (principle 3).
- [ ] Add the new wire-site to §2's table in this doc.

## 13. Anti-patterns

The following are recurring temptations. None of them ship.

- **Hover sounds.** See Tier-3.
- **Autoplay on mount.** Audio fires only on a user gesture. Never on load, never on intersection, never on focus.
- **Sound during autonomous animation.** A queue drain animating without a user click is autonomous. A cover SVG looping in the background is autonomous. Both stay silent.
- **Sound as the sole feedback channel.** If you find yourself wanting a sound because the visual is too subtle, fix the visual. Audio reinforces; it doesn't substitute.
- **Per-widget novel sounds.** New widget gets a new sound? No. Pick one of the eight or pick none.
- **Loud accent sounds for routine actions.** Routine = `Click` at multiplier 0.7. The `Swoosh` lift is reserved for once-per-page reveal beats.
- **Skipping the throttle.** Custom widgets that build their own play helper bypass the throttle and stack into noise. Always go through `playSound()`.
- **Disabling the reduced-motion gate "just for delight".** Reduced-motion is non-negotiable. If a user has it on, they hear nothing.
