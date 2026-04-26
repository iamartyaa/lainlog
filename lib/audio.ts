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
  pageExit,
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
  | "Page-Enter"
  | "Page-Exit";

/**
 * Per-sound gain multipliers applied AFTER the patch's own `gain`. Recalibrated
 * 2026-04-26 (PR #64 fix pass) — the whole vocabulary now sits ~30–50% lower
 * than the original wiring, after first-round dogfooding flagged Click /
 * Slide / Page-Enter / Page-Exit as "too loud / too pingy".
 *
 * Page-Enter / Page-Exit also got a synthesis redesign in `.web-kits/minimal.ts`
 * (220–260 Hz musical-fourth pair, slower attack + longer decay). The exit
 * stays the quieter of the two so Enter still reads as the "landed" beat.
 *
 * If you change a value here, also update §6 of `docs/audio-playbook.md`.
 */
const GAIN_MULTIPLIER: Record<SoundName, number> = {
  Copy: 0.55, // was 0.9 — quieter clipboard ack
  Success: 0.6, // was 0.85 — chord still present, less celebratory
  Error: 0.5, // was 0.7 — heavy low-300Hz pair, soften further
  Click: 0.4, // was 0.7 — fires on EVERY WidgetNav press, must sit in BG
  Pop: 0.45, // was 0.75 — EC push repeats through multi-step traces
  Slide: 0.5, // was 1.0 — Run-click cue, halved
  "Toggle-On": 0.55, // was 0.85 — segmented controls + theme toggle
  Swoosh: 0.65, // was 1.1 — once-per-page verdict reveal, still earns lift
  "Page-Enter": 0.35, // was 0.55 — soft "settling" door-close, not a chime
  "Page-Exit": 0.3, // was 0.5 — quietest of the pair
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
  "Page-Exit": pageExit,
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
