"use client";

import { motion, useReducedMotion } from "motion/react";
import { useCoverInView } from "./_CoverFrame";

/**
 * McpsExplainedCover — the three-message handshake.
 *
 * One sentence:
 *   The handshake IS the protocol — three message envelopes cross the gap
 *   between client and server, and a contract pins them at the end.
 *
 * Composition (10 load-bearing elements, ≤14 budget per playbook §2):
 *  1.  Client lane rect (top, translucent accent tint)
 *  2.  Server lane rect (bottom, muted surface)
 *  3.  Client label dot (left of client lane, accent)
 *  4.  Server label dot (left of server lane, muted)
 *  5.  m1 envelope group — "initialize", client → server (rightward draw)
 *  6.  m2 envelope group — "capabilities", server → client (leftward draw)
 *  7.  m3 envelope group — "initialized", client → server (rightward draw, smaller)
 *  8.  Contract bracket left half — appears at end of m3, holds
 *  9.  Contract bracket right half — appears at end of m3, holds
 *  10. Faint guide line through the gap (single chrome line)
 *
 * Register: refined pedagogical / reveal (playbook §14).
 *  - Translucent fills + thin strokes on chrome lanes; solid terracotta
 *    only on the three envelopes (the hero gesture).
 *  - Opacity-led motion. No scale-led pulses on chrome.
 *  - Single hero gesture per envelope: a clean reveal across the gap.
 *
 * Motion (5.5s loop, continuous, no idle gap):
 *  - 0.00–0.25: m1 envelope reveals + travels rightward.
 *  - 0.25–0.50: m2 envelope reveals + travels leftward.
 *  - 0.50–0.75: m3 envelope reveals + travels rightward (smaller).
 *  - 0.75–0.90: contract bracket fades in; envelopes hold.
 *  - 0.90–1.00: bracket holds; loop wraps cleanly.
 *
 * Reduced-motion end-state: all three envelopes delivered; contract bracket
 * visible in the gap. The "handshake completed" frame.
 *
 * Frame-stability R6: only opacity / pathLength / transform animate. Tokens-only.
 */
export function McpsExplainedCover() {
  const inView = useCoverInView();
  const reduced = useReducedMotion();
  const animate = inView && !reduced;

  // ─── Geometry ───────────────────────────────────────────────
  const laneX = 28;
  const laneW = 144;
  const laneH = 28;
  const clientY = 48;
  const serverY = 124;

  // Envelope ride midY's — staggered vertically so all three remain visible
  // when settled in the static end-state.
  const m1Y = 86;
  const m2Y = 100;
  const m3Y = 114;

  return (
    <g>
      {/* ─── 1. Client lane (top, translucent accent tint) ─── */}
      <rect
        x={laneX}
        y={clientY}
        width={laneW}
        height={laneH}
        rx={6}
        fill="color-mix(in oklab, var(--color-accent) 10%, transparent)"
        stroke="color-mix(in oklab, var(--color-accent) 32%, transparent)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── 2. Server lane (bottom, muted surface) ─── */}
      <rect
        x={laneX}
        y={serverY}
        width={laneW}
        height={laneH}
        rx={6}
        fill="var(--color-surface)"
        stroke="var(--color-rule)"
        strokeWidth={1.2}
        vectorEffect="non-scaling-stroke"
      />

      {/* ─── 3. Client label dot ─── */}
      <circle
        cx={laneX - 10}
        cy={clientY + laneH / 2}
        r={2.4}
        fill="var(--color-accent)"
      />

      {/* ─── 4. Server label dot ─── */}
      <circle
        cx={laneX - 10}
        cy={serverY + laneH / 2}
        r={2.4}
        fill="var(--color-text-muted)"
      />

      {/* ─── 10. Faint guide line through the gap ─── */}
      <line
        x1={laneX + 4}
        y1={100}
        x2={laneX + laneW - 4}
        y2={100}
        stroke="var(--color-rule)"
        strokeWidth={0.8}
        strokeDasharray="2 4"
        vectorEffect="non-scaling-stroke"
        opacity={0.55}
      />

      {/* ─── 5. m1 envelope: client → server (rightward) ─── */}
      <Envelope
        startX={laneX + 6}
        endX={laneX + laneW - 28}
        midY={m1Y}
        w={26}
        h={14}
        animate={animate}
        // Opacity + x keyframes share the same 5-step times.
        // Reveal window: 0.00 → 0.25.
        opacityKeys={[0, 1, 1, 1, 1]}
        xKeyFrac={[0, 1, 1, 1, 1]}
        times={[0, 0.25, 0.55, 0.85, 1]}
        flapDir="right"
      />

      {/* ─── 6. m2 envelope: server → client (leftward) ─── */}
      <Envelope
        startX={laneX + laneW - 28 - 6}
        endX={laneX + 8}
        midY={m2Y}
        w={26}
        h={14}
        animate={animate}
        // Reveal window: 0.25 → 0.50.
        opacityKeys={[0, 0, 1, 1, 1]}
        xKeyFrac={[0, 0, 1, 1, 1]}
        times={[0, 0.25, 0.5, 0.85, 1]}
        flapDir="left"
      />

      {/* ─── 7. m3 envelope: client → server (rightward, smaller, notification) ─── */}
      <Envelope
        startX={laneX + 6}
        endX={laneX + laneW - 24}
        midY={m3Y}
        w={20}
        h={12}
        animate={animate}
        // Reveal window: 0.50 → 0.75.
        opacityKeys={[0, 0, 0, 1, 1]}
        xKeyFrac={[0, 0, 0, 1, 1]}
        times={[0, 0.25, 0.5, 0.75, 1]}
        flapDir="right"
        notification
      />

      {/* ─── 8 & 9. Contract bracket — fades in at end of m3 ─── */}
      <ContractBracket animate={animate} />
    </g>
  );
}

/**
 * Envelope — small rect + flap V, optionally a notification dot.
 *
 * Motion: parent motion.g translates from startX to endX on a 5.5s loop;
 * inner content fades in via opacity at the assigned reveal window.
 */
function Envelope({
  startX,
  endX,
  midY,
  w,
  h,
  animate,
  opacityKeys,
  xKeyFrac,
  times,
  flapDir,
  notification = false,
}: {
  startX: number;
  endX: number;
  midY: number;
  w: number;
  h: number;
  animate: boolean;
  opacityKeys: number[];
  xKeyFrac: number[];
  times: number[];
  flapDir: "left" | "right";
  notification?: boolean;
}) {
  const xKeys = xKeyFrac.map((f) => startX + (endX - startX) * f);
  // Apex of flap V — slight asymmetric tilt favouring the travel direction.
  const apexShift = flapDir === "right" ? 1.5 : -1.5;

  return (
    <motion.g
      initial={{ opacity: 0, x: startX }}
      animate={
        animate
          ? { opacity: opacityKeys, x: xKeys }
          : { opacity: 1, x: endX }
      }
      transition={
        animate
          ? {
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              times,
            }
          : undefined
      }
    >
      <rect
        x={-w / 2}
        y={midY - h / 2}
        width={w}
        height={h}
        rx={1.5}
        fill="color-mix(in oklab, var(--color-accent) 18%, transparent)"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M ${-w / 2} ${midY - h / 2} L ${apexShift} ${midY - h / 2 + 3.4} L ${w / 2} ${midY - h / 2}`}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {notification && (
        <circle
          cx={w / 2 + 4}
          cy={midY - h / 2 + 1}
          r={1}
          fill="var(--color-accent)"
        />
      )}
    </motion.g>
  );
}

/**
 * ContractBracket — two thin terracotta brackets that frame the gap centre,
 * fade in at the end of m3, and hold for the static end-state.
 *
 * The single quiet support gesture per playbook §14 — opacity-led, gentle.
 */
function ContractBracket({ animate }: { animate: boolean }) {
  const cy = 100;
  const halfSpan = 18;
  const bracketH = 18;
  const tabW = 5;

  // Opacity keys: hidden until 0.75 (m3 settled), fades in 0.75 → 0.90, holds.
  const opacityKeys = [0, 0, 0, 0, 1, 1];
  const times = [0, 0.25, 0.5, 0.75, 0.9, 1];

  const leftX = -halfSpan;
  const leftPath = `M ${leftX + tabW} ${cy - bracketH / 2} L ${leftX} ${cy - bracketH / 2} L ${leftX} ${cy + bracketH / 2} L ${leftX + tabW} ${cy + bracketH / 2}`;
  const rightX = halfSpan;
  const rightPath = `M ${rightX - tabW} ${cy - bracketH / 2} L ${rightX} ${cy - bracketH / 2} L ${rightX} ${cy + bracketH / 2} L ${rightX - tabW} ${cy + bracketH / 2}`;

  return (
    <motion.g
      transform="translate(100 0)"
      initial={{ opacity: 0 }}
      animate={animate ? { opacity: opacityKeys } : { opacity: 1 }}
      transition={
        animate
          ? {
              duration: 5.5,
              repeat: Infinity,
              ease: "easeInOut",
              times,
            }
          : undefined
      }
    >
      <path
        d={leftPath}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={rightPath}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </motion.g>
  );
}

/**
 * McpsExplainedCoverStatic — Satori-safe pure-JSX export.
 *
 * Reduced-motion end-state: all three envelopes have been delivered to their
 * destinations; contract bracket holds in the gap. Reads as "the handshake
 * completed — three envelopes pinned by a contract."
 *
 * Hex palette inlined per static-registry.ts contract. color-mix() values
 * approximated against BG #0e1114.
 */
export function McpsExplainedCoverStatic() {
  const ACCENT = "#d97341";
  const MUTED = "#7a7570";
  const SURFACE = "#1a1714";
  const RULE = "#2a2622";
  // Approximations of color-mix(accent X% + transparent) over BG #0e1114:
  const ACCENT_TINT_FILL = "#221814";
  const ACCENT_TINT_STROKE = "#4f2f24";
  const ENVELOPE_FILL = "#2e1d18";

  const laneX = 28;
  const laneW = 144;
  const laneH = 28;
  const clientY = 48;
  const serverY = 124;

  // Envelope rest positions (after delivery).
  const m1RestX = laneX + laneW - 28;
  const m2RestX = laneX + 8;
  const m3RestX = laneX + laneW - 24;
  const m1Y = 86;
  const m2Y = 100;
  const m3Y = 114;

  // Contract bracket geometry (viewBox-centred at x=100).
  const cy = 100;
  const halfSpan = 18;
  const bracketH = 18;
  const tabW = 5;

  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
    >
      {/* Client lane */}
      <rect
        x={laneX}
        y={clientY}
        width={laneW}
        height={laneH}
        rx={6}
        fill={ACCENT_TINT_FILL}
        stroke={ACCENT_TINT_STROKE}
        strokeWidth={1.2}
      />
      {/* Server lane */}
      <rect
        x={laneX}
        y={serverY}
        width={laneW}
        height={laneH}
        rx={6}
        fill={SURFACE}
        stroke={RULE}
        strokeWidth={1.2}
      />
      {/* Lane label dots */}
      <circle cx={laneX - 10} cy={clientY + laneH / 2} r={2.4} fill={ACCENT} />
      <circle cx={laneX - 10} cy={serverY + laneH / 2} r={2.4} fill={MUTED} />

      {/* Gap guide line */}
      <line
        x1={laneX + 4}
        y1={100}
        x2={laneX + laneW - 4}
        y2={100}
        stroke={RULE}
        strokeWidth={0.8}
        strokeDasharray="2 4"
        opacity={0.55}
      />

      {/* m1 envelope — delivered right (client → server) */}
      <g transform={`translate(${m1RestX} 0)`}>
        <rect
          x={-13}
          y={m1Y - 7}
          width={26}
          height={14}
          rx={1.5}
          fill={ENVELOPE_FILL}
          stroke={ACCENT}
          strokeWidth={1.6}
        />
        <path
          d={`M -13 ${m1Y - 7} L 1.5 ${m1Y - 7 + 3.4} L 13 ${m1Y - 7}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </g>

      {/* m2 envelope — delivered left (server → client) */}
      <g transform={`translate(${m2RestX} 0)`}>
        <rect
          x={-13}
          y={m2Y - 7}
          width={26}
          height={14}
          rx={1.5}
          fill={ENVELOPE_FILL}
          stroke={ACCENT}
          strokeWidth={1.6}
        />
        <path
          d={`M -13 ${m2Y - 7} L -1.5 ${m2Y - 7 + 3.4} L 13 ${m2Y - 7}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
      </g>

      {/* m3 envelope — delivered right (client → server, smaller, notification) */}
      <g transform={`translate(${m3RestX} 0)`}>
        <rect
          x={-10}
          y={m3Y - 6}
          width={20}
          height={12}
          rx={1.5}
          fill={ENVELOPE_FILL}
          stroke={ACCENT}
          strokeWidth={1.6}
        />
        <path
          d={`M -10 ${m3Y - 6} L 1.5 ${m3Y - 6 + 3} L 10 ${m3Y - 6}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.4}
          strokeLinecap="round"
        />
        <circle cx={14} cy={m3Y - 6 + 1} r={1} fill={ACCENT} />
      </g>

      {/* Contract bracket — settled in the gap */}
      <g transform="translate(100 0)">
        <path
          d={`M ${-halfSpan + tabW} ${cy - bracketH / 2} L ${-halfSpan} ${cy - bracketH / 2} L ${-halfSpan} ${cy + bracketH / 2} L ${-halfSpan + tabW} ${cy + bracketH / 2}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`M ${halfSpan - tabW} ${cy - bracketH / 2} L ${halfSpan} ${cy - bracketH / 2} L ${halfSpan} ${cy + bracketH / 2} L ${halfSpan - tabW} ${cy + bracketH / 2}`}
          fill="none"
          stroke={ACCENT}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
