"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * WhyFetchFailsCover — v7 metaphor revamp.
 *
 * One sentence:
 *   Three horizontal tiers (server / browser / JavaScript) — a response
 *   packet drops down into the browser tier successfully, then a thin
 *   curtain seals the boundary between the browser and JS tiers, with a
 *   muted ✕ glyph confirming the response is visible to the browser but
 *   hidden from JavaScript.
 *
 * Why this metaphor (v7):
 *   Earlier v5/v6 used a comet-into-CORS-wall + bounce. That visualized
 *   *rejection*, but the article's actual hook is that the server did
 *   answer — your browser just isn't handing the response to JS. v7
 *   surfaces that distinction: the response IS in the browser; it's the
 *   browser → JS boundary that's curtained off.
 *
 * Composition (~8 concept elements / 13 SVG primitives):
 *  1.  Server tier rect (top) + chrome stub line.
 *  2.  Browser tier rect (middle) + chrome dot.
 *  3.  JS tier rect (bottom) + `{ }` glyph stubs.
 *  4.  Vertical guide line (chrome) connecting the three tiers.
 *  5.  Response packet: terracotta rounded-rect, hero element, drops
 *      from the server into the browser tier.
 *  6.  Curtain shadow: faint translucent line offset 1px below the
 *      curtain — depth.
 *  7.  Curtain hero: thin terracotta stroke drawn between browser and
 *      JS tiers via pathLength — the boundary closing.
 *  8.  ✕ glyph: muted-terracotta cross on the curtain (delight beat —
 *      fades in last with a soft ease-in).
 *
 * Motion (playbook §3, §4, §14 — refined kinetic register):
 *  - 6s continuous loop, no idle gap > 600ms.
 *  - Phase A (0–0.30): response packet drops from server (y=44) to the
 *    browser tier (y=98); opacity 0 → 1, gentle spring.
 *  - Phase B (0.30–0.55): packet settles into the browser tier (small
 *    opacity hold).
 *  - Phase C (0.55–0.78): curtain pathLength 0 → 1 between the browser
 *    and JS tiers; ✕ glyph fades in over the last 600ms.
 *  - Phase D (0.78–1): hold then loop.
 *  - Hover amplifies via whileHover on the wrapping motion.g — speeds the
 *    loop and bumps opacity slightly. Same gesture, more committed.
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: response packet at the browser tier, curtain
 * fully drawn, ✕ visible — the article's thesis lands statically.
 */
export function WhyFetchFailsCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Tier vertical positions.
  const serverY = 30;
  const serverH = 30;
  const browserY = 84;
  const browserH = 32;
  const jsY = 140;
  const jsH = 30;

  // Packet drop coordinates.
  const packetX = 92;
  const packetW = 16;
  const packetH = 12;
  const packetStartY = serverY + (serverH - packetH) / 2;
  const packetEndY = browserY + (browserH - packetH) / 2;

  // Curtain Y — between browser bottom and JS top.
  const curtainY = (browserY + browserH + jsY) / 2;
  const curtainX1 = 36;
  const curtainX2 = 164;

  return (
    <motion.g
      initial="idle"
      whileHover="hover"
      variants={{
        idle: { opacity: 1 },
        hover: { opacity: 1 },
      }}
    >
      {/* ─── Vertical guide line (chrome — connects the three tiers) ── */}
      <line
        x1={100}
        y1={serverY + serverH}
        x2={100}
        y2={jsY}
        stroke="var(--color-text-muted)"
        strokeWidth={1.0}
        strokeDasharray="2 3"
        opacity={0.32}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Server tier (top) ───────────────────────────────────── */}
      <rect
        x={32}
        y={serverY}
        width={136}
        height={serverH}
        rx={6}
        fill="color-mix(in oklab, var(--color-accent) 6%, transparent)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />
      {/* Server stack stub (chrome motif) */}
      <line x1={42} y1={serverY + 15} x2={70} y2={serverY + 15} stroke="var(--color-text-muted)" strokeWidth={1.2} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.6} />

      {/* ─── Browser tier (middle) ───────────────────────────────── */}
      <rect
        x={32}
        y={browserY}
        width={136}
        height={browserH}
        rx={6}
        fill="color-mix(in oklab, var(--color-accent) 10%, transparent)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.4}
        vectorEffect="non-scaling-stroke"
      />
      {/* Chrome dot — anchors "this is the browser" */}
      <circle cx={42} cy={browserY + 8} r={1.8} fill="var(--color-text-muted)" opacity={0.6} />

      {/* ─── JS tier (bottom) — `{ }` glyph stubs ────────────────── */}
      <rect
        x={32}
        y={jsY}
        width={136}
        height={jsH}
        rx={6}
        fill="color-mix(in oklab, var(--color-accent) 4%, transparent)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />
      {/* `{` glyph */}
      <path
        d={`M 78 ${jsY + 8} Q 72 ${jsY + 8}, 72 ${jsY + 14} L 72 ${jsY + 13} Q 72 ${jsY + 15}, 68 ${jsY + 15} Q 72 ${jsY + 15}, 72 ${jsY + 17} L 72 ${jsY + 16} Q 72 ${jsY + 22}, 78 ${jsY + 22}`}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.75}
      />
      {/* `}` glyph */}
      <path
        d={`M 122 ${jsY + 8} Q 128 ${jsY + 8}, 128 ${jsY + 14} L 128 ${jsY + 13} Q 128 ${jsY + 15}, 132 ${jsY + 15} Q 128 ${jsY + 15}, 128 ${jsY + 17} L 128 ${jsY + 16} Q 128 ${jsY + 22}, 122 ${jsY + 22}`}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.75}
      />

      {/* ─── Response packet (hero element — solid terracotta) ──── */}
      <motion.rect
        x={packetX}
        width={packetW}
        height={packetH}
        rx={2.5}
        fill="var(--color-accent)"
        initial={{ y: packetStartY, opacity: 0 }}
        animate={
          animate
            ? {
                y: [packetStartY, packetEndY, packetEndY, packetEndY, packetStartY],
                opacity: [0, 1, 1, 0.85, 0],
              }
            : { y: packetEndY, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.3, 0.78, 0.92, 1],
              }
            : undefined
        }
      />

      {/* ─── Curtain (sealing the browser → JS boundary) ────────── */}
      {/* Faint shadow stroke for depth */}
      <motion.line
        x1={curtainX1}
        y1={curtainY + 1}
        x2={curtainX2}
        y2={curtainY + 1}
        stroke="var(--color-accent)"
        strokeWidth={1.0}
        strokeLinecap="round"
        opacity={0.18}
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0 }}
        animate={animate ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.55, 0.78, 0.92, 1],
              }
            : undefined
        }
      />
      {/* Hero curtain stroke */}
      <motion.line
        x1={curtainX1}
        y1={curtainY}
        x2={curtainX2}
        y2={curtainY}
        stroke="var(--color-accent)"
        strokeWidth={1.8}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0.85 }}
        animate={
          animate
            ? { pathLength: [0, 0, 1, 1, 0], opacity: [0.85, 0.85, 0.95, 0.95, 0.85] }
            : { pathLength: 1, opacity: 0.95 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.55, 0.78, 0.92, 1],
              }
            : undefined
        }
      />

      {/* ─── ✕ glyph on the curtain (delight beat — soft fade-in last) ── */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={
          animate
            ? { opacity: [0, 0, 0, 0.85, 0] }
            : { opacity: 0.85 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.7, 0.78, 0.92, 1],
              }
            : undefined
        }
      >
        <line x1={96} y1={curtainY - 4} x2={104} y2={curtainY + 4} stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7} vectorEffect="non-scaling-stroke" />
        <line x1={96} y1={curtainY + 4} x2={104} y2={curtainY - 4} stroke="var(--color-accent)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7} vectorEffect="non-scaling-stroke" />
      </motion.g>
    </motion.g>
  );
}

/**
 * WhyFetchFailsCoverStatic — Satori-safe pure-JSX export.
 * Reduced-motion end-state: response packet sits at the browser tier,
 * curtain fully drawn between the browser and JS tiers, ✕ visible. The
 * article's thesis lands from the still: the response is *in* the
 * browser; the boundary to JS is sealed.
 */
export function WhyFetchFailsCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  const TIER_FILL_BROWSER = "#3b2620"; // ~10% terracotta over BG
  const TIER_FILL_SERVER = "#23191b"; // ~4%
  const TIER_FILL_JS = "#23191b";

  const serverY = 30;
  const serverH = 30;
  const browserY = 84;
  const browserH = 32;
  const jsY = 140;
  const jsH = 30;
  const packetX = 92;
  const packetW = 16;
  const packetH = 12;
  const packetEndY = browserY + (browserH - packetH) / 2;
  const curtainY = (browserY + browserH + jsY) / 2;
  const curtainX1 = 36;
  const curtainX2 = 164;

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Vertical guide line */}
      <line x1={100} y1={serverY + serverH} x2={100} y2={jsY} stroke={MUTED} strokeWidth={1.0} strokeDasharray="2 3" opacity={0.32} />

      {/* Server tier */}
      <rect x={32} y={serverY} width={136} height={serverH} rx={6} fill={TIER_FILL_SERVER} stroke={MUTED} strokeWidth={1.2} />
      <line x1={42} y1={serverY + 15} x2={70} y2={serverY + 15} stroke={MUTED} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />

      {/* Browser tier */}
      <rect x={32} y={browserY} width={136} height={browserH} rx={6} fill={TIER_FILL_BROWSER} stroke={MUTED} strokeWidth={1.4} />
      <circle cx={42} cy={browserY + 8} r={1.8} fill={MUTED} opacity={0.6} />

      {/* JS tier */}
      <rect x={32} y={jsY} width={136} height={jsH} rx={6} fill={TIER_FILL_JS} stroke={MUTED} strokeWidth={1.2} />
      <path
        d={`M 78 ${jsY + 8} Q 72 ${jsY + 8}, 72 ${jsY + 14} L 72 ${jsY + 13} Q 72 ${jsY + 15}, 68 ${jsY + 15} Q 72 ${jsY + 15}, 72 ${jsY + 17} L 72 ${jsY + 16} Q 72 ${jsY + 22}, 78 ${jsY + 22}`}
        fill="none"
        stroke={MUTED}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.75}
      />
      <path
        d={`M 122 ${jsY + 8} Q 128 ${jsY + 8}, 128 ${jsY + 14} L 128 ${jsY + 13} Q 128 ${jsY + 15}, 132 ${jsY + 15} Q 128 ${jsY + 15}, 128 ${jsY + 17} L 128 ${jsY + 16} Q 128 ${jsY + 22}, 122 ${jsY + 22}`}
        fill="none"
        stroke={MUTED}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.75}
      />

      {/* Response packet — at browser tier */}
      <rect x={packetX} y={packetEndY} width={packetW} height={packetH} rx={2.5} fill={ACCENT} />

      {/* Curtain shadow */}
      <line x1={curtainX1} y1={curtainY + 1} x2={curtainX2} y2={curtainY + 1} stroke={ACCENT} strokeWidth={1.0} strokeLinecap="round" opacity={0.18} />
      {/* Curtain hero */}
      <line x1={curtainX1} y1={curtainY} x2={curtainX2} y2={curtainY} stroke={ACCENT} strokeWidth={1.8} strokeLinecap="round" opacity={0.95} />

      {/* ✕ glyph */}
      <line x1={96} y1={curtainY - 4} x2={104} y2={curtainY + 4} stroke={ACCENT} strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
      <line x1={96} y1={curtainY + 4} x2={104} y2={curtainY - 4} stroke={ACCENT} strokeWidth={1.6} strokeLinecap="round" opacity={0.85} />
    </svg>
  );
}
