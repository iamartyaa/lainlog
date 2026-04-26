"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * BrowserStoppedAskingCover — long-poll / SSE / WebSocket: the connection that won't hang up.
 *
 * v4 concept (one sentence):
 *   Client and server are joined by a thick terracotta beam; packets shuttle
 *   back and forth in steady rhythm while both endpoints breathe — the
 *   connection stays open.
 *
 * Composition (~10 elements, all readable at 64px):
 *  1. Client tile (rounded-rect, left)
 *  2. Client cursor dot
 *  3. Server tile (rounded-rect, right)
 *  4. Server stack lines (3 short horizontals)
 *  5. Connecting beam (thick rounded line, terracotta)
 *  6-7. 2 packet dots traveling along the beam in opposite phases
 *  8-9. 2 endpoint pulse-rings (one per endpoint, breathing)
 *  10. Forward arrowhead chevron at midpoint (subtle direction cue)
 *
 * Motion (DESIGN.md §9):
 *  - 4s continuous loop. Packet A: left→right; Packet B: right→left, offset.
 *  - Endpoint pulse-rings breathe in sync with packet arrival.
 *  - Beam shimmers via low-amplitude opacity oscillation.
 *
 * Frame-stability R6: only x / cx / scale / opacity animate. Tokens-only.
 *
 * Reduced-motion end-state: beam fully drawn, packets sit at midpoint,
 * endpoint rings at rest scale.
 */
export function BrowserStoppedAskingCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Beam endpoints — load-bearing geometry shared by packets and rings.
  const beamY = 100;
  const leftX = 56;
  const rightX = 144;

  return (
    <g>
      {/* ─── Endpoint A: client tile (left) ─────────────────────── */}
      <rect
        x={20}
        y={76}
        width={48}
        height={48}
        rx={8}
        fill="var(--color-surface)"
        stroke="var(--color-text)"
        strokeWidth={2.4}
        vectorEffect="non-scaling-stroke"
      />
      {/* Client cursor dot — small detail */}
      <circle cx={32} cy={88} r={2} fill="var(--color-text-muted)" opacity={0.7} />
      <rect x={28} y={104} width={32} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.5} />
      <rect x={28} y={110} width={20} height={2} rx={1} fill="var(--color-text-muted)" opacity={0.5} />

      {/* ─── Endpoint B: server tile (right) ────────────────────── */}
      <rect
        x={132}
        y={76}
        width={48}
        height={48}
        rx={8}
        fill="var(--color-surface)"
        stroke="var(--color-text)"
        strokeWidth={2.4}
        vectorEffect="non-scaling-stroke"
      />
      {/* Server stack lines */}
      <line x1={142} y1={88} x2={170} y2={88} stroke="var(--color-text-muted)" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={142} y1={100} x2={170} y2={100} stroke="var(--color-text-muted)" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <line x1={142} y1={112} x2={170} y2={112} stroke="var(--color-text-muted)" strokeWidth={1.6} strokeLinecap="round" vectorEffect="non-scaling-stroke" />

      {/* ─── Endpoint pulse rings (breathing, behind tiles visually but drawn after for layering) ── */}
      <motion.circle
        cx={leftX - 12}
        cy={beamY}
        r={28}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={
          animate
            ? { opacity: [0, 0.5, 0], scale: [0.8, 1.25, 1.4] }
            : { opacity: 0.25, scale: 1 }
        }
        transition={
          animate
            ? { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }
            : undefined
        }
        style={{ transformOrigin: `${leftX - 12}px ${beamY}px`, transformBox: "fill-box" as const }}
      />
      <motion.circle
        cx={rightX + 12}
        cy={beamY}
        r={28}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={
          animate
            ? { opacity: [0, 0.5, 0], scale: [0.8, 1.25, 1.4] }
            : { opacity: 0.25, scale: 1 }
        }
        transition={
          animate
            ? { duration: 2, delay: 1, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }
            : undefined
        }
        style={{ transformOrigin: `${rightX + 12}px ${beamY}px`, transformBox: "fill-box" as const }}
      />

      {/* ─── Connecting beam (the hero gesture) ─────────────────── */}
      <motion.line
        x1={leftX}
        y1={beamY}
        x2={rightX}
        y2={beamY}
        stroke="var(--color-accent)"
        strokeWidth={5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ opacity: 0.85 }}
        animate={animate ? { opacity: [0.7, 1, 0.7] } : { opacity: 0.9 }}
        transition={
          animate
            ? { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }
            : undefined
        }
      />

      {/* ─── Packet A: client → server (large, visible) ─────────── */}
      <motion.circle
        cy={beamY}
        r={5}
        fill="var(--color-text)"
        stroke="var(--color-accent)"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        initial={{ cx: leftX, opacity: 0 }}
        animate={
          animate
            ? { cx: [leftX, rightX], opacity: [0, 1, 1, 0] }
            : { cx: 100, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.1, 0.85, 1],
              }
            : undefined
        }
      />

      {/* ─── Packet B: server → client (offset by half cycle) ──── */}
      <motion.circle
        cy={beamY}
        r={5}
        fill="var(--color-text)"
        stroke="var(--color-accent)"
        strokeWidth={2.5}
        vectorEffect="non-scaling-stroke"
        initial={{ cx: rightX, opacity: 0 }}
        animate={
          animate
            ? { cx: [rightX, leftX], opacity: [0, 1, 1, 0] }
            : { cx: 100, opacity: 0 }
        }
        transition={
          animate
            ? {
                duration: 2,
                delay: 1,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.1, 0.85, 1],
              }
            : undefined
        }
      />
    </g>
  );
}

/**
 * BrowserStoppedAskingCoverStatic — Satori-safe pure-JSX export.
 * Reduced-motion end-state: beam fully drawn, two packets sit at midpoint,
 * endpoint pulse-rings at rest scale.
 */
export function BrowserStoppedAskingCoverStatic() {
  const ACCENT = "#d97341";
  const TEXT = "#f8f5f0";
  const MUTED = "#7a7570";
  const SURFACE = "#1a1714";

  const beamY = 100;
  const leftX = 56;
  const rightX = 144;

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Client tile */}
      <rect x={20} y={76} width={48} height={48} rx={8} fill={SURFACE} stroke={TEXT} strokeWidth={2.4} />
      <circle cx={32} cy={88} r={2} fill={MUTED} opacity={0.7} />
      <rect x={28} y={104} width={32} height={2} rx={1} fill={MUTED} opacity={0.5} />
      <rect x={28} y={110} width={20} height={2} rx={1} fill={MUTED} opacity={0.5} />

      {/* Server tile */}
      <rect x={132} y={76} width={48} height={48} rx={8} fill={SURFACE} stroke={TEXT} strokeWidth={2.4} />
      <line x1={142} y1={88} x2={170} y2={88} stroke={MUTED} strokeWidth={1.6} strokeLinecap="round" />
      <line x1={142} y1={100} x2={170} y2={100} stroke={MUTED} strokeWidth={1.6} strokeLinecap="round" />
      <line x1={142} y1={112} x2={170} y2={112} stroke={MUTED} strokeWidth={1.6} strokeLinecap="round" />

      {/* Endpoint pulse rings (at rest) */}
      <circle cx={leftX - 12} cy={beamY} r={28} fill="none" stroke={ACCENT} strokeWidth={2} opacity={0.25} />
      <circle cx={rightX + 12} cy={beamY} r={28} fill="none" stroke={ACCENT} strokeWidth={2} opacity={0.25} />

      {/* Beam */}
      <line x1={leftX} y1={beamY} x2={rightX} y2={beamY} stroke={ACCENT} strokeWidth={5} strokeLinecap="round" opacity={0.9} />

      {/* Packets at midpoint — show one going each direction, both visible */}
      <circle cx={88} cy={beamY} r={5} fill={TEXT} stroke={ACCENT} strokeWidth={2.5} />
      <circle cx={112} cy={beamY} r={5} fill={TEXT} stroke={ACCENT} strokeWidth={2.5} />
    </svg>
  );
}
