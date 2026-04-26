"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * BrowserStoppedAskingCover — v7 metaphor revamp.
 *
 * One sentence:
 *   A split-pane contrast — the left side reconnects in sawtooth blips
 *   (polling: connect, ask, drop), the right side draws one continuous
 *   line that two packets travel along (persistence: stay open) — the
 *   contrast IS the metaphor.
 *
 * Why this metaphor (v7):
 *   v4 used a single thick beam with packets shuttling. That conflated
 *   polling with WebSockets into a single image and made the contrast
 *   invisible. v7 puts polling and persistence side-by-side so the
 *   article's hook ("the browser stopped hanging up") is the visual
 *   contrast itself.
 *
 * Composition (10 elements):
 *  1.  Vertical divider (chrome — splits the panes).
 *  2.  Left endpoint stub (small chrome dot, top-left).
 *  3.  Left endpoint stub (small chrome dot, bottom-left).
 *  4-6. Three sawtooth "blip" connectors on the left — short vertical
 *      strokes that animate connect → disconnect on a stagger.
 *  7.  Right endpoint dot (top of the continuous line, terracotta).
 *  8.  Right endpoint dot (bottom of the continuous line, terracotta —
 *      sparkles when each packet arrives, the delight beat).
 *  9.  Right continuous line (hero — pathLength draws once, then holds).
 *  10. Right packet (single terracotta dot travelling continuously
 *      along the line — implies the second packet by symmetry; one
 *      mover keeps the composition quiet).
 *
 * Motion (playbook §3, §4, §14 — refined kinetic register):
 *  - 6s continuous loop. The two halves run in parallel with the right
 *    half as the calm hero and the left half as the restless support.
 *  - Left side (3 cycles per loop, 2s each):
 *      sawtooth blip strokes draw via pathLength then snap to 0;
 *      staggered 0.2s apart so the eye reads "constant reconnect."
 *  - Right side (1 cycle per loop):
 *      continuous line pathLength 0 → 1 in the first 30%, then holds
 *      sustained; one packet dot travels top → bottom over the loop.
 *      Each time the packet hits the bottom endpoint, that endpoint
 *      gets a faint opacity sparkle (delight beat).
 *  - Hover amplifies via whileHover on the wrapping motion.g.
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: right line fully drawn, packet at midpoint,
 * left side mid-disconnection (one blip half-drawn).
 */
export function BrowserStoppedAskingCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Pane geometry.
  const dividerX = 100;
  const topY = 40;
  const bottomY = 160;

  // Left pane: polling — 3 blip Xs at distinct vertical positions.
  const leftBlipX = 60;
  const blipYs = [60, 100, 140];

  // Right pane: continuous line endpoints.
  const rightX = 140;

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── Vertical divider (chrome) ──────────────────────────── */}
      <line
        x1={dividerX}
        y1={28}
        x2={dividerX}
        y2={172}
        stroke="var(--color-text-muted)"
        strokeWidth={1.0}
        strokeDasharray="2 4"
        opacity={0.32}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Left endpoint stubs (chrome dots) ──────────────────── */}
      <circle cx={30} cy={topY} r={3} fill="none" stroke="var(--color-text-muted)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" opacity={0.55} />
      <circle cx={30} cy={bottomY} r={3} fill="none" stroke="var(--color-text-muted)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" opacity={0.55} />
      {/* Left long axis — chrome rail the blips connect to */}
      <line
        x1={30}
        y1={topY}
        x2={30}
        y2={bottomY}
        stroke="var(--color-text-muted)"
        strokeWidth={1.0}
        opacity={0.4}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Left blips (polling sawtooth — 3 reconnects per loop) ─ */}
      {blipYs.map((blipY, i) => (
        <motion.line
          key={`blip-${i}`}
          x1={30}
          y1={blipY}
          x2={leftBlipX}
          y2={blipY}
          stroke="var(--color-accent)"
          strokeWidth={1.4}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            animate
              ? {
                  pathLength: [0, 1, 1, 0, 0],
                  opacity: [0, 0.85, 0.85, 0.2, 0],
                }
              : i === 1
                ? { pathLength: 0.55, opacity: 0.65 }
                : { pathLength: 0, opacity: 0 }
          }
          transition={
            animate
              ? {
                  duration: 2,
                  delay: i * 0.18,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.3, 0.6, 0.85, 1],
                }
              : undefined
          }
        />
      ))}

      {/* Left blip endpoints (small dots that pulse with the blip) */}
      {blipYs.map((blipY, i) => (
        <motion.circle
          key={`blip-end-${i}`}
          cx={leftBlipX}
          cy={blipY}
          r={1.8}
          fill="var(--color-accent)"
          initial={{ opacity: 0 }}
          animate={
            animate
              ? { opacity: [0, 0.85, 0.85, 0.15, 0] }
              : i === 1
                ? { opacity: 0.5 }
                : { opacity: 0 }
          }
          transition={
            animate
              ? {
                  duration: 2,
                  delay: i * 0.18,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  times: [0, 0.3, 0.6, 0.85, 1],
                }
              : undefined
          }
        />
      ))}

      {/* ─── Right pane: continuous line (hero) ─────────────────── */}
      <motion.line
        x1={rightX}
        y1={topY}
        x2={rightX}
        y2={bottomY}
        stroke="var(--color-accent)"
        strokeWidth={2.0}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0.9 }}
        animate={
          animate
            ? { pathLength: [0, 1, 1, 1], opacity: [0.85, 0.95, 0.95, 0.95] }
            : { pathLength: 1, opacity: 0.95 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.3, 0.95, 1],
              }
            : undefined
        }
      />

      {/* ─── Right top endpoint ─────────────────────────────────── */}
      <circle
        cx={rightX}
        cy={topY}
        r={3.5}
        fill="var(--color-accent)"
        opacity={0.95}
      />

      {/* ─── Right bottom endpoint (sparkles on packet arrival) ─── */}
      <motion.circle
        cx={rightX}
        cy={bottomY}
        r={3.5}
        fill="var(--color-accent)"
        initial={{ opacity: 0.7 }}
        animate={
          animate
            ? { opacity: [0.7, 0.7, 1, 0.7, 0.7] }
            : { opacity: 0.95 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.78, 0.86, 0.94, 1],
              }
            : undefined
        }
      />

      {/* ─── Right packet (continuous traveller) ────────────────── */}
      <motion.circle
        cx={rightX}
        r={2.4}
        fill="var(--color-text)"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        initial={{ cy: topY + 4, opacity: 0 }}
        animate={
          animate
            ? {
                cy: [topY + 4, bottomY - 4, bottomY - 4],
                opacity: [0, 1, 0],
              }
            : { cy: 100, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0.32, 0.86, 0.96],
              }
            : undefined
        }
      />
    </motion.g>
  );
}

/**
 * BrowserStoppedAskingCoverStatic — Satori-safe pure-JSX export.
 * Reduced-motion end-state: right continuous line fully drawn, packet
 * at midpoint, left side at the in-between frame (middle blip
 * half-drawn) so the contrast still reads from the still.
 */
export function BrowserStoppedAskingCoverStatic() {
  const ACCENT = "#d97341";
  const TEXT = "#f8f5f0";
  const MUTED = "#7a7570";

  const dividerX = 100;
  const topY = 40;
  const bottomY = 160;
  const leftBlipX = 60;
  const rightX = 140;

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Vertical divider */}
      <line x1={dividerX} y1={28} x2={dividerX} y2={172} stroke={MUTED} strokeWidth={1.0} strokeDasharray="2 4" opacity={0.32} />

      {/* Left chrome stubs + rail */}
      <circle cx={30} cy={topY} r={3} fill="none" stroke={MUTED} strokeWidth={1.2} opacity={0.55} />
      <circle cx={30} cy={bottomY} r={3} fill="none" stroke={MUTED} strokeWidth={1.2} opacity={0.55} />
      <line x1={30} y1={topY} x2={30} y2={bottomY} stroke={MUTED} strokeWidth={1.0} opacity={0.4} />

      {/* Left blips: top blip drawn, middle blip half-drawn (in-between), bottom blip absent */}
      <line x1={30} y1={60} x2={leftBlipX} y2={60} stroke={ACCENT} strokeWidth={1.4} strokeLinecap="round" opacity={0.7} />
      <circle cx={leftBlipX} cy={60} r={1.8} fill={ACCENT} opacity={0.7} />
      <line x1={30} y1={100} x2={47} y2={100} stroke={ACCENT} strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />

      {/* Right continuous line — hero */}
      <line x1={rightX} y1={topY} x2={rightX} y2={bottomY} stroke={ACCENT} strokeWidth={2.0} strokeLinecap="round" opacity={0.95} />

      {/* Right endpoints */}
      <circle cx={rightX} cy={topY} r={3.5} fill={ACCENT} opacity={0.95} />
      <circle cx={rightX} cy={bottomY} r={3.5} fill={ACCENT} opacity={0.95} />

      {/* Right packet at midpoint */}
      <circle cx={rightX} cy={100} r={2.4} fill={TEXT} stroke={ACCENT} strokeWidth={1.6} />
    </svg>
  );
}
