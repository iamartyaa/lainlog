/**
 * lib/audio.ts — central play surface for the bytesize audio system.
 *
 * Anchor principles (also enumerated in `docs/audio-playbook.md`):
 *   1. Audio is default ON. State persists in
 *      `localStorage["lainlog:audio"] = "on" | "off"`. Unset / null reads
 *      as ON; only an explicit `"off"` mutes. (Updated 2026-05-02 — the
 *      original opt-in default was flipped to opt-out per user direction.)
 *   2. `prefers-reduced-motion: reduce` → audio off automatically.
 *   3. Sound is never the sole feedback channel.
 *   4. Same action = same sound everywhere.
 *   5. Volumes calibrated subtle. Per-sound gain documented inline below.
 *   6. Pause when tab is hidden (`document.visibilityState !== "visible"`).
 *   7. User-triggered only — autonomous animations do NOT call `playSound`.
 *
 * Patch migration (2026-04-26): the upstream `@web-kits/audio` patch was
 * swapped from `minimal` → `core`. The new vocabulary adopts three richer
 * sounds — `Progress-Tick`, `Radio`, `Dropdown-Open` — and retires three
 * — `Toggle-On`, `Page-Enter`, `Page-Exit`. The total cap is still 10.
 *
 *   - `Progress-Tick` covers state-machine advance: WidgetNav step / back /
 *     run / pause / reset, scrubber arrow-key advance, one-shot widget Run
 *     buttons, PredictReveal. Fires when the action *advances through a
 *     sequence*.
 *   - `Click` is reserved for discrete pick / commit: Quiz option-press
 *     remains the only Click site after the migration. The distinction is
 *     for dev consistency, not reader perception.
 *   - `Radio` covers all binary state flips and segmented-control rows that
 *     used to fire `Toggle-On`. Theme toggle, Audio toggle, every per-row
 *     pick across the catalogue.
 *   - `Dropdown-Open` covers the single-beat `<NavigationSounds />` cue on
 *     client-side route change. `Page-Exit` stays retired (single beat
 *     preserved per PR #64 dub-dub feedback). No `Dropdown-Close`.
 *
 * Implementation notes:
 *   - SSR-safe: every `window`/`document`/`localStorage` access is guarded.
 *   - The `AudioContext` is created lazily on the first `playSound` that
 *     passes every gate. We never instantiate it on import — that lets the
 *     module be safely imported into RSC / SSR boundaries and keeps Safari
 *     iOS quiet until a real user gesture (the toggle-ON `Pop` preview).
 *   - Throttle: same sound within `THROTTLE_MS` (100ms) is dropped.
 *   - Decay: same sound replayed within `DECAY_WINDOW_MS` (3000ms) of the
 *     previous play attenuates by `DECAY_STEP` (0.08) per repeat, capped at
 *     `DECAY_MIN_FACTOR` (0.4). After `DECAY_WINDOW_MS` of silence on that
 *     sound, the streak resets.
 *   - Dev gate: in `process.env.NODE_ENV === "development"`, audio stays
 *     silent unless `localStorage["lainlog:audio:dev"] === "on"` — keeps
 *     the dev loop quiet by default.
 */

import { defineSound, type SoundDefinition } from "@web-kits/audio";
import {
  click,
  copy,
  dropdownOpen,
  error,
  pop,
  progressTick,
  radio,
  slide,
  success,
  swoosh,
} from "@/.web-kits/core";

export type SoundName =
  | "Progress-Tick"
  | "Click"
  | "Copy"
  | "Radio"
  | "Pop"
  | "Slide"
  | "Dropdown-Open"
  | "Success"
  | "Error"
  | "Swoosh";

/**
 * Per-sound gain multipliers applied AFTER the patch's own `gain`. The
 * UNIFORM 1.0 baseline (PR #65) passes the patch's native gain through
 * unattenuated — the per-sound balancing lives at the patch level (see
 * `.web-kits/core.ts`, where Click / Pop / Error / Radio / Copy were
 * trimmed from the upstream Core defaults to land at the same perceived
 * loudness as Slide / Swoosh / Dropdown-Open / Progress-Tick / Success).
 *
 * If the next round of feedback says it's still too quiet, the next lever
 * is bumping the patch-level `gain` values in `.web-kits/core.ts` per-sound
 * (or going above 1.0 here, with the caveat that values >1 risk WebAudio
 * clipping on percussive transients).
 *
 * If you change this constant, also update §6 of `docs/audio-playbook.md`.
 */
const UNIFORM_GAIN = 1.0;
const GAIN_MULTIPLIER: Record<SoundName, number> = {
  "Progress-Tick": UNIFORM_GAIN,
  Click: UNIFORM_GAIN,
  Copy: UNIFORM_GAIN,
  Radio: UNIFORM_GAIN,
  Pop: UNIFORM_GAIN,
  Slide: UNIFORM_GAIN,
  "Dropdown-Open": UNIFORM_GAIN,
  Success: UNIFORM_GAIN,
  Error: UNIFORM_GAIN,
  Swoosh: UNIFORM_GAIN,
};

/**
 * Map our public `SoundName` (CamelCase, brand-friendly) onto the patch
 * exports (camelCase locals from `@/.web-kits/core`).
 */
const PATCH_DEF: Record<SoundName, SoundDefinition> = {
  "Progress-Tick": progressTick,
  Click: click,
  Copy: copy,
  Radio: radio,
  Pop: pop,
  Slide: slide,
  "Dropdown-Open": dropdownOpen,
  Success: success,
  Error: error,
  Swoosh: swoosh,
};

const THROTTLE_MS = 100;
const DECAY_WINDOW_MS = 3000;
const DECAY_STEP = 0.08;
const DECAY_MIN_FACTOR = 0.4;

const STORAGE_KEY = "lainlog:audio";
const DEV_STORAGE_KEY = "lainlog:audio:dev";

type LastPlay = { ts: number; streak: number };
const lastPlay = new Map<SoundName, LastPlay>();

let voiceCache: Partial<Record<SoundName, ReturnType<typeof defineSound>>> = {};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function readPref(): boolean {
  if (!isBrowser()) return false;
  try {
    // Default ON: unset / null reads as on; only an explicit "off" mutes.
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "on";
  } catch {
    return false;
  }
}

function readDevPref(): boolean {
  if (!isBrowser()) return false;
  try {
    return window.localStorage.getItem(DEV_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function reducedMotion(): boolean {
  if (!isBrowser() || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function tabHidden(): boolean {
  if (!isBrowser()) return true;
  return document.visibilityState !== "visible";
}

function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Lazily build the `defineSound` voice for a given name. Cached. */
function voiceFor(name: SoundName): ReturnType<typeof defineSound> {
  const cached = voiceCache[name];
  if (cached) return cached;
  const built = defineSound(PATCH_DEF[name]);
  voiceCache[name] = built;
  return built;
}

/**
 * Play one of the Tier-1 sounds. No-op unless every gate passes. Safe to
 * call from any event handler (server-rendered components included — the
 * call is a no-op on the server).
 */
export function playSound(name: SoundName): void {
  if (!isBrowser()) return;
  if (!readPref()) return;
  if (reducedMotion()) return;
  if (tabHidden()) return;
  if (isDev() && !readDevPref()) return;

  const now = performance.now();
  const last = lastPlay.get(name);

  // Throttle — same sound within THROTTLE_MS is silently dropped. The
  // duplicate suppression covers double-fires from React strict mode and
  // the hold-to-repeat case where a key event fires faster than human.
  if (last && now - last.ts < THROTTLE_MS) return;

  // Decay — recompute the streak. If the previous play was within the
  // decay window, increment; otherwise reset.
  const streak =
    last && now - last.ts < DECAY_WINDOW_MS ? last.streak + 1 : 0;
  lastPlay.set(name, { ts: now, streak });

  const decayFactor = Math.max(
    DECAY_MIN_FACTOR,
    1 - DECAY_STEP * streak,
  );
  const gainMul = GAIN_MULTIPLIER[name] * decayFactor;

  try {
    voiceFor(name)({ volume: gainMul });
  } catch {
    // The Web Audio API can throw on suspended contexts pre-gesture (Safari
    // iOS) or on rare CTOR failures. Swallow — sound is non-critical.
  }
}

/**
 * Reset the per-sound streak counter. Currently unused at callsites; exists
 * for tests and for any future "we just unmounted, drop the streak" case.
 */
export function resetAudioState(): void {
  lastPlay.clear();
  voiceCache = {};
}
