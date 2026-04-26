"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * HowGmailCover — bloom filter, v6 calibration.
 *
 * v6 concept (one sentence):
 *   A quiet caret pings, three thin hash arcs draw down into a 10-cell linear
 *   bit-array, three cells gently fill translucent terracotta, and a slim
 *   verdict tick draws — calm, opacity-led.
 *
 * v5 → v6 register shift (rejected by user as "too bold"):
 *  - 4×3 grid → single horizontal row of 10 cells (film-strip rhythm).
 *  - Solid terracotta lit cells → translucent fills (color-mix 24%).
 *  - Travelling sparkle dots on each arc → DROPPED. The arcs draw IS the gesture.
 *  - Verdict tick scale 0 → 1.4 → 1 + halo + 2 sparkles → tick draws via
 *    pathLength + a single faint terracotta-translucent shadow behind lit cells.
 *  - Stroke widths 2.6–3.6 → 1.2–1.8.
 *  - 5 s loop with phase-stagger pops → 6 s loop, opacity-led, single narrative.
 *
 * Composition (10 load-bearing elements — at the 8–10 v6 target):
 *  1.  Email input rounded-rect outline (thin)
 *  2.  Caret stub (terracotta, opacity blink)
 *  3-5. 3 hash arcs (thin curves, draw via pathLength)
 *  6.  Bit-array group (10 cells in one row — counted as one composition unit)
 *  7-9. 3 lit-cell overlays (translucent terracotta, soft fade-in)
 *  10. Verdict tick (terracotta path, draws via pathLength)
 *  + (delight) faint terracotta-translucent shadow under lit cells, one cycle.
 *
 * Motion (playbook §3, §4):
 *  - 6 s continuous loop.
 *  - Phase 1 (0–18%): caret blinks; arcs hidden.
 *  - Phase 2 (18–48%): 3 hash arcs draw simultaneously via pathLength 0→1.
 *  - Phase 3 (48–72%): 3 cells fill via opacity 0→1, with a gentle delight
 *    shadow easing in behind each.
 *  - Phase 4 (72–94%): verdict tick draws via pathLength 0→1 with a 600 ms
 *    fade-in. Held briefly.
 *  - Phase 5 (94–100%): all fade out, ready for next cycle.
 *  - Hover amplifies via whileHover on the wrapping motion.g (period 6→4 s).
 *
 * Frame-stability R6: only opacity / pathLength animate. No scale on chrome.
 *
 * Reduced-motion end-state: caret static visible, arcs fully drawn, 3 cells
 * filled translucent terracotta with delight-shadow visible, verdict tick fully
 * drawn. The article's thesis lands statically — "yes, taken."
 */
export function HowGmailCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // ── Bit-array geometry: single row of 10 cells (film strip) ──
  const cellCount = 10;
  const cellW = 14;
  const cellH = 18;
  const cellGap = 3;
  const arrayW = cellCount * cellW + (cellCount - 1) * cellGap;
  const arrayX = (200 - arrayW) / 2;
  const arrayY = 130;

  // 3 lit indexes — spread across the row.
  const litIndexes = [1, 5, 8];

  const cells = Array.from({ length: cellCount }, (_, i) => ({
    x: arrayX + i * (cellW + cellGap),
    y: arrayY,
    cx: arrayX + i * (cellW + cellGap) + cellW / 2,
    cy: arrayY + cellH / 2,
    lit: litIndexes.includes(i),
  }));

  const litCells = cells.filter((c) => c.lit);

  // Input bubble center.
  const inputCx = 100;
  const inputBottomY = 70;

  // Translucent terracotta — ~24% mix of accent over surface.
  const accentTranslucent = "color-mix(in oklab, var(--color-accent) 24%, transparent)";
  const accentTranslucentSoft = "color-mix(in oklab, var(--color-accent) 12%, transparent)";

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── Email input bubble at top — thin outline only ──────── */}
      <rect
        x={56}
        y={40}
        width={88}
        height={28}
        rx={7}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />
      {/* "you@" stub glyphs — quiet */}
      <rect x={64} y={52} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.55} />
      <rect x={71} y={52} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.55} />
      <rect x={78} y={52} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.55} />
      <circle cx={88} cy={54} r={2.4} fill="none" stroke="var(--color-text-muted)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <rect x={94} y={52} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.4} />
      <rect x={101} y={52} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.4} />

      {/* Caret — gentle opacity blink */}
      <motion.rect
        x={114}
        y={48}
        width={1.6}
        height={12}
        rx={0.5}
        fill="var(--color-accent)"
        initial={{ opacity: 1 }}
        animate={animate ? { opacity: [1, 0.2, 1, 0.2, 1] } : { opacity: 1 }}
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.06, 0.12, 0.18, 0.24],
              }
            : undefined
        }
      />

      {/* ─── 3 hash arcs (thin, opacity-led, draw via pathLength) ─── */}
      {litCells.map((cell, i) => {
        const startX = inputCx;
        const startY = inputBottomY + 4;
        const endX = cell.cx;
        const endY = arrayY - 2;
        const midX = (startX + endX) / 2;
        const midY = startY + 24 + i * 5;
        const d = `M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`;
        return (
          <motion.path
            key={`arc-${i}`}
            d={d}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={1.6}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              animate
                ? {
                    pathLength: [0, 0, 1, 1, 0],
                    opacity: [0, 0, 0.8, 0.8, 0],
                  }
                : { pathLength: 1, opacity: 0.8 }
            }
            transition={
              animate
                ? {
                    duration: 6,
                    repeat: Infinity,
                    ease: [0.22, 1, 0.36, 1],
                    times: [0, 0.18, 0.48, 0.94, 1],
                  }
                : undefined
            }
          />
        );
      })}

      {/* ─── Bit-array — 10 thin outlined cells, single row ──────── */}
      {cells.map((c, i) => (
        <rect
          key={`cell-${i}`}
          x={c.x}
          y={c.y}
          width={cellW}
          height={cellH}
          rx={2}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.2}
          opacity={c.lit ? 0.9 : 0.45}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* ─── Delight shadow under lit cells (gentle, one ease-in) ── */}
      {litCells.map((cell, i) => (
        <motion.rect
          key={`shadow-${i}`}
          x={cell.x - 1.5}
          y={cell.y - 1.5}
          width={cellW + 3}
          height={cellH + 3}
          rx={2.5}
          fill={accentTranslucentSoft}
          initial={{ opacity: 0 }}
          animate={
            animate
              ? { opacity: [0, 0, 0, 0.9, 0.9, 0] }
              : { opacity: 0.9 }
          }
          transition={
            animate
              ? {
                  duration: 6,
                  repeat: Infinity,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.5, 0.55, 0.7, 0.94, 1],
                }
              : undefined
          }
        />
      ))}

      {/* ─── Lit-cell translucent fills (opacity-led) ───────────── */}
      {litCells.map((cell, i) => (
        <motion.rect
          key={`lit-${i}`}
          x={cell.x}
          y={cell.y}
          width={cellW}
          height={cellH}
          rx={2}
          fill={accentTranslucent}
          initial={{ opacity: 0 }}
          animate={
            animate
              ? { opacity: [0, 0, 1, 1, 0] }
              : { opacity: 1 }
          }
          transition={
            animate
              ? {
                  duration: 6,
                  repeat: Infinity,
                  ease: [0.22, 1, 0.36, 1],
                  times: [0, 0.5 + i * 0.04, 0.62 + i * 0.04, 0.94, 1],
                }
              : undefined
          }
        />
      ))}

      {/* ─── Verdict tick (slim, draws via pathLength) ──────────── */}
      <motion.path
        d="M 162 102 L 168 108 L 180 94"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          animate
            ? {
                pathLength: [0, 0, 1, 1, 0],
                opacity: [0, 0, 1, 1, 0],
              }
            : { pathLength: 1, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.72, 0.86, 0.94, 1],
              }
            : undefined
        }
      />
    </motion.g>
  );
}

/**
 * HowGmailCoverStatic — Satori-safe pure-JSX export of the v6 reduced-motion
 * end-state. Pure JSX, hex palette inline. No motion.*, no hooks, no color-mix.
 *
 * End-state: input visible, arcs fully drawn, all 10 cells outlined with 3
 * lit (translucent terracotta fill), delight shadow visible behind lit cells,
 * verdict tick fully drawn.
 */
export function HowGmailCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  // Translucent terracotta over BG — pre-mixed (accent ~24% over BG #0e1114).
  const ACCENT_FILL_24 = "#4a2a22";
  // Lighter wash for delight shadow (~12%).
  const ACCENT_FILL_12 = "#23191b";

  // 10-cell linear bit-array geometry, mirrors animated.
  const cellCount = 10;
  const cellW = 14;
  const cellH = 18;
  const cellGap = 3;
  const arrayW = cellCount * cellW + (cellCount - 1) * cellGap;
  const arrayX = (200 - arrayW) / 2;
  const arrayY = 130;
  const litIndexes = [1, 5, 8];
  const inputCx = 100;
  const inputBottomY = 70;

  const cells = Array.from({ length: cellCount }, (_, i) => ({
    x: arrayX + i * (cellW + cellGap),
    cx: arrayX + i * (cellW + cellGap) + cellW / 2,
    lit: litIndexes.includes(i),
  }));

  const litCells = cells.filter((c) => c.lit);

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Input bubble */}
      <rect x={56} y={40} width={88} height={28} rx={7} fill="none" stroke={MUTED} strokeWidth={1.2} />
      <rect x={64} y={52} width={4} height={4} rx={1} fill={MUTED} opacity={0.55} />
      <rect x={71} y={52} width={4} height={4} rx={1} fill={MUTED} opacity={0.55} />
      <rect x={78} y={52} width={4} height={4} rx={1} fill={MUTED} opacity={0.55} />
      <circle cx={88} cy={54} r={2.4} fill="none" stroke={MUTED} strokeWidth={1} />
      <rect x={94} y={52} width={4} height={4} rx={1} fill={MUTED} opacity={0.4} />
      <rect x={101} y={52} width={4} height={4} rx={1} fill={MUTED} opacity={0.4} />
      <rect x={114} y={48} width={1.6} height={12} rx={0.5} fill={ACCENT} />

      {/* 3 hash arcs (fully drawn) */}
      {litCells.map((cell, i) => {
        const startX = inputCx;
        const startY = inputBottomY + 4;
        const endX = cell.cx;
        const endY = arrayY - 2;
        const midX = (startX + endX) / 2;
        const midY = startY + 24 + i * 5;
        const d = `M ${startX} ${startY} Q ${midX} ${midY}, ${endX} ${endY}`;
        return (
          <path
            key={`arc-${i}`}
            d={d}
            fill="none"
            stroke={ACCENT}
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={0.8}
          />
        );
      })}

      {/* Delight shadow behind lit cells */}
      {litCells.map((cell, i) => (
        <rect
          key={`shadow-${i}`}
          x={cell.x - 1.5}
          y={arrayY - 1.5}
          width={cellW + 3}
          height={cellH + 3}
          rx={2.5}
          fill={ACCENT_FILL_12}
          opacity={0.9}
        />
      ))}

      {/* Cell outlines */}
      {cells.map((c, i) => (
        <rect
          key={`cell-${i}`}
          x={c.x}
          y={arrayY}
          width={cellW}
          height={cellH}
          rx={2}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.2}
          opacity={c.lit ? 0.9 : 0.45}
        />
      ))}

      {/* Lit-cell translucent fills */}
      {litCells.map((cell, i) => (
        <rect
          key={`lit-${i}`}
          x={cell.x}
          y={arrayY}
          width={cellW}
          height={cellH}
          rx={2}
          fill={ACCENT_FILL_24}
        />
      ))}

      {/* Verdict tick */}
      <path
        d="M 162 102 L 168 108 L 180 94"
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
