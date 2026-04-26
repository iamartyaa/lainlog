"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { WidgetShell } from "@/components/viz/WidgetShell";
import { PRESS, SPRING } from "@/lib/motion";
import { playSound } from "@/lib/audio";

/**
 * DeclarationStates — W2 of "how JavaScript reads its own future".
 *
 * Single verb: click-toggle (segmented control × 4). Each branch shows what
 * the named binding looks like at the *moment line 1 is about to run*.
 * Uninitialized cells (TDZ) use a hatched fill pattern — shape conveys state,
 * not just colour.
 *
 * Frame-stability R6: 360 wide, fixed canvas height across all four states.
 * Caption uses identical sentence template per state.
 */

type Kind = "var" | "let" | "fnDecl" | "varFnExpr";

type State = {
  id: Kind;
  label: string;
  /** ≤ 18 chars per line; two lines max. */
  snippet: [string, string];
  binding: {
    name: string;
    /** "value" | "uninitialized" | "fn-bound" | "value-undefined". */
    shape: "value" | "uninitialized" | "fn-bound";
    /** Right-cell text. */
    valueText: string;
  };
  caption: React.ReactNode;
};

const STATES: State[] = [
  {
    id: "var",
    label: "var",
    snippet: ["console.log(x)", "var x = 5"],
    binding: {
      name: "x",
      shape: "value",
      valueText: "undefined",
    },
    caption: (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          var
        </span>{" "}
        — binding installed, value{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>undefined</span>.
        Reading it returns{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>undefined</span> — no
        error.
      </>
    ),
  },
  {
    id: "let",
    label: "let / const / class",
    snippet: ["console.log(x)", "let x = 5"],
    binding: {
      name: "x",
      shape: "uninitialized",
      valueText: "<uninit>",
    },
    caption: (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          let / const / class
        </span>{" "}
        — binding exists, but reading it throws a{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>
          ReferenceError
        </span>
        . That&apos;s the TDZ.
      </>
    ),
  },
  {
    id: "fnDecl",
    label: "function f()",
    snippet: ["f()", "function f(){}"],
    binding: {
      name: "f",
      shape: "fn-bound",
      valueText: "[fn ƒ]",
    },
    caption: (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          function declaration
        </span>{" "}
        — binding installed and already pointing at the function value.
        Calling it from above the declaration line just works.
      </>
    ),
  },
  {
    id: "varFnExpr",
    label: "var f = function",
    snippet: ["f()", "var f = function(){}"],
    binding: {
      name: "f",
      shape: "value",
      valueText: "undefined",
    },
    caption: (
      <>
        <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
          var with a function expression
        </span>{" "}
        — only the{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>var</span> binding
        survives the pre-walk. Calling it throws{" "}
        <span style={{ fontFamily: "var(--font-mono)" }}>TypeError</span> — not
        a function (yet).
      </>
    ),
  },
];

type Props = { initialKind?: Kind };

export function DeclarationStates({ initialKind = "var" }: Props) {
  const [kindId, setKindId] = useState<Kind>(initialKind);
  const state = useMemo(
    () => STATES.find((s) => s.id === kindId) ?? STATES[0],
    [kindId],
  );
  const hatchId = useId();
  const hatchPattern = `bs-tdz-hatch-${hatchId.replace(/:/g, "")}`;

  // Geometry — 360 wide.
  const WIDTH = 360;
  const PAD = 14;
  const SNIPPET_Y = 18;
  const SNIPPET_H = 60;
  const MEM_Y = SNIPPET_Y + SNIPPET_H + 18;
  const MEM_H = 76;
  const HEIGHT = MEM_Y + MEM_H + 14;

  return (
    <WidgetShell
      title="declarations · at line 1"
      caption={state.caption}
      captionTone="prominent"
      controls={
        <div
          role="group"
          aria-label="Declaration kind"
          className="flex flex-wrap items-center gap-[var(--spacing-2xs)] font-sans"
          style={{ fontSize: "var(--text-ui)" }}
        >
          {STATES.map((s) => {
            const active = s.id === kindId;
            return (
              <motion.button
                key={s.id}
                type="button"
                onClick={() => {
                  if (s.id !== kindId) playSound("Radio");
                  setKindId(s.id);
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
                {s.label}
              </motion.button>
            );
          })}
        </div>
      }
    >
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
        aria-label={`Declaration state. Kind: ${state.label}. Binding ${state.binding.name} = ${state.binding.valueText}.`}
      >
        <defs>
          <pattern
            id={hatchPattern}
            patternUnits="userSpaceOnUse"
            width="6"
            height="6"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="6"
              stroke="var(--color-text-muted)"
              strokeWidth="1.4"
            />
          </pattern>
        </defs>

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
          AT LINE 1
        </text>

        <motion.g
          key={`snip-${state.id}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING.smooth}
        >
          {state.snippet.map((line, i) => (
            <text
              key={i}
              x={PAD + 12}
              y={SNIPPET_Y + 32 + i * 18}
              fontFamily="var(--font-mono)"
              fontSize={12}
              fill={i === 0 ? "var(--color-accent)" : "var(--color-text)"}
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

        {/* Memory pane */}
        <rect
          x={PAD}
          y={MEM_Y}
          width={WIDTH - PAD * 2}
          height={MEM_H}
          rx={3}
          fill="color-mix(in oklab, var(--color-surface) 35%, transparent)"
          stroke="var(--color-accent)"
          strokeWidth={1.4}
        />
        <text
          x={PAD + 8}
          y={MEM_Y + 14}
          fontFamily="var(--font-sans)"
          fontSize={9}
          letterSpacing="0.08em"
          fill="var(--color-text-muted)"
        >
          MEMORY · CREATION-PHASE STATE
        </text>

        {/* Binding row — name + state cell */}
        <motion.g
          key={`mem-${state.id}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING.smooth}
        >
          <text
            x={PAD + 14}
            y={MEM_Y + 44}
            fontFamily="var(--font-mono)"
            fontSize={13}
            fill="var(--color-text)"
          >
            {state.binding.name}
          </text>

          {/* The state cell — shape conveys state, not just colour. */}
          {state.binding.shape === "value" ? (
            <rect
              x={WIDTH / 2 - 4}
              y={MEM_Y + 30}
              width={WIDTH / 2 - PAD - 4}
              height={28}
              rx={2}
              fill="color-mix(in oklab, var(--color-accent) 18%, transparent)"
              stroke="var(--color-accent)"
              strokeWidth={1}
            />
          ) : state.binding.shape === "uninitialized" ? (
            <g>
              <rect
                x={WIDTH / 2 - 4}
                y={MEM_Y + 30}
                width={WIDTH / 2 - PAD - 4}
                height={28}
                rx={2}
                fill={`url(#${hatchPattern})`}
                stroke="var(--color-text-muted)"
                strokeWidth={1.4}
                strokeDasharray="3 2"
              />
            </g>
          ) : (
            // fn-bound — rounded pill (different shape)
            <rect
              x={WIDTH / 2 - 4}
              y={MEM_Y + 30}
              width={WIDTH / 2 - PAD - 4}
              height={28}
              rx={14}
              fill="color-mix(in oklab, var(--color-accent) 26%, transparent)"
              stroke="var(--color-accent)"
              strokeWidth={1.4}
            />
          )}

          <text
            x={WIDTH / 2 - 4 + (WIDTH / 2 - PAD - 4) / 2}
            y={MEM_Y + 48}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={11}
            fill={
              state.binding.shape === "uninitialized"
                ? "var(--color-text)"
                : "var(--color-text)"
            }
            fontWeight={state.binding.shape === "fn-bound" ? 600 : 400}
          >
            {state.binding.valueText}
          </text>
        </motion.g>
      </svg>
    </WidgetShell>
  );
}
