"use client";

import { useEffect, useRef } from "react";
import "./DotField.css";

/**
 * DotField — vendored from React Bits, retoned for bytesize course landings.
 *
 * Canvas-based dot grid that responds to the cursor with two effects:
 *   1. **Bulge** — dots within `cursorRadius` push outward, magnitude
 *      attenuated by distance. Subtle by design (`bulgeStrength={28}` here,
 *      down from React Bits' default 67).
 *   2. **Glow** — a soft radial gradient painted at the cursor location,
 *      using `--course-glow` from the active theme.
 *   3. A faint diagonal **gradient wash** across the whole field
 *      (`--course-dot-from` → `--course-dot-to`).
 *
 * Modifications vs. the React Bits source:
 *   - Reduced-motion guard. If `(prefers-reduced-motion: reduce)`: render
 *     a single static frame (dots + diagonal gradient, no glow), then
 *     bail out — no RAF, no listeners. Component still mounts so the
 *     visual baseline is consistent.
 *   - Mobile / pointer-coarse guard. If `(pointer: coarse), (hover: none)`:
 *     bail out before mounting any canvas effect; the wrapper's CSS
 *     fallback static-dots gradient is what users see.
 *   - localStorage escape hatch. `localStorage["lainlog:dotfield"] === "off"`
 *     triggers the same fallthrough.
 *   - IntersectionObserver — pauses the RAF loop when the canvas scrolls
 *     fully off-screen (mirrors components/viz/WidgetNav.tsx).
 *   - `document.visibilitychange` — pauses when the tab is backgrounded.
 *   - Theme-flip handling. A MutationObserver on `<html>` watches the
 *     `data-theme` attribute; on flip, re-reads the three CSS vars from
 *     `getComputedStyle` so the next RAF tick paints the new colors.
 *   - Color resolution from CSS vars (`--course-dot-from`,
 *     `--course-dot-to`, `--course-glow`) instead of hardcoded RGBA props.
 *
 * Defaults match the user-approved calibration (orchestrator brief):
 *   dotRadius=1.25, dotSpacing=20, cursorRadius=320, bulgeOnly=true,
 *   bulgeStrength=28, glowRadius=120, sparkle=false, waveAmplitude=0.
 */

export type DotFieldProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  bulgeOnly?: boolean;
  bulgeStrength?: number;
  glowRadius?: number;
  sparkle?: boolean;
  waveAmplitude?: number;
};

const STORAGE_KEY = "lainlog:dotfield";

/** Read the three theme vars off `<html>` computed style. */
function readThemeColors(): {
  from: string;
  to: string;
  glow: string;
} {
  if (typeof window === "undefined") {
    return { from: "rgba(0,0,0,0.18)", to: "rgba(0,0,0,0.12)", glow: "rgba(0,0,0,0.06)" };
  }
  const cs = getComputedStyle(document.documentElement);
  const from = cs.getPropertyValue("--course-dot-from").trim() || "rgba(0,0,0,0.18)";
  const to = cs.getPropertyValue("--course-dot-to").trim() || "rgba(0,0,0,0.12)";
  const glow = cs.getPropertyValue("--course-glow").trim() || "rgba(0,0,0,0.06)";
  return { from, to, glow };
}

export default function DotField({
  dotRadius = 1.25,
  dotSpacing = 20,
  cursorRadius = 320,
  bulgeOnly = true,
  bulgeStrength = 28,
  glowRadius = 120,
  sparkle = false,
  waveAmplitude = 0,
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mutable refs the RAF loop reads from. None of these need to trigger
  // re-renders — the canvas paints them imperatively.
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const colorsRef = useRef(readThemeColors());
  const propsRef = useRef({
    dotRadius,
    dotSpacing,
    cursorRadius,
    bulgeOnly,
    bulgeStrength,
    glowRadius,
    sparkle,
    waveAmplitude,
  });
  // Keep propsRef in sync with prop changes without writing the ref during
  // render. The RAF loop reads `propsRef.current` each tick, so the next
  // frame after a prop change picks up the new values.
  useEffect(() => {
    propsRef.current = {
      dotRadius,
      dotSpacing,
      cursorRadius,
      bulgeOnly,
      bulgeStrength,
      glowRadius,
      sparkle,
      waveAmplitude,
    };
  }, [
    dotRadius,
    dotSpacing,
    cursorRadius,
    bulgeOnly,
    bulgeStrength,
    glowRadius,
    sparkle,
    waveAmplitude,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Guard 1: pointer-coarse / hover-none → bail out entirely. ────────
    const coarseMQ = window.matchMedia(
      "(pointer: coarse), (hover: none)",
    );
    if (coarseMQ.matches) {
      // Don't mount canvas effects on touch devices; the wrapper's CSS
      // fallback static-dots gradient handles the visual.
      return;
    }

    // ── Guard 2: localStorage escape hatch. ──────────────────────────────
    try {
      if (localStorage.getItem(STORAGE_KEY) === "off") return;
    } catch {
      /* localStorage may throw in privacy modes — proceed as if not set */
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.max(1, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (now: number, animated: boolean) => {
      const p = propsRef.current;
      const c = colorsRef.current;
      ctx.clearRect(0, 0, width, height);

      // Diagonal gradient wash.
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, c.from);
      grad.addColorStop(1, c.to);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Cursor glow (skip under reduced-motion / when cursor unknown).
      if (animated && mouseRef.current.active) {
        const { x: mx, y: my } = mouseRef.current;
        const radial = ctx.createRadialGradient(mx, my, 0, mx, my, p.glowRadius);
        radial.addColorStop(0, c.glow);
        radial.addColorStop(1, "transparent");
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);
      }

      // Dots — paint each at its grid position, displaced by bulge.
      const spacing = p.dotSpacing;
      const r = p.dotRadius;
      const cr = p.cursorRadius;
      const bulge = p.bulgeStrength;
      const wave = animated ? p.waveAmplitude : 0;
      const t = now / 1000;

      // Use the gradient's mid-stop opacity for the dots — derived from
      // the same theme tokens, so dots co-tone with the wash.
      ctx.fillStyle = c.from;

      const cols = Math.ceil(width / spacing) + 2;
      const rows = Math.ceil(height / spacing) + 2;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const haveCursor = animated && mouseRef.current.active;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          let dx = i * spacing;
          let dy = j * spacing;

          // Optional wave (we keep waveAmplitude=0 by default; included
          // for parity with the React Bits source).
          if (wave > 0) {
            dy += Math.sin(t * 1.2 + i * 0.4) * wave;
          }

          // Cursor bulge — push outward when within cursorRadius.
          if (haveCursor) {
            const ex = dx - mx;
            const ey = dy - my;
            const dist = Math.hypot(ex, ey);
            if (dist > 0 && dist < cr) {
              const falloff = 1 - dist / cr;
              const push = (bulge * falloff * falloff) / dist;
              if (p.bulgeOnly) {
                dx += ex * push;
                dy += ey * push;
              } else {
                // Inverse "pull" mode — rare, included for parity.
                dx -= ex * push;
                dy -= ey * push;
              }
            }
          }

          // Sparkle — 3% of dots randomly larger. Disabled by default.
          let radius = r;
          if (p.sparkle && (i * 31 + j * 17) % 33 === 0) {
            radius = r * 2;
          }

          ctx.beginPath();
          ctx.arc(dx, dy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    resize();

    // ── Guard 3: prefers-reduced-motion → one static frame, then exit. ──
    const reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMQ.matches) {
      drawFrame(performance.now(), false);
      // Still respond to resize so the static frame stays correct.
      const ro = new ResizeObserver(() => {
        resize();
        drawFrame(performance.now(), false);
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    // Mark canvas as active so :has-style fallback rules know to suppress
    // the CSS fallback gradient (cosmetic — not strictly required since
    // the canvas paints over the wrapper).
    canvas.dataset.active = "true";

    // ── Animated path: full RAF loop with all listeners. ─────────────────

    let raf = 0;
    let inView = true;
    let visible = !document.hidden;
    let running = false;

    const tick = (now: number) => {
      drawFrame(now, true);
      if (running) raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (!running) return;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const evaluateRunState = () => {
      if (inView && visible) start();
      else stop();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    const onVisibility = () => {
      visible = !document.hidden;
      evaluateRunState();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        evaluateRunState();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const ro = new ResizeObserver(() => {
      resize();
    });
    ro.observe(canvas);

    // Theme-flip handling: re-read CSS vars when [data-theme] mutates.
    const mo = new MutationObserver(() => {
      colorsRef.current = readThemeColors();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    evaluateRunState();

    return () => {
      stop();
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
      delete canvas.dataset.active;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="bs-dot-field"
      aria-hidden="true"
    />
  );
}
