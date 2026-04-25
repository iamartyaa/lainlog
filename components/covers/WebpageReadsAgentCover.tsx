"use client";

import { motion, useMotionValue, useTransform, useReducedMotion, animate } from "motion/react";
import { useEffect } from "react";
import { useCoverInView } from "./_CoverFrame";

/**
 * WebpageReadsAgentCover — magnifier sweeps over text-stub lines, hidden
 * glyph reveals when the magnifier passes over it.
 *
 * Concept (concepts.md §5): prompt injection — "what did the agent actually
 * read?" The act of reading IS what reveals the threat. The magnifier is the
 * agent's attention; the hidden glyph is the injected payload.
 *
 * Animation primitive: a single motion value (`magnifierX`) drives the
 * magnifier's translate AND the glyph's opacity (the latter via
 * `useTransform` — derived signal, not a second tween, per killed list
 * round 1).
 *
 * Effective period 9s. Phase offset 5.6s. Sweep is async via `animate(mv, …)`
 * because we need a single shared driver, not two parallel motion props.
 *
 * Reduced-motion + off-screen → magnifier centred over hidden glyph
 * (cx=44), glyph at full opacity. The static frame IS the article's thesis:
 * "the agent IS reading and DOES find the hidden thing."
 */
export function WebpageReadsAgentCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();

  // Single driver: magnifier x-centre. Default sits at 44 (the glyph) so the
  // reduced-motion / off-screen frame IS the teaching frame.
  const magnifierX = useMotionValue(44);

  // Derived signal — glyph opacity peaks when |magnifierX - 44| < 8.
  // Outside ±8 → opacity 0; inside → ramps up to 1. One primitive, derived.
  const glyphOpacity = useTransform(
    magnifierX,
    [30, 36, 44, 52, 58],
    [0, 0.3, 1, 0.3, 0],
  );

  useEffect(() => {
    const shouldAnimate = inView && !reduced;
    if (!shouldAnimate) {
      // Snap to teaching frame when paused.
      magnifierX.set(44);
      return;
    }
    // 9s loop: sweep 20→70 over 4.5s, hold 1.5s, return to 20 over 1s, idle 2s.
    const controls = animate(magnifierX, [20, 70, 70, 20, 20], {
      duration: 9,
      times: [0, 0.5, 0.67, 0.78, 1],
      ease: "easeInOut",
      repeat: Infinity,
      delay: 5.6,
    });
    return () => controls.stop();
  }, [inView, reduced, magnifierX]);

  return (
    <g>
      {/* Three short text-stub lines — static, muted. */}
      <line
        x1={20}
        y1={38}
        x2={72}
        y2={38}
        stroke="var(--color-text-muted)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.6}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={20}
        y1={50}
        x2={68}
        y2={50}
        stroke="var(--color-text-muted)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.6}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={20}
        y1={62}
        x2={74}
        y2={62}
        stroke="var(--color-text-muted)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeOpacity={0.6}
        vectorEffect="non-scaling-stroke"
      />

      {/* Hidden glyph — small accent "×" at the centre of the middle line.
          Opacity is a derived function of magnifier x. Two crossing strokes
          are stroked thicker than the text stubs so the glyph reads at 64px
          even when the magnifier is parked over it. */}
      <motion.g style={{ opacity: glyphOpacity }}>
        <line
          x1={41}
          y1={47}
          x2={47}
          y2={53}
          stroke="var(--color-accent)"
          strokeWidth={1.8}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={47}
          y1={47}
          x2={41}
          y2={53}
          stroke="var(--color-accent)"
          strokeWidth={1.8}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </motion.g>

      {/* Magnifier — circle + handle. cx tied to magnifierX motion value.
          We use motion.circle's `cx` prop (animatable in motion v12) and
          a paired motion.line for the handle, both reading the same driver
          via `useTransform` to keep the relative geometry stable. */}
      <motion.circle
        cx={magnifierX}
        cy={50}
        r={10}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
      />
      <motion.line
        x1={useTransform(magnifierX, (v) => v + 8)}
        y1={58}
        x2={useTransform(magnifierX, (v) => v + 16)}
        y2={66}
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
}
