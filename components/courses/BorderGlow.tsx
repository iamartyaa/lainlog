"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";
import "./BorderGlow.css";

/**
 * BorderGlow — vendored from React Bits (DavidHDev/react-bits), retoned for
 * bytesize. Polish-r4 ITEM 1: replaces the TiltedCard wrapper around the
 * home pinned course card.
 *
 * Behaviour (preserved from the React Bits original):
 *   - Pointer-tracked conic-gradient border light: a soft cone of light
 *     follows the cursor angle around the card perimeter; the cone opens
 *     up at angles facing the cursor and fades behind it.
 *   - Edge-proximity ramp: the glow's opacity scales with how close the
 *     pointer is to the nearest border edge — far away → 0, sitting on
 *     the border → full intensity. `edgeSensitivity` controls the ramp.
 *   - Mesh background: a radial gradient cursor-light sits on the card
 *     fill, giving a quiet sheen; same colour set as the border glow.
 *   - Optional intro sweep: when `animated` is true, the conic-gradient
 *     plays one full revolution on mount (pointer-independent reveal).
 *
 * bytesize adaptations:
 *   - All colours retoned to terracotta/clay tokens (`--color-accent` family
 *     + `--clay-*` tonal range). NO purple, pink, or blue (DESIGN.md §1).
 *   - The `glowColor` HSL string is read from a CSS custom property
 *     (`--bg-glow-hsl`) that resolves per theme: light terracotta in light
 *     mode, brighter terracotta in dark mode.
 *   - Card `backgroundColor` defaults to the existing course-card surface
 *     (`var(--clay-50, var(--color-surface))`) so the gridline canvas + the
 *     palette stay consistent. NO near-black (#120F17) backgrounds.
 *   - Pointer-move CSS variable writes are throttled via rAF to keep the
 *     handler off the critical path on every pointermove tick.
 *   - Reduced-motion: the entire BorderGlow shell is bypassed; children
 *     render inside a static `.bs-course-card-lift` (the polish-r3 at-rest
 *     border + shade + soft shadow), so opted-out users still see the
 *     "premium" cue without any pointer animation.
 *   - (hover: none) — touch devices: the pointer-effect pseudo-elements are
 *     suppressed via CSS `display: none`; the at-rest treatment shows
 *     through. No phantom glow that never lights.
 *   - Focus is owned by the underlying anchor (CourseCard's <a>); BorderGlow
 *     does NOT take focus and never interferes with keyboard nav.
 */

interface BorderGlowProps {
  children: ReactNode;
  /** Three-stop colour set used by the conic glow + mesh radial. */
  colors?: [string, string, string];
  /** Card surface colour (under the children). */
  backgroundColor?: string;
  /** HSL components string for the radial cursor-light, e.g. "14 60 55". */
  glowColor?: string;
  /** Distance from edge (px) at which glow ramps to full. */
  edgeSensitivity?: number;
  /** Radius (% of card) of the glow falloff. */
  glowRadius?: number;
  /** 0..1 multiplier for total glow intensity. */
  glowIntensity?: number;
  /** Cone spread angle in degrees (effective conic stop spread). */
  coneSpread?: number;
  /** Border radius (px). */
  borderRadius?: number;
  /** Whether to play a one-shot intro sweep on mount. */
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Pass-through data-* attributes (e.g. data-course). */
  [dataAttr: `data-${string}`]: string | boolean | undefined;
}

export function BorderGlow({
  children,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  backgroundColor = "#120F17",
  glowColor = "40 80 80",
  edgeSensitivity = 40,
  glowRadius = 40,
  glowIntensity = 1,
  coneSpread = 30,
  borderRadius = 28,
  animated = false,
  className,
  style,
  ...rest
}: BorderGlowProps) {
  // Filter `rest` to only data-* attributes (defensive — the index signature
  // permits arbitrary `data-*` keys but TS won't reject runtime junk).
  const dataAttrs: Record<string, string | boolean | undefined> = {};
  for (const key of Object.keys(rest)) {
    if (key.startsWith("data-")) {
      dataAttrs[key] = (rest as Record<string, string | boolean | undefined>)[key];
    }
  }
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  // Apply queued pointer state to CSS variables on the next animation
  // frame — throttles the handler to one paint per frame regardless of
  // pointermove rate.
  const flush = useCallback(() => {
    rafRef.current = null;
    const el = ref.current;
    const pending = pendingRef.current;
    if (!el || !pending) return;
    const rect = el.getBoundingClientRect();
    const x = pending.x - rect.left;
    const y = pending.y - rect.top;

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    // Cursor angle relative to card centre — drives the conic-gradient.
    const angleRad = Math.atan2(y - cy, x - cx);
    const angleDeg = (angleRad * 180) / Math.PI + 90; // 0deg points up

    // Edge proximity: distance to nearest border edge.
    const distLeft = x;
    const distRight = rect.width - x;
    const distTop = y;
    const distBottom = rect.height - y;
    const minEdge = Math.max(
      0,
      Math.min(distLeft, distRight, distTop, distBottom),
    );
    // Ramp from 1 at edge → 0 at >edgeSensitivity inside.
    const edgeFactor = Math.max(0, 1 - minEdge / Math.max(1, edgeSensitivity));
    const opacity = edgeFactor * glowIntensity;

    el.style.setProperty("--bg-x", `${x}px`);
    el.style.setProperty("--bg-y", `${y}px`);
    el.style.setProperty("--bg-angle", `${angleDeg}deg`);
    el.style.setProperty("--bg-opacity", String(opacity));
  }, [edgeSensitivity, glowIntensity]);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      pendingRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  const onPointerLeave = useCallback(() => {
    pendingRef.current = null;
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--bg-opacity", "0");
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  // Reduced-motion: bypass the entire BorderGlow shell. Render children
  // inside the polish-r3 .bs-course-card-lift so the at-rest border, shade,
  // and shadow remain visible. data-course scopes the --clay-* tokens.
  if (reduce) {
    return (
      <div
        className="bs-course-card-lift"
        style={style}
        {...dataAttrs}
      >
        {children}
      </div>
    );
  }

  // CSS variables that drive the gradient + opacity ramp. Defaults sit at
  // "no glow"; the pointermove handler updates them.
  const rootStyle: CSSProperties = {
    "--bg-color-1": colors[0],
    "--bg-color-2": colors[1],
    "--bg-color-3": colors[2],
    "--bg-bg": backgroundColor,
    "--bg-glow-hsl": glowColor,
    "--bg-radius": `${borderRadius}px`,
    "--bg-glow-radius": `${glowRadius}%`,
    "--bg-cone-spread": `${coneSpread}deg`,
    "--bg-x": "50%",
    "--bg-y": "50%",
    "--bg-angle": "0deg",
    "--bg-opacity": "0",
    ...style,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={
        "border-glow-card" +
        (animated ? " border-glow-card--animated" : "") +
        (className ? ` ${className}` : "")
      }
      style={rootStyle}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      {...dataAttrs}
    >
      {/* Conic-gradient border ring — the pointer-tracked cone of light.
          The ::before is the masked conic; the ::after is the mesh radial
          on the card fill. Both live on the root via CSS — see
          BorderGlow.css. The .edge-light is a thin highlight that brightens
          where the cone intersects the perimeter. */}
      <div className="border-glow-card__inner">{children}</div>
    </div>
  );
}

export default BorderGlow;
