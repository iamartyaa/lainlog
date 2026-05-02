"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { PRESS, SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

/**
 * WhyTwoPasses — W4 of "how JavaScript reads its own future".
 *
 * Single verb: click-toggle (segmented control × 3). Each branch is a tiny
 * "without the pre-walk, this would..." counterfactual. Shows the spec-forced
 * rationale that's buried in the spec and never surfaced pedagogically.
 *
 * Frame-stability R6: 360 wide, fixed canvas height across all three states.
 */

type ReasonId = "callable" | "duplicate" | "const";

type Reason = {
  id: ReasonId;
  label: string;
  /** Tiny snippet, two lines. */
  snippet: [string, string];
  /** Without-prewalk counterfactual outcome. */
  without: {
    label: string;
    body: string;
  };
  /** What actually happens, thanks to the pre-walk. */
  withIt: {
    label: string;
    body: string;
  };
  caption: React.ReactNode;
};

const REASONS: Reason[] = [
  {
    id: "callable",
    label: "callable from above",
    snippet: ["f()", "function f(){}"],
    without: {
      label: "without pre-walk",
      body: "ReferenceError: f is not defined.",
    },
    withIt: {
      label: "with pre-walk",
      body: "f is bound at creation. The call works.",
    },
    caption: (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          Function declarations must be callable from anywhere in scope.
        </span>{" "}
        That guarantee is the spec — and it forces the engine to install all
        function bindings before line 1.
      </>
    ),
  },
  {
    id: "duplicate",
    label: "duplicate let",
    snippet: ["let x = 1", "let x = 2"],
    without: {
      label: "without pre-walk",
      body: "Line 1 runs, x = 1. Then line 2 runs too.",
    },
    withIt: {
      label: "with pre-walk",
      body: "SyntaxError detected before any line executes.",
    },
    caption: (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          Duplicate let / const declarations must be a SyntaxError, not a
          runtime surprise.
        </span>{" "}
        The only way to enforce that is to scan every binding in the scope
        first, then refuse to start.
      </>
    ),
  },
  {
    id: "const",
    label: "const semantics",
    snippet: ["console.log(x)", "const x = 1"],
    without: {
      label: "without pre-walk",
      body: "x reads as undefined — a const that already had a value before its initializer.",
    },
    withIt: {
      label: "with pre-walk",
      body: "x is uninitialized (TDZ). Reading it throws.",
    },
    caption: (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          const semantics need a pre-binding.
        </span>{" "}
        If a{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>const</span> read as{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>undefined</span>{" "}
        before its initializer, immutability would be incoherent. The TDZ is
        the resolution.
      </>
    ),
  },
];

type Props = { initialReason?: ReasonId };

export function WhyTwoPasses({ initialReason = "callable" }: Props) {
  const [reasonId, setReasonId] = useState<ReasonId>(initialReason);
  const reason = useMemo(
    () => REASONS.find((r) => r.id === reasonId) ?? REASONS[0],
    [reasonId],
  );

  // Geometry — 360 wide.
  const WIDTH = 360;
  const PAD = 14;
  const SNIPPET_Y = 18;
  const SNIPPET_H = 56;
  const OUTCOME_Y = SNIPPET_Y + SNIPPET_H + 14;
  const OUTCOME_H = 56;
  const OUTCOME_GAP = 10;
  const OUTCOME_TOTAL_H = OUTCOME_H * 2 + OUTCOME_GAP;
  const HEIGHT = OUTCOME_Y + OUTCOME_TOTAL_H + 14;

  const canvasNode = (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{
        maxWidth: WIDTH,
        height: "auto",
        display: "block",
        margin: "0 auto",
      }}
      role="img"
      aria-label={`Reason: ${reason.label}. Counterfactual: ${reason.without.body} With pre-walk: ${reason.withIt.body}`}
    >
      {/* Snippet pane */}
      <rect
        x={PAD}
        y={SNIPPET_Y}
        width={WIDTH - PAD * 2}
        height={SNIPPET_H}
        rx={3}
        fill="color-mix(in oklab, var(--color-surface) 35%, transparent)"
        stroke="var(--color-rule)"
        strokeWidth={1}
      />
      <text
        x={PAD + 8}
        y={SNIPPET_Y + 14}
        fontFamily="var(--font-sans)"
        fontSize={9}
        letterSpacing="0.08em"
        fill="var(--color-text-muted)"
      >
        SNIPPET
      </text>
      <motion.g
        key={`snip-${reason.id}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
      >
        {reason.snippet.map((line, i) => (
          <text
            key={i}
            x={PAD + 12}
            y={SNIPPET_Y + 30 + i * 16}
            fontFamily="var(--font-mono)"
            fontSize={12}
            fill="var(--color-text)"
          >
            <tspan
              fontFamily="var(--font-mono)"
              fontSize={10}
              fill="var(--color-text-muted)"
            >
              {i + 1}
            </tspan>
            <tspan dx={10}>{line}</tspan>
          </text>
        ))}
      </motion.g>

      {/* "Without" outcome — drawn first, dimmer */}
      <motion.g
        key={`without-${reason.id}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
      >
        <rect
          x={PAD}
          y={OUTCOME_Y}
          width={WIDTH - PAD * 2}
          height={OUTCOME_H}
          rx={3}
          fill="transparent"
          stroke="var(--color-text-muted)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text
          x={PAD + 8}
          y={OUTCOME_Y + 14}
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill="var(--color-text-muted)"
        >
          {reason.without.label.toUpperCase()}
        </text>
        <text
          x={PAD + 12}
          y={OUTCOME_Y + 36}
          fontFamily="var(--font-sans)"
          fontSize={11}
          fill="var(--color-text-muted)"
        >
          {wrapText(reason.without.body, 44).map((line, i) => (
            <tspan key={i} x={PAD + 12} dy={i === 0 ? 0 : 14}>
              {line}
            </tspan>
          ))}
        </text>
      </motion.g>

      {/* "With" outcome — drawn second, accented */}
      <motion.g
        key={`with-${reason.id}`}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.06 }}
      >
        <rect
          x={PAD}
          y={OUTCOME_Y + OUTCOME_H + OUTCOME_GAP}
          width={WIDTH - PAD * 2}
          height={OUTCOME_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-accent) 12%, transparent)"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
        />
        <text
          x={PAD + 8}
          y={OUTCOME_Y + OUTCOME_H + OUTCOME_GAP + 14}
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill="var(--color-accent)"
        >
          {reason.withIt.label.toUpperCase()}
        </text>
        <text
          x={PAD + 12}
          y={OUTCOME_Y + OUTCOME_H + OUTCOME_GAP + 36}
          fontFamily="var(--font-sans)"
          fontSize={11}
          fill="var(--color-text)"
        >
          {wrapText(reason.withIt.body, 44).map((line, i) => (
            <tspan key={i} x={PAD + 12} dy={i === 0 ? 0 : 14}>
              {line}
            </tspan>
          ))}
        </text>
      </motion.g>
    </svg>
  );

  return (
    <WidgetShell
      title="two passes · why"
      state={reason.caption}
      canvas={canvasNode}
      controls={
        <div
          role="group"
          aria-label="Reason"
          className="flex flex-wrap items-center gap-[var(--spacing-2xs)] font-sans"
          style={{ fontSize: "var(--text-ui)" }}
        >
          {REASONS.map((r) => {
            const active = r.id === reasonId;
            return (
              <motion.button
                key={r.id}
                type="button"
                onClick={() => {
                  if (r.id !== reasonId) playSound("Radio");
                  setReasonId(r.id);
                }}
                aria-pressed={active}
                style={{
                  minHeight: 44,
                  padding: "0 var(--spacing-sm)",
                  borderRadius: "var(--radius-sm)",
                  border: `1px solid ${active ? "var(--color-accent)" : "var(--color-rule)"}`,
                  background: active
                    ? "color-mix(in oklab, var(--color-accent) 14%, transparent)"
                    : "transparent",
                  color: active
                    ? "var(--color-accent)"
                    : "var(--color-text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  cursor: "pointer",
                }}
                {...PRESS}
              >
                {r.label}
              </motion.button>
            );
          })}
        </div>
      }
    />
  );
}

/** Tiny word-wrap for SVG <text> at a fixed character column. */
function wrapText(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}
