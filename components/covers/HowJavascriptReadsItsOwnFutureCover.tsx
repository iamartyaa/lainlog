"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * HowJavascriptReadsItsOwnFutureCover — dual-pass scan over a code file.
 *
 * One sentence:
 *   The engine pre-walks your file (creation pass) so declarations are alive
 *   from line 1, then the execution caret follows behind line by line.
 *
 * Composition (~14 load-bearing elements):
 *  1.  Code-page strip outline (rounded rect, the "file")
 *  2.  Engine-eye outer ring (the engine "reading ahead")
 *  3.  Engine-eye pupil dot (terracotta)
 *  4-8. 5 code-line stubs inside the strip (function / let / const / var / call)
 *  9.  function ƒ glyph (lights during creation pass at line 1)
 *  10. let TDZ hatch glyph (lights at line 2)
 *  11. const TDZ hatch glyph (lights at line 3)
 *  12. var undefined-dot glyph (lights at line 4)
 *  13. Creation-pass wave (thin terracotta horizontal bar, top→bottom sweep)
 *  14. Execution-pass caret (terracotta caret + wash, follows behind)
 *
 * Motion (DESIGN.md §9 / playbook §3, §4):
 *  - 6s continuous loop, no idle gap > 600ms.
 *  - Phase A (0–35%): engine-eye scale-pulses; creation-pass wave sweeps
 *    top→bottom across the strip (translateY ≈ 110); declaration glyphs
 *    activate in sequence (opacity 0 → 1 + small scale pop) as the wave passes.
 *  - Phase B (35–88%): execution-pass caret travels top→bottom, slower
 *    (translateY ≈ 100); a wash highlights each line as the caret arrives.
 *  - Phase C (88–100%): glyphs DIM but stay visible (the article's point —
 *    "they're still in the VE"); brief idle, then reset.
 *  - Hover amplifies via whileHover on the wrapping motion.g.
 *
 * Frame-stability R6: only transform / opacity / pathLength animate.
 *
 * Reduced-motion end-state: creation-pass wave at the bottom (complete);
 * all 4 declaration glyphs activated; execution caret at midpoint over line 3.
 * The reader sees: declarations are live, the engine is mid-execution.
 */
export function HowJavascriptReadsItsOwnFutureCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // Code-page geometry. Vertical strip taking ~70% of viewBox height.
  const stripX = 36;
  const stripY = 48;
  const stripW = 128;
  const stripH = 132;

  // 5 code lines spaced inside the strip.
  const lines = [
    { y: stripY + 18, w: 88, kind: "fn" as const },     // function foo() { ... }
    { y: stripY + 40, w: 70, kind: "let" as const },    // let x
    { y: stripY + 62, w: 76, kind: "const" as const },  // const y
    { y: stripY + 84, w: 64, kind: "var" as const },    // var z
    { y: stripY + 106, w: 92, kind: "call" as const },  // foo()
  ];

  const lineX = stripX + 14;

  // Glyph positions (right-side gutter of each declaration line).
  const glyphX = stripX + stripW - 16;

  // Creation-pass wave: translateY from above the strip to below it.
  const waveYStart = stripY - 8;
  const waveYEnd = stripY + stripH + 8;

  // Execution caret: follows behind the wave.
  const caretYStart = stripY + 4;
  const caretYEnd = stripY + stripH - 8;

  // Glyph activation times (within 0..1 of 6s loop) — match wave sweep 0..0.35.
  // Wave passes line[i] at time ~ 0.04 + i * 0.06.
  const glyphActivate: number[][] = [
    [0, 0.04, 0.10, 0.94, 1],   // line 0 (fn ƒ)
    [0, 0.10, 0.16, 0.94, 1],   // line 1 (let TDZ)
    [0, 0.16, 0.22, 0.94, 1],   // line 2 (const TDZ)
    [0, 0.22, 0.28, 0.94, 1],   // line 3 (var undefined-dot)
  ];

  // Line wash schedule for execution pass (caret reaches line[i] at ~ 0.40 + i * 0.10).
  const lineWashSchedule: number[][] = [
    [0, 0.4, 0.46, 0.5, 0.94, 1],
    [0, 0.5, 0.56, 0.6, 0.94, 1],
    [0, 0.6, 0.66, 0.7, 0.94, 1],
    [0, 0.7, 0.76, 0.8, 0.94, 1],
    [0, 0.8, 0.86, 0.88, 0.94, 1],
  ];

  return (
    <motion.g initial={false} whileHover="hover">
      {/* ─── Engine-eye (top-center, "reading ahead") ───────── */}
      <motion.g
        initial={false}
        animate={
          animate
            ? { scale: [0.8, 1.1, 1, 1, 0.95, 0.8], opacity: [0.7, 1, 1, 0.85, 0.7, 0.7] }
            : { scale: 1, opacity: 0.95 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.06, 0.18, 0.6, 0.92, 1],
              }
            : undefined
        }
        style={{
          transformOrigin: "100px 28px",
          transformBox: "fill-box" as const,
        }}
      >
        <circle
          cx={100}
          cy={28}
          r={9}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.8}
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={100} cy={28} r={3} fill="var(--color-accent)" />
      </motion.g>

      {/* ─── Code-page strip outline ────────────────────────── */}
      <rect
        x={stripX}
        y={stripY}
        width={stripW}
        height={stripH}
        rx={6}
        fill="var(--color-surface)"
        stroke="var(--color-text)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
      {/* Left margin rule — code-editor gutter */}
      <line
        x1={stripX + 8}
        y1={stripY + 6}
        x2={stripX + 8}
        y2={stripY + stripH - 6}
        stroke="var(--color-rule)"
        strokeWidth={0.8}
        vectorEffect="non-scaling-stroke"
        opacity={0.6}
      />

      {/* ─── Line wash (execution highlight) ────────────────── */}
      {/* One translucent wash per line; opacity ramps as caret arrives. */}
      {lines.map((ln, i) => (
        <motion.rect
          key={`wash-${i}`}
          x={stripX + 4}
          y={ln.y - 6}
          width={stripW - 8}
          height={12}
          rx={3}
          fill="color-mix(in oklab, var(--color-accent) 22%, transparent)"
          initial={{ opacity: 0 }}
          animate={
            animate
              ? { opacity: [0, 0, 0.85, 0.5, 0.2, 0] }
              : { opacity: i === 2 ? 0.7 : 0 } // reduced-motion: line 2 highlighted (caret at midpoint)
          }
          transition={
            animate
              ? {
                  duration: 6,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  times: lineWashSchedule[i],
                }
              : undefined
          }
        />
      ))}

      {/* ─── Code-line stubs ────────────────────────────────── */}
      {lines.map((ln, i) => (
        <rect
          key={`line-${i}`}
          x={lineX}
          y={ln.y - 1.5}
          width={ln.w}
          height={3}
          rx={1.5}
          fill="var(--color-text-muted)"
          opacity={0.78}
        />
      ))}

      {/* ─── Declaration glyphs ─────────────────────────────── */}
      {/* Line 0: function ƒ — circle with f inside */}
      <motion.g
        initial={false}
        animate={
          animate
            ? { opacity: [0, 0, 1, 0.55, 0], scale: [0.6, 0.6, 1.2, 1, 0.6] }
            : { opacity: 0.85, scale: 1 } // reduced-motion: visible
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: glyphActivate[0],
              }
            : undefined
        }
        style={{
          transformOrigin: `${glyphX}px ${lines[0].y}px`,
          transformBox: "fill-box" as const,
        }}
      >
        <circle
          cx={glyphX}
          cy={lines[0].y}
          r={5.5}
          fill="color-mix(in oklab, var(--color-accent) 35%, transparent)"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
        {/* italic-ish ƒ stem */}
        <path
          d={`M ${glyphX - 1} ${lines[0].y + 3} L ${glyphX + 1} ${lines[0].y - 3}`}
          stroke="var(--color-accent)"
          strokeWidth={1.6}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={glyphX - 2.5}
          y1={lines[0].y - 0.5}
          x2={glyphX + 1.5}
          y2={lines[0].y - 0.5}
          stroke="var(--color-accent)"
          strokeWidth={1.2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>

      {/* Line 1: let — TDZ hatch (rect with diagonal stripes) */}
      <motion.g
        initial={false}
        animate={
          animate
            ? { opacity: [0, 0, 1, 0.55, 0], scale: [0.6, 0.6, 1.18, 1, 0.6] }
            : { opacity: 0.85, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: glyphActivate[1],
              }
            : undefined
        }
        style={{
          transformOrigin: `${glyphX}px ${lines[1].y}px`,
          transformBox: "fill-box" as const,
        }}
      >
        <rect
          x={glyphX - 5.5}
          y={lines[1].y - 5}
          width={11}
          height={10}
          rx={1.5}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
        {/* Diagonal hatch lines */}
        <line
          x1={glyphX - 4}
          y1={lines[1].y + 4}
          x2={glyphX + 4}
          y2={lines[1].y - 4}
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={glyphX - 4}
          y1={lines[1].y - 1}
          x2={glyphX + 1}
          y2={lines[1].y - 5}
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.7}
        />
      </motion.g>

      {/* Line 2: const — TDZ hatch (same pattern; sibling) */}
      <motion.g
        initial={false}
        animate={
          animate
            ? { opacity: [0, 0, 1, 0.55, 0], scale: [0.6, 0.6, 1.18, 1, 0.6] }
            : { opacity: 0.85, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: glyphActivate[2],
              }
            : undefined
        }
        style={{
          transformOrigin: `${glyphX}px ${lines[2].y}px`,
          transformBox: "fill-box" as const,
        }}
      >
        <rect
          x={glyphX - 5.5}
          y={lines[2].y - 5}
          width={11}
          height={10}
          rx={1.5}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={glyphX - 4}
          y1={lines[2].y + 4}
          x2={glyphX + 4}
          y2={lines[2].y - 4}
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={glyphX - 1}
          y1={lines[2].y + 4}
          x2={glyphX + 4}
          y2={lines[2].y}
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.7}
        />
      </motion.g>

      {/* Line 3: var — undefined dot (small muted dot) */}
      <motion.g
        initial={false}
        animate={
          animate
            ? { opacity: [0, 0, 1, 0.6, 0], scale: [0.6, 0.6, 1.3, 1, 0.6] }
            : { opacity: 0.85, scale: 1 }
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: glyphActivate[3],
              }
            : undefined
        }
        style={{
          transformOrigin: `${glyphX}px ${lines[3].y}px`,
          transformBox: "fill-box" as const,
        }}
      >
        <circle
          cx={glyphX}
          cy={lines[3].y}
          r={4}
          fill="none"
          stroke="var(--color-text-muted)"
          strokeWidth={1.4}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={glyphX} cy={lines[3].y} r={1.4} fill="var(--color-text-muted)" />
      </motion.g>

      {/* ─── Creation-pass wave (top→bottom sweep) ──────────── */}
      {/* Thin terracotta bar that traverses the strip vertically. */}
      <motion.g
        initial={false}
        animate={
          animate
            ? { y: [waveYStart, waveYEnd, waveYEnd, waveYStart], opacity: [1, 1, 0, 0] }
            : { y: waveYEnd, opacity: 0 } // reduced-motion: at bottom (complete)
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.34, 0.36, 1],
              }
            : undefined
        }
      >
        <line
          x1={stripX + 2}
          y1={0}
          x2={stripX + stripW - 2}
          y2={0}
          stroke="var(--color-accent)"
          strokeWidth={2.4}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {/* Trailing fade — a second softer line just above */}
        <line
          x1={stripX + 6}
          y1={-3}
          x2={stripX + stripW - 6}
          y2={-3}
          stroke="color-mix(in oklab, var(--color-accent) 45%, transparent)"
          strokeWidth={1.4}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>

      {/* ─── Execution-pass caret (follows behind, slower) ──── */}
      <motion.g
        initial={false}
        animate={
          animate
            ? {
                y: [caretYStart, caretYStart, caretYEnd, caretYStart],
                opacity: [0, 1, 1, 0],
              }
            : { y: (caretYStart + caretYEnd) / 2, opacity: 1 } // reduced-motion: midpoint
        }
        transition={
          animate
            ? {
                duration: 6,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: [0, 0.4, 0.86, 1],
              }
            : undefined
        }
      >
        {/* Caret triangle (right-pointing, in the gutter) */}
        <path
          d={`M ${stripX - 6} -4 L ${stripX - 1} 0 L ${stripX - 6} 4 Z`}
          fill="var(--color-accent)"
        />
        {/* Tail line — short stem behind caret */}
        <line
          x1={stripX - 14}
          y1={0}
          x2={stripX - 7}
          y2={0}
          stroke="var(--color-accent)"
          strokeWidth={1.6}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          opacity={0.7}
        />
      </motion.g>
    </motion.g>
  );
}
