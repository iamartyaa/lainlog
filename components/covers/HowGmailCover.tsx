"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * HowGmailCover — v7 metaphor revamp.
 *
 * One sentence:
 *   A vertical pipeline race: a query packet drops from an input through
 *   three stage nodes (cache → bloom → db) and emerges at the bottom as
 *   a verdict glyph before the next keystroke pulses — the article's
 *   actual hook: speed beats finger.
 *
 * Why this metaphor (v7):
 *   v5/v6 used hash-arcs into a bit-array — bloom-filter abstract, true
 *   to the implementation but disconnected from the article's hook. The
 *   article is about *speed*: the pipeline returns "already taken"
 *   before your finger lifts. v7 surfaces the pipeline and the race.
 *
 * Composition (10 elements):
 *  1.  Input bubble at top — small rounded-rect.
 *  2.  Caret stub inside input — terracotta, blinks (support gesture).
 *  3-5. Three pipeline stage nodes (small rounded-rects) stacked
 *       vertically with tiny stage-glyph dots inside each.
 *  6.  Vertical pipeline guide line connecting the stages (chrome dash).
 *  7.  Query packet (terracotta dot — the hero element) — drops from
 *       the input through each stage in sequence.
 *  8.  Verdict ring at bottom (small chrome ring — the destination).
 *  9.  Verdict glyph (terracotta tick) — appears when the packet
 *       arrives; gentle opacity 0 → 1 reveal (delight beat, no scale
 *       pulse per playbook §14).
 *  10. Bottom anchor — small dot under the verdict ring, gives the
 *       composition a baseline.
 *
 * Motion (playbook §3, §4, §14 — refined editorial register):
 *  - 6s continuous loop. Single hero gesture (packet traversal) + one
 *    quiet support (caret blink).
 *  - Phase A (0–0.10): caret blinks once (the keystroke).
 *  - Phase B (0.10–0.62): query packet traverses pipeline — 200ms per
 *    stage with SPRING.gentle settle. Each stage glows briefly as the
 *    packet passes.
 *  - Phase C (0.62–0.76): verdict glyph fades in via opacity 0 → 1.
 *  - Phase D (0.76–1): verdict holds, then resets for the next cycle.
 *  - Hover amplifies via whileHover on the wrapping motion.g.
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: query packet at the bottom (just emerged
 * as verdict), verdict glyph at full opacity, caret at mid-blink.
 */
export function HowGmailCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Pipeline column.
  const colX = 100;

  // Input geometry (top).
  const inputY = 28;
  const inputH = 22;

  // Three stage nodes — vertical positions.
  const stages = [
    { y: 70, label: "cache" },
    { y: 100, label: "bloom" },
    { y: 130, label: "db" },
  ] as const;
  const stageW = 60;
  const stageH = 18;

  // Verdict ring (bottom).
  const verdictY = 168;

  // Stage glow timings — packet arrives at each stage in sequence.
  const stageGlowTimes: number[][] = [
    [0, 0.14, 0.22, 0.32, 1], // cache
    [0, 0.28, 0.36, 0.46, 1], // bloom
    [0, 0.42, 0.5, 0.6, 1], // db
  ];

  return (
    <motion.g initial="idle" whileHover="hover">
      {/* ─── Pipeline guide line (chrome dashed) ────────────────── */}
      <line
        x1={colX}
        y1={inputY + inputH}
        x2={colX}
        y2={verdictY - 6}
        stroke="var(--color-text-muted)"
        strokeWidth={1.0}
        strokeDasharray="2 3"
        opacity={0.32}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Input bubble (top) ─────────────────────────────────── */}
      <rect
        x={colX - 38}
        y={inputY}
        width={76}
        height={inputH}
        rx={5}
        fill="color-mix(in oklab, var(--color-accent) 6%, transparent)"
        stroke="var(--color-text-muted)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />
      {/* Input glyph stubs */}
      <rect x={colX - 30} y={inputY + 8} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.7} />
      <rect x={colX - 22} y={inputY + 8} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.55} />
      <rect x={colX - 14} y={inputY + 8} width={4} height={4} rx={1} fill="var(--color-text-muted)" opacity={0.4} />

      {/* Caret stub — blinks (support gesture) */}
      <motion.rect
        x={colX - 6}
        y={inputY + 6}
        width={1.4}
        height={10}
        rx={0.5}
        fill="var(--color-accent)"
        initial={{ opacity: 1 }}
        animate={
          animate
            ? { opacity: [1, 0, 1, 1, 0, 1] }
            : { opacity: 0.6 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: "linear",
                times: [0, 0.05, 0.1, 0.7, 0.78, 1],
              }
            : undefined
        }
      />

      {/* ─── Pipeline stage nodes ───────────────────────────────── */}
      {stages.map((stage, i) => (
        <g key={`stage-${i}`}>
          {/* Stage rect */}
          <motion.rect
            x={colX - stageW / 2}
            y={stage.y - stageH / 2}
            width={stageW}
            height={stageH}
            rx={3}
            fill="color-mix(in oklab, var(--color-accent) 4%, transparent)"
            stroke="var(--color-text-muted)"
            strokeWidth={1.2}
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0.65 }}
            animate={
              animate
                ? { opacity: [0.65, 0.65, 1, 0.65, 0.65] }
                : { opacity: 0.85 }
            }
            transition={
              animate
                ? {
                    duration: 6,
                    repeat: Infinity,
                    ease: [0.4, 0, 0.2, 1],
                    times: stageGlowTimes[i],
                  }
                : undefined
            }
          />
          {/* Stage glyph: 3 small horizontal stubs (label hint without text) */}
          <line x1={colX - 22} y1={stage.y - 2} x2={colX - 14} y2={stage.y - 2} stroke="var(--color-text-muted)" strokeWidth={1.0} strokeLinecap="round" opacity={0.7} vectorEffect="non-scaling-stroke" />
          <line x1={colX - 22} y1={stage.y + 2} x2={colX - 10} y2={stage.y + 2} stroke="var(--color-text-muted)" strokeWidth={1.0} strokeLinecap="round" opacity={0.55} vectorEffect="non-scaling-stroke" />
          {/* Stage indicator dot, right side */}
          <circle cx={colX + 22} cy={stage.y} r={1.4} fill="var(--color-text-muted)" opacity={0.55} />
        </g>
      ))}

      {/* ─── Query packet (hero — drops through pipeline) ───────── */}
      <motion.circle
        cx={colX}
        r={3.6}
        fill="var(--color-accent)"
        initial={{ cy: inputY + inputH, opacity: 0 }}
        animate={
          animate
            ? {
                cy: [
                  inputY + inputH,
                  stages[0].y,
                  stages[1].y,
                  stages[2].y,
                  verdictY - 6,
                  verdictY - 6,
                  inputY + inputH,
                ],
                opacity: [0, 1, 1, 1, 1, 0, 0],
              }
            : { cy: verdictY - 6, opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0.08, 0.2, 0.34, 0.48, 0.62, 0.86, 0.98],
              }
            : undefined
        }
      />

      {/* ─── Verdict ring (chrome — destination marker) ─────────── */}
      <circle
        cx={colX}
        cy={verdictY}
        r={9}
        fill="none"
        stroke="var(--color-text-muted)"
        strokeWidth={1.2}
        opacity={0.5}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Verdict glyph (terracotta tick — gentle opacity reveal) ── */}
      <motion.path
        d={`M ${colX - 4} ${verdictY} L ${colX - 1} ${verdictY + 3} L ${colX + 5} ${verdictY - 3}`}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2.0}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
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
                ease: "easeInOut",
                times: [0, 0.62, 0.78, 0.92, 1],
              }
            : undefined
        }
      />
    </motion.g>
  );
}

/**
 * HowGmailCoverStatic — Satori-safe pure-JSX export.
 * Reduced-motion end-state: query packet at the bottom (just emerged
 * as verdict), verdict tick at full opacity, caret at mid-blink (60%).
 */
export function HowGmailCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  const STAGE_FILL = "#23191b"; // ~4% terracotta over BG
  const INPUT_FILL = "#3b2620"; // ~10%

  const colX = 100;
  const inputY = 28;
  const inputH = 22;
  const verdictY = 168;
  const stageW = 60;
  const stageH = 18;
  const stages = [
    { y: 70 },
    { y: 100 },
    { y: 130 },
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Pipeline guide line */}
      <line x1={colX} y1={inputY + inputH} x2={colX} y2={verdictY - 6} stroke={MUTED} strokeWidth={1.0} strokeDasharray="2 3" opacity={0.32} />

      {/* Input bubble */}
      <rect x={colX - 38} y={inputY} width={76} height={inputH} rx={5} fill={INPUT_FILL} stroke={MUTED} strokeWidth={1.2} />
      <rect x={colX - 30} y={inputY + 8} width={4} height={4} rx={1} fill={MUTED} opacity={0.7} />
      <rect x={colX - 22} y={inputY + 8} width={4} height={4} rx={1} fill={MUTED} opacity={0.55} />
      <rect x={colX - 14} y={inputY + 8} width={4} height={4} rx={1} fill={MUTED} opacity={0.4} />
      {/* Caret at mid-blink */}
      <rect x={colX - 6} y={inputY + 6} width={1.4} height={10} rx={0.5} fill={ACCENT} opacity={0.6} />

      {/* Stage nodes */}
      {stages.map((stage, i) => (
        <g key={`stage-${i}`}>
          <rect x={colX - stageW / 2} y={stage.y - stageH / 2} width={stageW} height={stageH} rx={3} fill={STAGE_FILL} stroke={MUTED} strokeWidth={1.2} opacity={0.85} />
          <line x1={colX - 22} y1={stage.y - 2} x2={colX - 14} y2={stage.y - 2} stroke={MUTED} strokeWidth={1.0} strokeLinecap="round" opacity={0.7} />
          <line x1={colX - 22} y1={stage.y + 2} x2={colX - 10} y2={stage.y + 2} stroke={MUTED} strokeWidth={1.0} strokeLinecap="round" opacity={0.55} />
          <circle cx={colX + 22} cy={stage.y} r={1.4} fill={MUTED} opacity={0.55} />
        </g>
      ))}

      {/* Query packet — emerged at the bottom */}
      <circle cx={colX} cy={verdictY - 6} r={3.6} fill={ACCENT} opacity={0.6} />

      {/* Verdict ring */}
      <circle cx={colX} cy={verdictY} r={9} fill="none" stroke={MUTED} strokeWidth={1.2} opacity={0.5} />

      {/* Verdict tick */}
      <path
        d={`M ${colX - 4} ${verdictY} L ${colX - 1} ${verdictY + 3} L ${colX + 5} ${verdictY - 3}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth={2.0}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
