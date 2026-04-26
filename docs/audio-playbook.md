# bytesize — audio playbook

The reference document for how the lainlog audio system sounds and feels. Authority for any sound-related decision in the codebase.

Audio is a delight beat — the same register as `ClickSpark`, `TextHighlighter`, or a one-shot SVG-cover loop. It is **opt-in**, **default off**, and has only **ten** sounds in its vocabulary (nine user-triggered widget cues + the single-beat Dropdown-Open fired by `<NavigationSounds />` on every client-side route change). New widgets pick one of those ten or stay silent; we do not invent new sounds for new widgets.

This doc is loaded at Phase E of `/new-post` and during any feature build that touches an interactive widget. When any rule here conflicts with a one-off design decision, this doc wins unless the conflict is explicitly resolved with the user.

---

## 1. Anchor principles

Seven non-negotiables. If a proposal violates any of these, the proposal loses.

1. **Audio is OPT-IN, default OFF.** State persists in `localStorage["lainlog:audio"] = "on" | "off"`. The Header speaker icon is the only way to flip it.
2. **`prefers-reduced-motion: reduce` → audio off automatically.** No user override in v1. If the OS preference says quiet, we listen.
3. **Sound is never the sole feedback channel.** Every wire-site already has a visual cue — sound layers onto an existing affordance, never replaces one.
4. **Same action = same sound everywhere.** A button-press click sounds identical in every widget. Consistency over novelty.
5. **Volume default subtle.** Per-sound gain values are calibrated at the patch level (see `.web-kits/core.ts`); a uniform 1.0 multiplier passes them through unattenuated. Documented in §6.
6. **Pause when tab is hidden.** `document.visibilityState !== "visible"` → skip. Background tabs stay silent.
7. **User-triggered only.** Autonomous animations (cover loops, off-screen widget motion, queue-drain hops, EC pop animations) do NOT play sounds.

## 2. Tier-1 — the 10 sounds we use

| `SoundName`     | Patch source         | Use site |
|---|---|---|
| `Progress-Tick` | `core.progress-tick` | `<WidgetNav>` (prev / play-pause / next). `CallStackECs` Step / Back / Run / Reset. `<Scrubber>` (drag-start + arrow-key advance). One-shot widget Run buttons that kick off a state machine: `HostilePageScan` start, `InfectiousJailbreak` play, `Polling` / `LongPoll` / `WebSocketStream` play, `KeyDerivation` regenerate, `TypingPause` play / keystroke / reset, `PredictReveal` reveal. |
| `Click`         | `core.click`         | `<Quiz>` option-press. `MicrotaskStarvation` per-button presses (`+ micro`, `+ macro`, `+ self-sched`, `reset`). Click is reserved for **discrete pick / commit** — see the rule under §13. |
| `Copy`          | `core.copy`          | `<CopyButton>` after `navigator.clipboard.writeText` resolves. |
| `Radio`         | `core.radio`         | All binary state flips and segmented-control rows: `<ThemeToggle>`, `<AudioToggle>` (toggle-OFF — toggle-ON fires `Pop` for iOS unlock), `DefenceCoverage`, `ParseVsRender`, `RequestJourney`, `OriginMatrix`, `CostMatrix`, `CacheWalk`, `NetflixSplit`, `DeclarationStates`, `WhyTwoPasses`, `RequestClassifier` (all 3 sub-controls), `PredictTheOutput`. |
| `Pop`           | `core.pop`           | `CallStackECs` on EC push (stack length grows step-over-step). Also: first toggle-ON preview (iOS AudioContext unlock + audible welcome). |
| `Slide`         | `core.slide`         | `MicrotaskStarvation` on user Run-click. ONE shot per click — internal queue-drain hops stay silent. |
| `Dropdown-Open` | `core.dropdown-open` | `<NavigationSounds />` (mounted in `app/layout.tsx`) on every client-side route change. Single beat per navigation. First mount is silent (no autoplay on initial load). |
| `Success`       | `core.success`       | `<Quiz>` on correct-answer reveal. |
| `Error`         | `core.error`         | `<Quiz>` on wrong-answer reveal AND on "reveal answer" escape hatch. |
| `Swoosh`        | `core.swoosh`        | `PredictTheStart` verdict reveal. Capped at one shot per page-load via a ref. |

**Total vocabulary = 10.** This is the cap. Adding an 11th sound requires shipping a new section here and surviving a `/grill-me` defending why an existing sound can't carry the meaning.

## 3. Tier-2 — deferred (revisit after dogfooding)

No sounds are currently deferred. The original Tier-2 entries (`Page-Enter`, `Page-Exit`) were promoted to Tier-1 after the navigation transition feedback gap surfaced in dogfooding, then **retired entirely** in the 2026-04-26 minimal → core patch swap. Single-beat navigation now rides `Dropdown-Open` via `<NavigationSounds />` mounted in `app/layout.tsx`.

If we ever defer a sound again, it lands here with criteria for promotion. Do not unilaterally enable.

## 4. Tier-3 — do not use

The following sounds are **banned**. Reason cards sit next to each so future contributors can't accidentally re-litigate.

| Sound | Why banned |
|---|---|
| `Hover` | Hover sounds train aversion. They fire on every micro-cursor twitch and never carry information the visual hover state doesn't already give. |
| `Key-Press` | Keypress audio implies typing-as-feedback, which lainlog never does — readers don't author content here. |
| `Tap` | Visually equivalent to `Click` in the Core patch, but lower gain and weaker punch. We use `Click` for discrete picks and `Progress-Tick` for state-machine advance — Tap adds nothing. |
| `Toggle-On`, `Toggle-Off` | Retired in the 2026-04-26 patch swap. `Radio` carries every binary flip in both directions — one sound, no off-sound, vocabulary stays tight. |
| `Page-Enter`, `Page-Exit` | Retired in the 2026-04-26 patch swap. Single-beat `Dropdown-Open` carries client-side navigation. The `Page-Exit` half stays retired (single beat preserved per PR #64 dub-dub feedback). |
| `Dropdown-Close` | We open dropdowns on click; we close them on click-outside or escape. The opening beat is the affordance — closing is autonomous. Adding a sound to it would double the audio surface area without adding meaning. |
| `Notification`, `Info`, `Warning` | lainlog has no inbox, no toasts, no alerts. These belong to apps that interrupt. |
| `Send`, `Delete`, `Undo`, `Tab-Switch`, `Checkbox`, `Select`, `Deselect`, `Collapse`, `Expand` | App-grammar sounds for chat / form / file-tree UIs. We're a reading site; we don't have these affordances. |

## 5. Implementation contract

```ts
// lib/audio.ts
export type SoundName =
  | "Progress-Tick" | "Click" | "Copy" | "Radio"
  | "Pop"           | "Slide" | "Dropdown-Open"
  | "Success"       | "Error" | "Swoosh";

export function playSound(name: SoundName): void;
```

`playSound` is a fire-and-forget no-op unless every gate passes:

1. Browser env (`typeof window !== "undefined"`).
2. `localStorage["lainlog:audio"] === "on"`.
3. `window.matchMedia("(prefers-reduced-motion: reduce)").matches === false`.
4. `document.visibilityState === "visible"`.
5. In dev mode: `localStorage["lainlog:audio:dev"] === "on"` (keeps the dev loop silent by default — a one-time `localStorage.setItem("lainlog:audio:dev", "on")` in DevTools turns it on for that machine).

Once gates pass, the throttle / decay rules in §7 apply, then the underlying `defineSound` voice fires through a lazily-created `AudioContext`.

## 6. Per-sound gain calibration

Calibration moved to the patch level in the 2026-04-26 minimal → core swap. The runtime multiplier in `lib/audio.ts` is a uniform `1.0` — the per-sound balancing is encoded in `.web-kits/core.ts`'s `gain` fields, where Click / Pop / Error / Radio / Copy were trimmed from the upstream Core defaults so the whole vocabulary lands at the same perceived loudness.

| Sound           | Patch gain (`.web-kits/core.ts`) | Upstream default | Notes |
|---|---:|---:|---|
| `Progress-Tick` | 0.10 | 0.10 | Held at upstream — 1400 Hz tick is already small. |
| `Click`         | 0.10 | 0.25 | **Trimmed.** Click fires on every Quiz option-press; sits in the background. |
| `Copy`          | 0.08 / 0.07 (layers) | 0.16 / 0.14 | **Trimmed.** Quiet clipboard ack — must not break reading flow. |
| `Radio`         | 0.10 | 0.20 | **Trimmed.** Fires on every binary flip and segmented row. |
| `Pop`           | 0.10 | 0.25 | **Trimmed.** EC push repeats through multi-step traces; decay rule attenuates streaks but the first beat needs to match Click. |
| `Slide`         | 0.07 | 0.07 | Held — bandpassed white-noise burst, already subtle. |
| `Dropdown-Open` | 0.07 | 0.07 | Held — settling tap on navigation, intentionally smaller than widget cues. |
| `Success`       | 0.16 / 0.14 / 0.15 (layers) | 0.16 / 0.14 / 0.15 | Held — once-per-quiz lift. |
| `Error`         | 0.12 / 0.08 (layers) | 0.22 / 0.12 | **Trimmed.** Sawtooth + square pair already heavy; we don't need extra weight. |
| `Swoosh`        | 0.12 | 0.12 | Held — once-per-page verdict reveal. |

Runtime multiplier (`lib/audio.ts:UNIFORM_GAIN`) = **1.0**.

If you change either the patch-level `gain` or `UNIFORM_GAIN`, update both this table and the source in the same commit.

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

**Source.** [`raphaelsalaja/audio`](https://github.com/raphaelsalaja/audio) @ `main` · re-fetched 2026-04-26.

**Patch JSON.** [`https://raw.githubusercontent.com/raphaelsalaja/audio/main/.web-kits/core.json`](https://raw.githubusercontent.com/raphaelsalaja/audio/main/.web-kits/core.json) — the `core` patch (`v3.1.0`). Earlier revisions used the `minimal` patch JSON at the same path stem (`.web-kits/minimal.json`).

**License.** MIT (Raphael Salaja, 2026). Verified at `.web-kits/core.ts` header.

**Runtime.** `@web-kits/audio@0.1.0` (npm). Pure Web Audio synth. No analytics. No autoplay. Two `fetch` calls in the dist exist solely for sample-source URLs and convolver impulse-response URLs — neither code path fires for any Tier-1 sound (all 10 are procedural: sine / sawtooth / square / white-noise + biquad filter; no `type: "sample"`, no `ConvolverEffect`).

**CLI bypass.** The upstream `npx @web-kits/audio add` CLI requires a TTY and triggers a `registerPatch()` POST to `audio.raphaelsalaja.com/api/patches` for telemetry. We bypassed the CLI: the patch JSON was downloaded directly from the repo and converted to the same `.web-kits/core.ts` shape the CLI's `generateModule()` produces. **Every sound not in §2's table was physically excluded from the file** — bundle weight is 10 `SoundDefinition` objects (~1.1 kB gz) instead of the upstream Core patch's 62.

**No patch updates without re-audit.** If you bump `@web-kits/audio` or refresh the patch JSON, re-run this audit checklist:
- License unchanged (MIT).
- No new top-level `fetch` / `XMLHttpRequest` outside the existing sample / IR loaders.
- No analytics injection.
- No autoplay-on-mount changes in `context.ts`.
- No new `type: "sample"` or `ConvolverEffect` in any of the 10 retained sounds.

## 11. First-visit prompt

`<AudioPromptTooltip>` (co-located inside `<AudioToggle>`) renders a small "try it with sounds on" bubble anchored beside the speaker icon. It exists for one job: tell first-time readers the audio system is here and opt-in. It is never shown again once dismissed.

Render conditions (ALL must be true):

- Component has hydrated (avoids SSR mismatch — `localStorage` isn't available on the server).
- `usePathname() === "/"` — home page only. Article pages stay quiet.
- Audio preference is `false` (no point prompting if the reader's already opted in).
- `localStorage["lainlog:audio:prompt-dismissed"] !== "true"`.

Dismiss paths (both persist):

- The `×` close button → `localStorage.setItem("lainlog:audio:prompt-dismissed", "true")` and unmounts via `<AnimatePresence>`.
- Toggling audio ON without clicking close → the parent `<AudioToggle>` flips `audioEnabled` to true; the tooltip's effect persists `prompt-dismissed = "true"` so it never reappears even if the reader later turns audio back off.

The tooltip is decorative (`role="status"`, non-interruptive). It does not trap focus. Reduced-motion users get the static state via `<MotionConfigProvider reducedMotion="user">`.

## 12. Session sound budget

A reading session shouldn't exceed **~100 sounds in 5 minutes**. If a future widget would push over that, the widget needs redesign — not a quieter sound.

The throttle + decay rules already make a session inside this budget feel pleasant. The budget exists to flag widgets that are wiring sound to autonomous animation.

## 13. New-widget checklist

When authoring an interactive widget, before opening the PR:

- [ ] Decide which Tier-1 sound (if any) applies. Match by *user action*, not visual register: a "step forward" button is `Progress-Tick` whether it's in `WidgetNav` or a bespoke control row.
- [ ] Apply the **Click vs Progress-Tick rule** below.
- [ ] Wire `playSound()` at the **user-trigger** event handler. Not in a `useEffect` watching state. Not in an animation completion callback.
- [ ] Confirm autonomous motion is silent — auto-advance steppers, queue-drain hops, cover-loop ticks.
- [ ] If your widget has both push and pop semantics (cards in / cards out), only the user-pushed direction plays sound. Pops ride the visual exit animation.
- [ ] Verify the widget's existing visual cue still carries the meaning if audio is off (principle 3).
- [ ] Add the new wire-site to §2's table in this doc.

### Click vs Progress-Tick rule

| Use `Progress-Tick`                                                 | Use `Click`                              |
|---|---|
| Advancing through a sequence (Step / Back / Run / Pause / Reset)    | Discrete pick / commit (Quiz option-press) |
| Scrubber arrow-key advance + drag-start                             | `MicrotaskStarvation` add-buttons (one-shot adds, not progress)        |
| One-shot Run buttons that kick off a state machine                  | — |
| `PredictReveal` (the click advances the article state)              | — |

The distinction is for **dev consistency**, not reader perception. Readers don't auditorily distinguish a Click from a Progress-Tick in any meaningful way — but having the rule keeps wire-sites self-similar across the codebase. Example call-sites: `<WidgetNav>`, `<Scrubber>`, `CallStackECs` Step/Back/Run/Reset, `Polling`/`LongPoll`/`WebSocketStream` play, `HostilePageScan` start, `InfectiousJailbreak` play, `KeyDerivation` regenerate, `TypingPause` play/keystroke/reset → all `Progress-Tick`. Quiz option presses → `Click`. `<CopyButton>` uses the dedicated `Copy` sound, not Click.

## 14. Anti-patterns

The following are recurring temptations. None of them ship.

- **Hover sounds.** See Tier-3.
- **Autoplay on mount.** Audio fires only on a user gesture. Never on load, never on intersection, never on focus.
- **Sound during autonomous animation.** A queue drain animating without a user click is autonomous. A cover SVG looping in the background is autonomous. Both stay silent.
- **Sound as the sole feedback channel.** If you find yourself wanting a sound because the visual is too subtle, fix the visual. Audio reinforces; it doesn't substitute.
- **Per-widget novel sounds.** New widget gets a new sound? No. Pick one of the ten or pick none.
- **Wiring a new sound just because a new sound is available.** When the patch adds vocabulary (the 2026-04-26 minimal → core swap added `Progress-Tick`, `Radio`, `Dropdown-Open`), the temptation is to find places to spend it. Resist. The new sound only ships if it carries meaning the existing vocabulary doesn't — and the bar is the §2 table, not "this would be cute".
- **Loud accent sounds for routine actions.** Routine = `Click` or `Progress-Tick`. The `Swoosh` lift is reserved for once-per-page reveal beats.
- **Skipping the throttle.** Custom widgets that build their own play helper bypass the throttle and stack into noise. Always go through `playSound()`.
- **Disabling the reduced-motion gate "just for delight".** Reduced-motion is non-negotiable. If a user has it on, they hear nothing.
