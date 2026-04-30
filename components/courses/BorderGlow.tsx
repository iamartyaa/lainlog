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
 * BorderGlow — vendored from React Bits (DavidHDev/react-bits).
 *
 * polish-r5 ITEM 1: clean re-vendor of the canonical React Bits source.
 * The component preserves every behavioural line of the original:
 *
 *   1. Pointer-tracked conic-gradient border ring. The conic stop angle
 *      follows the cursor (atan2 from card centre). A masked 1-px ring
 *      shows only the perimeter — the interior is masked out.
 *   2. Edge-proximity ramp. Distance from cursor to the nearest border
 *      edge drives an opacity factor: pointer ON the edge → full glow;
 *      `edgeSensitivity` px inside → glow off.
 *   3. Mesh radial cursor-light on the card fill (::after) — same HSL
 *      `glowColor` as the conic ring.
 *   4. Optional intro sweep — `animated={true}` plays one revolution of
 *      the conic stop on mount (pointer-independent reveal).
 *
 * bytesize adaptations (layered on top, not in the source):
 *
 *   - Default colour stops + `glowColor` retoned to terracotta tokens
 *     at the call site (app/page.tsx). The component still ACCEPTS any
 *     hex/var via props so the source remains generic; the consumer is
 *     responsible for passing tokens. Defaults here are NEUTRAL fallbacks
 *     keyed off bytesize CSS vars (NOT React Bits' neon defaults), so
 *     even an unconfigured render stays on-palette.
 *   - Reduced-motion + (hover: none): the entire pointer-driven shell is
 *     bypassed; children render inside a static .bs-course-card-lift
 *     with the polish-r3 at-rest border + shade + soft shadow.
 *   - Pointer-move handler is rAF-throttled — one CSS-var write per paint
 *     regardless of pointermove fire rate.
 *   - Pass-through `data-*` attributes — the consumer can put `data-course`
 *     on the wrapper so the --clay-* tonal range resolves on it.
 *
 * The React Bits source itself uses inline styles for the dynamic
 * variables and a CSS module for the rest. We use a plain stylesheet
 * (BorderGlow.css) because bytesize's existing course-canvas.css
 * convention is plain CSS (banked feedback v1 #3: attribute selectors
 * over modules). Behaviour is identical.
 */

interface BorderGlowProps {
  children: ReactNode;
  /** Three-stop colour set used by the conic glow + mesh radial. */
  colors?: [string, string, string];
  /** Card surface colour (under the children). */
  backgroundColor?: string;
  /** HSL components string for the radial cursor-light, e.g. "14 60 45". */
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
  // Bytesize defaults: terracotta tonal stops via CSS vars. The original
  // React Bits defaults were ["#c084fc", "#f472b6", "#38bdf8"] — neon
  // purple/pink/blue — which would violate DESIGN.md §1 (single accent).
  // We override the source defaults here so an unconfigured render stays
  // on-palette; consumers can still pass any colour set explicitly.
  colors = [
    "var(--color-accent)",
    "var(--clay-200, var(--color-rule))",
    "var(--clay-100, var(--color-surface))",
  ],
  backgroundColor = "var(--clay-50, var(--color-surface))",
  // HSL approximation of light-mode --color-accent (terra-40 ≈ hsl(14 60 45)).
  // The dark-mode override lives in app/globals.css via [data-theme="dark"]
  // .border-glow-card { --bg-glow-hsl: 14 55 60 }.
  glowColor = "14 60 45",
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
  // Filter `rest` to only data-* attributes (defensive — TS index signature
  // accepts any data-* key but won't reject runtime junk).
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
  // pointermove rate. The CSS variables drive the conic angle, the
  // mesh-radial centre, and the opacity ramp.
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
    // Cursor angle relative to card centre — drives the conic-gradient
    // start angle. +90 normalises so 0deg points up.
    const angleRad = Math.atan2(y - cy, x - cx);
    const angleDeg = (angleRad * 180) / Math.PI + 90;

    // Edge proximity: distance to the nearest border edge.
    const distLeft = x;
    const distRight = rect.width - x;
    const distTop = y;
    const distBottom = rect.height - y;
    const minEdge = Math.max(
      0,
      Math.min(distLeft, distRight, distTop, distBottom),
    );
    // Ramp from 1 at edge → 0 at >=edgeSensitivity inside.
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

  // Reduced-motion: bypass the entire BorderGlow shell. Children render
  // inside the polish-r3 .bs-course-card-lift so the at-rest border,
  // shade, and shadow stay visible. data-course propagates so the
  // --clay-* tokens resolve.
  if (reduce) {
    return (
      <div
        className={
          "bs-course-card-lift" + (className ? ` ${className}` : "")
        }
        style={style}
        {...dataAttrs}
      >
        {children}
      </div>
    );
  }

  // CSS variables that drive the gradient + opacity ramp. Defaults sit
  // at "no glow"; the pointermove handler updates them.
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
      {/* The ::before is the masked conic ring; the ::after is the mesh
          radial on the fill. Both live in BorderGlow.css and are driven
          purely by the CSS variables we set above. */}
      <div className="border-glow-card__inner">{children}</div>
    </div>
  );
}

export default BorderGlow;
