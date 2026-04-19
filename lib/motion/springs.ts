/**
 * Named spring presets for consistent motion across bytesize.
 * Components reference these names; they never inline spring values.
 *
 * Tier 1 — Ambient     : gentle, page       — content appears calm
 * Tier 2 — Functional  : snappy, smooth     — response to user action
 * Tier 3 — Celebratory : bouncy, dramatic   — rare emphasis moments
 *
 * Tuning:
 *   stiffness ↑  → faster snap, higher frequency
 *   damping ↑    → less overshoot, faster settle
 *   mass ↑       → heavier feel
 */
export const SPRING = {
  /** Buttons, toggles, scrubber steps */
  snappy: { type: "spring" as const, stiffness: 500, damping: 40, mass: 0.8 },
  /** Layout shifts, card/widget reveals */
  smooth: { type: "spring" as const, stiffness: 260, damping: 30, mass: 1 },
  /** Ambient, very-slow reveals */
  gentle: { type: "spring" as const, stiffness: 200, damping: 24, mass: 1 },
  /** Page-level fade */
  page: { type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 },
  /** Hero / cinematic moments */
  dramatic: { type: "spring" as const, stiffness: 220, damping: 18, mass: 1.2 },
  /** Rare "got it right" bounce */
  bouncy: { type: "spring" as const, stiffness: 400, damping: 20, mass: 1 },
} as const;

/** Stagger delays for sibling reveals (seconds). */
export const STAGGER = {
  tight: 0.06,
  normal: 0.12,
  wide: 0.2,
} as const;

/** whileTap scale for interactive elements. */
export const TAP = { scale: 0.96 } as const;

/**
 * PRESS — unified press/tap identity for buttons and links across bytesize.
 * Spread onto any <motion.*> to get consistent depress + snappy settle.
 * Reduced-motion users collapse to opacity-only via MotionConfigProvider.
 */
export const PRESS = {
  whileTap: TAP,
  transition: SPRING.snappy,
} as const;

/** Element-level enter presets. Pair with SPRING.smooth. */
export const ELEMENT_ENTER = {
  /** 4px displacement — inline chips */
  sm: { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } },
  /** 8px — list items, widget children (most common) */
  md: { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } },
  /** 12px — full phase reveals */
  lg: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
} as const;

/** Phase-level transition for page / section changes. */
export const PHASE_TRANSITION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
} as const;

/** Non-spring timing for simple transitions. */
export const TIMING = {
  fast: { duration: 0.16, ease: [0.22, 1, 0.36, 1] as const },
  base: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
  slow: { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const },
} as const;
