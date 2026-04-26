/**
 * lib/audio.ts — central play surface for the lainlog audio system.
 *
 * Anchor principles (also enumerated in `docs/audio-playbook.md`):
 *   1. Audio is OPT-IN, default OFF. State persists in
 *      `localStorage["lainlog:audio"] = "on" | "off"`.
 *   2. `prefers-reduced-motion: reduce` → audio off automatically.
 *   3. Sound is never the sole feedback channel.
 *   4. Same action = same sound everywhere.
 *   5. Volumes calibrated subtle (~30–40% of upstream Minimal patch).
 *      Per-sound gain documented inline below.
 *   6. Pause when tab is hidden (`document.visibilityState !== "visible"`).
 *   7. User-triggered only — autonomous animations do NOT call `playSound`.
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
  error,
  pageEnter,
  pop,
  slide,
  success,
  swoosh,
  toggleOn,
} from "@/.web-kits/minimal";

export type SoundName =
  | "Copy"
  | "Success"
  | "Error"
  | "Click"
  | "Pop"
  | "Slide"
  | "Toggle-On"
  | "Swoosh"
  | "Page-Enter";

/**
 * Per-sound gain multipliers applied AFTER the patch's own `gain`. Recalibrated
 * 2026-04-26 (PR #64 v4) to a UNIFORM 0.5 across the vocabulary so every sound
 * lands at the same target loudness. The patch-level `gain` values (in
 * `.web-kits/minimal.ts`) carry the per-sound balancing — those were tuned by
 * the upstream library author for equal perceived loudness across different
 * fundamentals, so applying a single multiplier on top preserves that balance.
 *
 * Earlier revisions had per-sound multipliers (Copy 0.55, Click 0.4, etc.) but
 * user feedback wanted "all sounds equally loud, no exceptions." The 0.5
 * baseline is the midpoint of the prior range and gives the navigation tap
 * the amplitude bump it needed.
 *
 * Page-Exit was retired in this pass: navigation now plays a single Page-Enter
 * "dub" rather than the previous Page-Exit + Page-Enter "dub-dub" pair.
 *
 * If you change this constant, also update §6 of `docs/audio-playbook.md`.
 */
const UNIFORM_GAIN = 0.5;
const GAIN_MULTIPLIER: Record<SoundName, number> = {
  Copy: UNIFORM_GAIN,
  Success: UNIFORM_GAIN,
  Error: UNIFORM_GAIN,
  Click: UNIFORM_GAIN,
  Pop: UNIFORM_GAIN,
  Slide: UNIFORM_GAIN,
  "Toggle-On": UNIFORM_GAIN,
  Swoosh: UNIFORM_GAIN,
  "Page-Enter": UNIFORM_GAIN,
};

/**
 * Map our public `SoundName` (CamelCase, brand-friendly) onto the patch
 * exports (camelCase locals from `@/.web-kits/minimal`).
 */
const PATCH_DEF: Record<SoundName, SoundDefinition> = {
  Copy: copy,
  Success: success,
  Error: error,
  Click: click,
  Pop: pop,
  Slide: slide,
  "Toggle-On": toggleOn,
  Swoosh: swoosh,
  "Page-Enter": pageEnter,
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
    return window.localStorage.getItem(STORAGE_KEY) === "on";
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
