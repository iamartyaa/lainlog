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
import { click, copy, error, pop, slide, success, swoosh, toggleOn } from "@/.web-kits/minimal";

export type SoundName =
  | "Copy"
  | "Success"
  | "Error"
  | "Click"
  | "Pop"
  | "Slide"
  | "Toggle-On"
  | "Swoosh";

/**
 * Per-sound gain multipliers applied AFTER the patch's own `gain`. Values
 * are best-guess subtle; the playbook says we'll dogfood and refine. The
 * upstream Minimal patch is already quiet (gains 0.05–0.12), so these
 * multipliers stay close to 1.0 for most — we're trimming the loud ones
 * (Pop, Click) and lifting Swoosh which is a once-per-page reveal.
 *
 * If you change a value here, also update the table in audio-playbook.md.
 */
const GAIN_MULTIPLIER: Record<SoundName, number> = {
  Copy: 0.9, // already quiet (0.07–0.08), just shave a hair
  Success: 0.85, // C5+G5 chord — present but not celebratory
  Error: 0.7, // low-300Hz pair reads heavy; soften it
  Click: 0.7, // fires on every nav button — keep extra subtle
  Pop: 0.75, // EC push fires repeatedly through a multi-step trace
  Slide: 1.0, // already at 0.05; let it breathe
  "Toggle-On": 0.85, // segmented controls
  Swoosh: 1.1, // verdict reveal, once per page-load — earn the lift
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
