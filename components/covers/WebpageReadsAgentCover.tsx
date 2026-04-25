"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  animate,
} from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * WebpageReadsAgentCover — hostile webpage being read by an AI scanner.
 *
 * Concept (research/animated-covers-redesign/concepts-v2.md §5):
 * The article teaches that pages can hide adversarial instructions in their
 * markup. The cover renders a page (5 text-stub lines), 3 hidden terracotta
 * `×`-glyphs at fixed positions, and a scanner ring that sweeps across.
 * As the scanner approaches each glyph, that glyph's opacity ramps up.
 *
 * Composition (~70 elements):
 *  - Background (~16): scattered geometric noise glyphs + 4 viewfinder L-ticks.
 *  - Mid-ground (~32): page outline + 5 text-stub lines + page header + grid.
 *  - Foreground (~22): scanner ring + handle + reticle + comet trail (5 dots) +
 *    3 hidden ×-glyphs + warning ticks.
 *
 * Motion (DESIGN.md §9):
 *  - Primary (4s loop, continuous): scanner cx animates 30→170→30. Hidden
 *    glyph opacities derive from |cx - glyphX| via useTransform — single
 *    animation source, multiple derived values (one primitive per killed-list).
 *  - Secondary: trail dots offset cx; viewfinder corners pulse opacity.
 *  - Hover: scanner sweep speed increases (we let trail intensify visually).
 *
 * Frame-stability R6: cx / opacity / scale only. Tokens-only.
 *
 * Path-data shape vocabulary derived from Heroicons (MIT) magnifying-glass icons.
 */
export function WebpageReadsAgentCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const isAnimating = inView && !reduced;

  // Single motion value drives scanner x and all derived opacities.
  const scannerX = useMotionValue(reduced ? 110 : 30);

  useEffect(() => {
    if (!isAnimating) {
      scannerX.set(reduced ? 110 : 110);
      return;
    }
    const controls = animate(scannerX, [30, 170, 30], {
      duration: 4,
      repeat: Infinity,
      ease: [0.42, 0, 0.58, 1],
      times: [0, 0.75, 1],
    });
    return () => controls.stop();
  }, [isAnimating, reduced, scannerX]);

  // Hidden glyph positions.
  const glyph1X = 70;
  const glyph2X = 110;
  const glyph3X = 145;

  // Each glyph's opacity peaks when scanner is near it.
  const glyph1Opacity = useTransform(
    scannerX,
    [glyph1X - 22, glyph1X - 12, glyph1X, glyph1X + 12, glyph1X + 22],
    [0.15, 0.6, 1, 0.6, 0.15],
  );
  const glyph2Opacity = useTransform(
    scannerX,
    [glyph2X - 22, glyph2X - 12, glyph2X, glyph2X + 12, glyph2X + 22],
    [0.15, 0.6, 1, 0.6, 0.15],
  );
  const glyph3Opacity = useTransform(
    scannerX,
    [glyph3X - 22, glyph3X - 12, glyph3X, glyph3X + 12, glyph3X + 22],
    [0.15, 0.6, 1, 0.6, 0.15],
  );

  // Trail dot x positions follow scanner with offsets.
  const trailX1 = useTransform(scannerX, (x) => x - 6);
  const trailX2 = useTransform(scannerX, (x) => x - 12);
  const trailX3 = useTransform(scannerX, (x) => x - 18);
  const trailX4 = useTransform(scannerX, (x) => x - 24);
  const trailX5 = useTransform(scannerX, (x) => x - 30);

  // Background scattered noise glyphs.
  const noiseGlyphs = [
    { type: "tri" as const, cx: 28, cy: 40 },
    { type: "circ" as const, cx: 175, cy: 38 },
    { type: "x" as const, cx: 50, cy: 175 },
    { type: "tri" as const, cx: 168, cy: 168 },
    { type: "circ" as const, cx: 30, cy: 110 },
    { type: "x" as const, cx: 180, cy: 100 },
    { type: "circ" as const, cx: 22, cy: 80 },
    { type: "tri" as const, cx: 178, cy: 130 },
    { type: "x" as const, cx: 170, cy: 60 },
  ];

  // Visible page text-stub lines.
  const textStubs = [
    { x: 36, y: 60, w: 80 },
    { x: 36, y: 80, w: 110 },
    { x: 36, y: 100, w: 70 },
    { x: 36, y: 120, w: 100 },
    { x: 36, y: 140, w: 60 },
  ];

  // Page header stubs (3 short).
  const headerStubs = [
    { x: 36, y: 42, w: 18 },
    { x: 58, y: 42, w: 22 },
    { x: 84, y: 42, w: 14 },
  ];

  // Viewfinder corner L-ticks. Each is two short orthogonal segments.
  const corners = [
    { x: 16, y: 16, dx: 6, dy: 6 },     // top-left
    { x: 184, y: 16, dx: -6, dy: 6 },    // top-right
    { x: 16, y: 184, dx: 6, dy: -6 },    // bottom-left
    { x: 184, y: 184, dx: -6, dy: -6 },  // bottom-right
  ];

  return (
    <g>
      {/* ─── Background: scattered noise glyphs ────────────── */}
      {noiseGlyphs.map((g, i) => (
        <motion.g
          key={`noise-${i}`}
          initial={{ opacity: 0.1 }}
          animate={
            isAnimating ? { opacity: [0.08, 0.18, 0.08] } : { opacity: 0.12 }
          }
          transition={
            isAnimating
              ? { duration: 3, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          {g.type === "tri" && (
            <path
              d={`M ${g.cx} ${g.cy - 3} L ${g.cx + 3} ${g.cy + 2} L ${g.cx - 3} ${g.cy + 2} Z`}
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth={0.8}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {g.type === "circ" && (
            <circle
              cx={g.cx}
              cy={g.cy}
              r={2.5}
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth={0.8}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {g.type === "x" && (
            <g>
              <line
                x1={g.cx - 2.5}
                y1={g.cy - 2.5}
                x2={g.cx + 2.5}
                y2={g.cy + 2.5}
                stroke="var(--color-text-muted)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={g.cx - 2.5}
                y1={g.cy + 2.5}
                x2={g.cx + 2.5}
                y2={g.cy - 2.5}
                stroke="var(--color-text-muted)"
                strokeWidth={0.8}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          )}
        </motion.g>
      ))}

      {/* ─── Background: viewfinder corner L-ticks ──────────── */}
      {corners.map((c, i) => (
        <motion.g
          key={`corner-${i}`}
          initial={{ opacity: 0.4 }}
          animate={
            isAnimating ? { opacity: [0.3, 0.55, 0.3] } : { opacity: 0.4 }
          }
          transition={
            isAnimating
              ? { duration: 4, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
        >
          <line
            x1={c.x}
            y1={c.y}
            x2={c.x + c.dx}
            y2={c.y}
            stroke="var(--color-text-muted)"
            strokeWidth={1.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={c.x}
            y1={c.y}
            x2={c.x}
            y2={c.y + c.dy}
            stroke="var(--color-text-muted)"
            strokeWidth={1.2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </motion.g>
      ))}

      {/* ─── Mid-ground: page outline ───────────────────────── */}
      <rect
        x={28}
        y={32}
        width={144}
        height={130}
        rx={4}
        fill="var(--color-surface)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
      />

      {/* Page header */}
      {headerStubs.map((s, i) => (
        <rect
          key={`hdr-${i}`}
          x={s.x}
          y={s.y}
          width={s.w}
          height={2.4}
          rx={1.2}
          fill="var(--color-text-muted)"
          opacity={0.7}
        />
      ))}
      {/* Header underline */}
      <line
        x1={32}
        y1={48}
        x2={168}
        y2={48}
        stroke="var(--color-text-muted)"
        strokeWidth={0.6}
        opacity={0.3}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Mid-ground: text-stub lines ───────────────────── */}
      {textStubs.map((s, i) => (
        <rect
          key={`stub-${i}`}
          x={s.x}
          y={s.y}
          width={s.w}
          height={1.8}
          rx={0.9}
          fill="var(--color-text-muted)"
          opacity={0.7}
        />
      ))}

      {/* Mid-ground: invisibility-grid (small dots above first line) */}
      {[40, 60, 80, 100, 120, 140].map((x) => (
        <circle
          key={`grid-${x}`}
          cx={x}
          cy={54}
          r={0.5}
          fill="var(--color-text-muted)"
          opacity={0.3}
        />
      ))}

      {/* ─── Foreground: hidden ×-glyphs (opacity derived from scanner x) ─── */}
      {[
        { gx: glyph1X, gy: 80, op: glyph1Opacity },
        { gx: glyph2X, gy: 120, op: glyph2Opacity },
        { gx: glyph3X, gy: 100, op: glyph3Opacity },
      ].map((g, i) => (
        <motion.g key={`hidden-${i}`} style={{ opacity: g.op }}>
          <line
            x1={g.gx - 3}
            y1={g.gy - 3}
            x2={g.gx + 3}
            y2={g.gy + 3}
            stroke="var(--color-accent)"
            strokeWidth={1.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={g.gx - 3}
            y1={g.gy + 3}
            x2={g.gx + 3}
            y2={g.gy - 3}
            stroke="var(--color-accent)"
            strokeWidth={1.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          {/* 4 warning tick marks at cardinals, slightly offset */}
          <line x1={g.gx} y1={g.gy - 6} x2={g.gx} y2={g.gy - 4.5} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <line x1={g.gx} y1={g.gy + 6} x2={g.gx} y2={g.gy + 4.5} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <line x1={g.gx - 6} y1={g.gy} x2={g.gx - 4.5} y2={g.gy} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <line x1={g.gx + 6} y1={g.gy} x2={g.gx + 4.5} y2={g.gy} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </motion.g>
      ))}

      {/* ─── Foreground: comet trail behind scanner (5 fading dots) ─── */}
      <motion.circle cx={trailX1} cy={100} r={1.6} fill="var(--color-accent)" opacity={0.5} />
      <motion.circle cx={trailX2} cy={100} r={1.4} fill="var(--color-accent)" opacity={0.4} />
      <motion.circle cx={trailX3} cy={100} r={1.2} fill="var(--color-accent)" opacity={0.3} />
      <motion.circle cx={trailX4} cy={100} r={1} fill="var(--color-accent)" opacity={0.22} />
      <motion.circle cx={trailX5} cy={100} r={0.9} fill="var(--color-accent)" opacity={0.15} />

      {/* ─── Foreground: scanner ring + handle + reticle ───── */}
      <motion.g style={{ x: scannerX }}>
        {/* Translate is applied via x; the ring is centered at (0,100). */}
        <circle
          cx={0}
          cy={100}
          r={13}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        {/* Inner reticle dot */}
        <motion.circle
          cx={0}
          cy={100}
          r={1.6}
          fill="var(--color-accent)"
          initial={{ scale: 1 }}
          animate={isAnimating ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={
            isAnimating
              ? { duration: 1, repeat: Infinity, ease: "easeInOut" }
              : undefined
          }
          style={{ transformOrigin: "0 100", transformBox: "fill-box" as const }}
        />
        {/* Crosshair ticks inside ring */}
        <line x1={-3} y1={100} x2={-1.5} y2={100} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={1.5} y1={100} x2={3} y2={100} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={97} x2={0} y2={98.5} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={101.5} x2={0} y2={103} stroke="var(--color-accent)" strokeWidth={1} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {/* Handle */}
        <line
          x1={9}
          y1={109}
          x2={16}
          y2={116}
          stroke="var(--color-accent)"
          strokeWidth={2.2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>
    </g>
  );
}

/**
 * WebpageReadsAgentCoverStatic — Satori-safe pure-JSX export.
 * Reduced-motion end-state: scanner ring near right edge (~150), all 3
 * hidden ×-glyphs revealed at full opacity (the metaphor: scan complete,
 * hidden instructions exposed).
 */
export function WebpageReadsAgentCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  const SURFACE = "#1a1714";

  // Scanner parked near right edge.
  const scannerX = 150;

  const noiseGlyphs = [
    { type: "tri" as const, cx: 28, cy: 40 },
    { type: "circ" as const, cx: 175, cy: 38 },
    { type: "x" as const, cx: 50, cy: 175 },
    { type: "tri" as const, cx: 168, cy: 168 },
    { type: "circ" as const, cx: 30, cy: 110 },
    { type: "x" as const, cx: 180, cy: 100 },
    { type: "circ" as const, cx: 22, cy: 80 },
    { type: "tri" as const, cx: 178, cy: 130 },
    { type: "x" as const, cx: 170, cy: 60 },
  ];

  const textStubs = [
    { x: 36, y: 60, w: 80 },
    { x: 36, y: 80, w: 110 },
    { x: 36, y: 100, w: 70 },
    { x: 36, y: 120, w: 100 },
    { x: 36, y: 140, w: 60 },
  ];

  const headerStubs = [
    { x: 36, y: 42, w: 18 },
    { x: 58, y: 42, w: 22 },
    { x: 84, y: 42, w: 14 },
  ];

  const corners = [
    { x: 16, y: 16, dx: 6, dy: 6 },
    { x: 184, y: 16, dx: -6, dy: 6 },
    { x: 16, y: 184, dx: 6, dy: -6 },
    { x: 184, y: 184, dx: -6, dy: -6 },
  ];

  const hiddenGlyphs = [
    { gx: 70, gy: 80 },
    { gx: 110, gy: 120 },
    { gx: 145, gy: 100 },
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Background noise glyphs */}
      {noiseGlyphs.map((g, i) => {
        if (g.type === "tri") {
          return (
            <path
              key={`noise-${i}`}
              d={`M ${g.cx} ${g.cy - 3} L ${g.cx + 3} ${g.cy + 2} L ${g.cx - 3} ${g.cy + 2} Z`}
              fill="none"
              stroke={MUTED}
              strokeWidth={0.8}
              opacity={0.13}
            />
          );
        }
        if (g.type === "circ") {
          return (
            <circle
              key={`noise-${i}`}
              cx={g.cx}
              cy={g.cy}
              r={2.5}
              fill="none"
              stroke={MUTED}
              strokeWidth={0.8}
              opacity={0.13}
            />
          );
        }
        return (
          <g key={`noise-${i}`} opacity={0.13}>
            <line x1={g.cx - 2.5} y1={g.cy - 2.5} x2={g.cx + 2.5} y2={g.cy + 2.5} stroke={MUTED} strokeWidth={0.8} />
            <line x1={g.cx - 2.5} y1={g.cy + 2.5} x2={g.cx + 2.5} y2={g.cy - 2.5} stroke={MUTED} strokeWidth={0.8} />
          </g>
        );
      })}

      {/* Viewfinder corners */}
      {corners.map((c, i) => (
        <g key={`corner-${i}`} opacity={0.45}>
          <line x1={c.x} y1={c.y} x2={c.x + c.dx} y2={c.y} stroke={MUTED} strokeWidth={1.2} strokeLinecap="round" />
          <line x1={c.x} y1={c.y} x2={c.x} y2={c.y + c.dy} stroke={MUTED} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      ))}

      {/* Page outline */}
      <rect x={28} y={32} width={144} height={130} rx={4} fill={SURFACE} stroke={MUTED} strokeWidth={1.6} />

      {/* Header stubs */}
      {headerStubs.map((s, i) => (
        <rect key={`hdr-${i}`} x={s.x} y={s.y} width={s.w} height={2.4} rx={1.2} fill={MUTED} opacity={0.7} />
      ))}
      <line x1={32} y1={48} x2={168} y2={48} stroke={MUTED} strokeWidth={0.6} opacity={0.3} />

      {/* Text stubs */}
      {textStubs.map((s, i) => (
        <rect key={`stub-${i}`} x={s.x} y={s.y} width={s.w} height={1.8} rx={0.9} fill={MUTED} opacity={0.7} />
      ))}

      {/* Invisibility-grid */}
      {[40, 60, 80, 100, 120, 140].map((x) => (
        <circle key={`grid-${x}`} cx={x} cy={54} r={0.5} fill={MUTED} opacity={0.3} />
      ))}

      {/* Hidden ×-glyphs — fully revealed */}
      {hiddenGlyphs.map((g, i) => (
        <g key={`hidden-${i}`}>
          <line x1={g.gx - 3} y1={g.gy - 3} x2={g.gx + 3} y2={g.gy + 3} stroke={ACCENT} strokeWidth={1.6} strokeLinecap="round" />
          <line x1={g.gx - 3} y1={g.gy + 3} x2={g.gx + 3} y2={g.gy - 3} stroke={ACCENT} strokeWidth={1.6} strokeLinecap="round" />
          <line x1={g.gx} y1={g.gy - 6} x2={g.gx} y2={g.gy - 4.5} stroke={ACCENT} strokeWidth={1} strokeLinecap="round" />
          <line x1={g.gx} y1={g.gy + 6} x2={g.gx} y2={g.gy + 4.5} stroke={ACCENT} strokeWidth={1} strokeLinecap="round" />
          <line x1={g.gx - 6} y1={g.gy} x2={g.gx - 4.5} y2={g.gy} stroke={ACCENT} strokeWidth={1} strokeLinecap="round" />
          <line x1={g.gx + 6} y1={g.gy} x2={g.gx + 4.5} y2={g.gy} stroke={ACCENT} strokeWidth={1} strokeLinecap="round" />
        </g>
      ))}

      {/* Comet trail behind scanner */}
      <circle cx={scannerX - 6} cy={100} r={1.6} fill={ACCENT} opacity={0.5} />
      <circle cx={scannerX - 12} cy={100} r={1.4} fill={ACCENT} opacity={0.4} />
      <circle cx={scannerX - 18} cy={100} r={1.2} fill={ACCENT} opacity={0.3} />
      <circle cx={scannerX - 24} cy={100} r={1} fill={ACCENT} opacity={0.22} />
      <circle cx={scannerX - 30} cy={100} r={0.9} fill={ACCENT} opacity={0.15} />

      {/* Scanner ring + handle + reticle */}
      <g transform={`translate(${scannerX} 0)`}>
        <circle cx={0} cy={100} r={13} fill="none" stroke={ACCENT} strokeWidth={1.8} />
        <circle cx={0} cy={100} r={1.6} fill={ACCENT} />
        <line x1={-3} y1={100} x2={-1.5} y2={100} stroke={ACCENT} strokeWidth={1} strokeLinecap="round" />
        <line x1={1.5} y1={100} x2={3} y2={100} stroke={ACCENT} strokeWidth={1} strokeLinecap="round" />
        <line x1={0} y1={97} x2={0} y2={98.5} stroke={ACCENT} strokeWidth={1} strokeLinecap="round" />
        <line x1={0} y1={101.5} x2={0} y2={103} stroke={ACCENT} strokeWidth={1} strokeLinecap="round" />
        <line x1={9} y1={109} x2={16} y2={116} stroke={ACCENT} strokeWidth={2.2} strokeLinecap="round" />
      </g>
    </svg>
  );
}
