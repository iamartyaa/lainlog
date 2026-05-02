"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * EvalsOrVibesCover — v3 redesign.
 *
 * One sentence:
 *   An LLM on the left emits a continuous stream of outputs that glide
 *   rightward through a vertical "eval" gate; each output picks up a
 *   verdict (tick or cross) as it crosses, and a tally on the right
 *   keeps the score.
 *
 * Why this metaphor (v3):
 *   v1 (rotating-neighbor pulse) was below the visual noise floor at 64
 *   px. v2 (horizontal scan beam right→left across a "failure row") was
 *   smooth but the metaphor felt abstract — the reader didn't see "an
 *   eval" in a sweep. v3 picks the most literal direction available:
 *   the pipeline shape every developer recognises — model → output →
 *   judge → verdict → tally. If the loop is read for 3 seconds, the
 *   reader thinks "evals," because they are literally watching outputs
 *   being evaluated.
 *
 * Composition (~12 load-bearing elements):
 *   1.   Model glyph (left) — small rounded square with an inner dot
 *        cluster, the "LLM."
 *   2.   Pipeline track — thin dashed horizontal guide from model to
 *        the right edge, hints the flow direction.
 *   3.   Eval gate — vertical terracotta bar at x ≈ 128, the judge.
 *   4-6. Three output dots, staggered 1/3 of the loop apart, gliding
 *        left → right at constant speed (the smoothness comes from the
 *        constant linear motion — no easing curves, no stutters).
 *   7-9. Three verdict glyphs (tick, tick, cross) — one per output dot.
 *        Each glyph is invisible until its dot crosses the gate, then
 *        rides the dot to the right edge, fading out in sync.
 *   10-12. Tally column on the right — three small static marks (two
 *         ticks and one cross) representing the running score; gives
 *         the still frame its "eval scoreboard" anchor.
 *   13.   Baseline rule under the whole composition.
 *
 * Motion (playbook §3, §4, §14 — refined kinetic register):
 *   - 6s continuous loop. Three dots phased 0.0 / 0.33 / 0.66 — at any
 *     instant, one dot is emitting, one is mid-track, one is crossing
 *     or has just crossed. The reader's eye always has motion to
 *     follow; no idle gap.
 *   - Smoothness: linear easing on the translateX of every dot. A
 *     constant-velocity glide reads as flow, not staccato beats.
 *     Verdict glyphs fade in/out via opacity only.
 *   - Eval gate gently pulses in opacity (0.55 ↔ 1) on a 2s sub-loop —
 *     three pulses per master cycle, one per crossing.
 *   - No scale gestures on chrome. Solid terracotta is reserved for the
 *     three output dots and the gate (the load-bearing eval moment).
 *
 * Frame-stability R6: only transform (translateX) and opacity animate.
 *
 * Reduced-motion end-state: a frozen mid-cycle moment.
 *   - Output dot 0 just past the gate, with its tick verdict attached.
 *   - Output dot 1 mid-track between model and gate.
 *   - Output dot 2 at emission near the model.
 *   - Eval gate at full opacity (mid-pulse on a crossing).
 *   - Tally column showing 2 ticks + 1 cross.
 *   The still alone reads: "outputs are flowing through a judge and
 *   accumulating verdicts." That's the article in one frame.
 */

// Layout geometry — fixed, derived once.
const VB = 200;

// Model glyph (left).
const MODEL_X = 22;
const MODEL_Y = 86;
const MODEL_W = 28;
const MODEL_H = 28;
const MODEL_CX = MODEL_X + MODEL_W / 2;
const MODEL_CY = MODEL_Y + MODEL_H / 2;

// Eval gate (vertical bar) — the judge.
const GATE_X = 128;
const GATE_TOP = 60;
const GATE_BOT = 140;

// Track Y — horizontal axis the dots travel along.
const TRACK_Y = MODEL_CY;

// Output dots travel from emit to exit.
const EMIT_X = MODEL_X + MODEL_W + 6;
const EXIT_X = 196;
const DOT_R = 4.5;

// Tally column geometry — right edge.
const TALLY_X = 178;
const TALLY_TOP = 70;
const TALLY_GAP = 14;

// Crossing fraction along EMIT_X → EXIT_X where the gate sits.
// (Used for verdict-glyph reveal timing.)
const CROSS_FRAC = (GATE_X - EMIT_X) / (EXIT_X - EMIT_X);

// Three output slots. Verdicts pre-assigned: pass, pass, fail. (The
// article's thesis is that evals catch the misses — one in three is a
// tighter beat than three-in-three.)
type Verdict = "pass" | "fail";
const SLOTS: { phase: number; verdict: Verdict }[] = [
  { phase: 0.0, verdict: "pass" },
  { phase: 1 / 3, verdict: "pass" },
  { phase: 2 / 3, verdict: "fail" },
];

// Verdict glyph — drawn at absolute y = TRACK_Y - 8 (above the dot).
// X is 0 relative to the parent motion.g (which animates translateX with the dot).
function VerdictGlyph({ verdict }: { verdict: Verdict }) {
  const baseY = TRACK_Y - 8;
  if (verdict === "pass") {
    // Small tick mark, sits just above the dot.
    return (
      <path
        d={`M -3.2 ${baseY} L -1 ${baseY + 2.5} L 3.2 ${baseY - 2}`}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    );
  }
  // Cross mark.
  return (
    <g
      stroke="var(--color-text-muted)"
      strokeWidth={1.6}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
    >
      <line x1={-3} y1={baseY - 2} x2={3} y2={baseY + 3} />
      <line x1={3} y1={baseY - 2} x2={-3} y2={baseY + 3} />
    </g>
  );
}

// Static tally glyph — same shapes, smaller, parked in the tally column.
function TallyMark({ verdict, y }: { verdict: Verdict; y: number }) {
  if (verdict === "pass") {
    return (
      <path
        d={`M ${TALLY_X - 4} ${y + 1} L ${TALLY_X - 1.5} ${y + 3.2} L ${TALLY_X + 4} ${y - 2}`}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.85}
      />
    );
  }
  return (
    <g
      stroke="var(--color-text-muted)"
      strokeWidth={1.4}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      opacity={0.7}
    >
      <line x1={TALLY_X - 3.5} y1={y - 2.5} x2={TALLY_X + 3.5} y2={y + 2.5} />
      <line x1={TALLY_X + 3.5} y1={y - 2.5} x2={TALLY_X - 3.5} y2={y + 2.5} />
    </g>
  );
}

const DURATION = 6; // seconds per master loop

export function EvalsOrVibesCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  return (
    <motion.g initial={false} whileHover="hover">
      {/* ─── Pipeline track (chrome dash) ───────────────────────── */}
      <line
        x1={EMIT_X}
        y1={TRACK_Y}
        x2={EXIT_X - 6}
        y2={TRACK_Y}
        stroke="var(--color-rule)"
        strokeWidth={1.2}
        strokeDasharray="2 4"
        strokeLinecap="round"
        opacity={0.6}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Baseline rule ──────────────────────────────────────── */}
      <line
        x1={MODEL_X}
        y1={GATE_BOT + 18}
        x2={EXIT_X}
        y2={GATE_BOT + 18}
        stroke="var(--color-text-muted)"
        strokeWidth={1.0}
        opacity={0.28}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── Model glyph (the LLM) ──────────────────────────────── */}
      <g>
        <rect
          x={MODEL_X}
          y={MODEL_Y}
          width={MODEL_W}
          height={MODEL_H}
          rx={5}
          fill="color-mix(in oklab, var(--color-accent) 14%, transparent)"
          stroke="var(--color-accent)"
          strokeWidth={1.6}
          vectorEffect="non-scaling-stroke"
        />
        {/* Inner dot cluster — a tiny "model" mark (3 stacked dots). */}
        <circle cx={MODEL_CX - 4} cy={MODEL_CY} r={1.5} fill="var(--color-accent)" />
        <circle cx={MODEL_CX} cy={MODEL_CY} r={1.5} fill="var(--color-accent)" />
        <circle cx={MODEL_CX + 4} cy={MODEL_CY} r={1.5} fill="var(--color-accent)" />
      </g>

      {/* ─── Eval gate (vertical bar — the judge) ───────────────── */}
      <motion.line
        x1={GATE_X}
        y1={GATE_TOP}
        x2={GATE_X}
        y2={GATE_BOT}
        stroke="var(--color-accent)"
        strokeWidth={2.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={false}
        animate={
          animate
            ? { opacity: [0.55, 1, 0.55, 1, 0.55, 1, 0.55] }
            : { opacity: 1 }
        }
        transition={
          animate
            ? {
                duration: DURATION,
                repeat: Infinity,
                ease: "easeInOut",
                // Three pulse peaks aligned with the three dot crossings.
                // Crossing time of slot k = (k * (1/3)) + (1 - CROSS_FRAC) * (1/3) approximately…
                // simpler: distribute peaks at 1/6, 3/6, 5/6 of the cycle.
                times: [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1],
              }
            : undefined
        }
      />
      {/* Gate end caps — two tiny terracotta dots, "rubric anchors." */}
      <circle cx={GATE_X} cy={GATE_TOP} r={2} fill="var(--color-accent)" opacity={0.9} />
      <circle cx={GATE_X} cy={GATE_BOT} r={2} fill="var(--color-accent)" opacity={0.9} />

      {/* ─── Three output dots streaming through the gate ───────── */}
      {SLOTS.map((slot, i) => {
        // Reduced-motion freeze positions:
        //   slot 0 (pass): just past the gate (verdict visible)
        //   slot 1 (pass): mid-track between model and gate
        //   slot 2 (fail): emission point near the model
        const reducedX =
          i === 0
            ? GATE_X + 14
            : i === 1
              ? EMIT_X + (GATE_X - EMIT_X) * 0.55
              : EMIT_X + 4;
        const reducedVerdictOpacity = i === 0 ? 1 : 0;

        return (
          <motion.g
            key={`output-${i}`}
            initial={false}
            animate={
              animate
                ? { x: [EMIT_X, EXIT_X], opacity: [0, 1, 1, 1, 0] }
                : { x: reducedX, opacity: 1 }
            }
            transition={
              animate
                ? {
                    x: {
                      duration: DURATION,
                      repeat: Infinity,
                      ease: "linear",
                      delay: -slot.phase * DURATION,
                    },
                    opacity: {
                      duration: DURATION,
                      repeat: Infinity,
                      ease: "linear",
                      delay: -slot.phase * DURATION,
                      // [start, fade-in done, hold, hold, fade-out done]
                      times: [0, 0.06, 0.5, 0.92, 1],
                    },
                  }
                : undefined
            }
          >
            {/* Output dot — solid terracotta, the hero element. */}
            <circle cx={0} cy={TRACK_Y} r={DOT_R} fill="var(--color-accent)" />

            {/* Verdict glyph — invisible until the dot crosses the gate.
                Travels with the dot (parent group translates X);
                opacity flips at CROSS_FRAC of the cycle. */}
            <motion.g
              initial={false}
              animate={
                animate
                  ? { opacity: [0, 0, 1, 1, 0] }
                  : { opacity: reducedVerdictOpacity }
              }
              transition={
                animate
                  ? {
                      duration: DURATION,
                      repeat: Infinity,
                      ease: "linear",
                      delay: -slot.phase * DURATION,
                      // Reveal exactly when the dot crosses the gate.
                      times: [
                        0,
                        Math.max(0, CROSS_FRAC - 0.01),
                        Math.min(1, CROSS_FRAC + 0.02),
                        0.92,
                        1,
                      ],
                    }
                  : undefined
              }
            >
              <VerdictGlyph verdict={slot.verdict} />
            </motion.g>
          </motion.g>
        );
      })}

      {/* ─── Tally column (right edge) — running score ──────────── */}
      {/* Header tick — the "tally" cap, gives the column a visual top. */}
      <line
        x1={TALLY_X - 6}
        y1={TALLY_TOP - 10}
        x2={TALLY_X + 6}
        y2={TALLY_TOP - 10}
        stroke="var(--color-text-muted)"
        strokeWidth={1.0}
        opacity={0.45}
        vectorEffect="non-scaling-stroke"
      />
      <TallyMark verdict="pass" y={TALLY_TOP} />
      <TallyMark verdict="pass" y={TALLY_TOP + TALLY_GAP} />
      <TallyMark verdict="fail" y={TALLY_TOP + TALLY_GAP * 2} />
    </motion.g>
  );
}

/**
 * EvalsOrVibesCoverStatic — Satori-safe pure-JSX export.
 *
 * Reduced-motion / OG end-state: a frozen mid-cycle moment.
 *   - Output dot 0 just past the gate, tick attached.
 *   - Output dot 1 mid-track.
 *   - Output dot 2 at emission near the model.
 *   - Eval gate at full opacity.
 *   - Tally: pass, pass, fail.
 *
 * Inline hex palette only (no CSS vars, no color-mix, no hooks).
 */
export function EvalsOrVibesCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  const RULE = "#2a2622";
  // color-mix(accent 14% + transparent) over BG #0e1114
  const ACCENT_TINT = "#241813";

  // Reduced freeze positions, mirrored from the animated component.
  const dot0X = GATE_X + 14;
  const dot1X = EMIT_X + (GATE_X - EMIT_X) * 0.55;
  const dot2X = EMIT_X + 4;

  return (
    <svg
      viewBox={`0 0 ${VB} ${VB}`}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Pipeline track */}
      <line
        x1={EMIT_X}
        y1={TRACK_Y}
        x2={EXIT_X - 6}
        y2={TRACK_Y}
        stroke={RULE}
        strokeWidth={1.2}
        strokeDasharray="2 4"
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* Baseline rule */}
      <line
        x1={MODEL_X}
        y1={GATE_BOT + 18}
        x2={EXIT_X}
        y2={GATE_BOT + 18}
        stroke={MUTED}
        strokeWidth={1.0}
        opacity={0.28}
      />

      {/* Model glyph */}
      <rect
        x={MODEL_X}
        y={MODEL_Y}
        width={MODEL_W}
        height={MODEL_H}
        rx={5}
        fill={ACCENT_TINT}
        stroke={ACCENT}
        strokeWidth={1.6}
      />
      <circle cx={MODEL_CX - 4} cy={MODEL_CY} r={1.5} fill={ACCENT} />
      <circle cx={MODEL_CX} cy={MODEL_CY} r={1.5} fill={ACCENT} />
      <circle cx={MODEL_CX + 4} cy={MODEL_CY} r={1.5} fill={ACCENT} />

      {/* Eval gate */}
      <line
        x1={GATE_X}
        y1={GATE_TOP}
        x2={GATE_X}
        y2={GATE_BOT}
        stroke={ACCENT}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <circle cx={GATE_X} cy={GATE_TOP} r={2} fill={ACCENT} opacity={0.9} />
      <circle cx={GATE_X} cy={GATE_BOT} r={2} fill={ACCENT} opacity={0.9} />

      {/* Output dot 0 — past the gate, with tick */}
      <circle cx={dot0X} cy={TRACK_Y} r={DOT_R} fill={ACCENT} />
      <path
        d={`M ${dot0X - 3.2} ${TRACK_Y - 8} L ${dot0X - 1} ${TRACK_Y - 5.5} L ${dot0X + 3.2} ${TRACK_Y - 10}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Output dot 1 — mid-track */}
      <circle cx={dot1X} cy={TRACK_Y} r={DOT_R} fill={ACCENT} />

      {/* Output dot 2 — emission */}
      <circle cx={dot2X} cy={TRACK_Y} r={DOT_R} fill={ACCENT} />

      {/* Tally column */}
      <line
        x1={TALLY_X - 6}
        y1={TALLY_TOP - 10}
        x2={TALLY_X + 6}
        y2={TALLY_TOP - 10}
        stroke={MUTED}
        strokeWidth={1.0}
        opacity={0.45}
      />
      <path
        d={`M ${TALLY_X - 4} ${TALLY_TOP + 1} L ${TALLY_X - 1.5} ${TALLY_TOP + 3.2} L ${TALLY_X + 4} ${TALLY_TOP - 2}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      <path
        d={`M ${TALLY_X - 4} ${TALLY_TOP + TALLY_GAP + 1} L ${TALLY_X - 1.5} ${TALLY_TOP + TALLY_GAP + 3.2} L ${TALLY_X + 4} ${TALLY_TOP + TALLY_GAP - 2}`}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
      <line
        x1={TALLY_X - 3.5}
        y1={TALLY_TOP + TALLY_GAP * 2 - 2.5}
        x2={TALLY_X + 3.5}
        y2={TALLY_TOP + TALLY_GAP * 2 + 2.5}
        stroke={MUTED}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
      />
      <line
        x1={TALLY_X + 3.5}
        y1={TALLY_TOP + TALLY_GAP * 2 - 2.5}
        x2={TALLY_X - 3.5}
        y2={TALLY_TOP + TALLY_GAP * 2 + 2.5}
        stroke={MUTED}
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
      />
    </svg>
  );
}
